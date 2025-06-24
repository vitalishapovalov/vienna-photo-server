#!/bin/bash

# Configuration
ENABLE_BW_FILTER=true  # Set to 'false' to disable black & white filter

TEMPLATE="/home/pi/retroprint/template.png"
PHOTO="/home/pi/retroprint/input/latest.jpg"
OUTPUT="/home/pi/retroprint/output/printed_$(date +%s).png"

# Temporary files
TEMP_PHOTO="/home/pi/retroprint/tmp/photo_cropped_$$.png"
TEMP_ALPHA="/home/pi/retroprint/tmp/alpha_$$.png"
TEMP_BW="/home/pi/retroprint/tmp/photo_bw_$$.png"

# Check if input files exist
if [ ! -f "$PHOTO" ]; then
    echo "Error: Photo file '$PHOTO' not found"
    exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
    echo "Error: Frame template '$TEMPLATE' not found"
    exit 1
fi

# Create output directory if it doesn't exist
OUTPUT_DIR=$(dirname "$OUTPUT")
mkdir -p "$OUTPUT_DIR"

echo "Processing photo..."
echo "Photo: $PHOTO"
echo "Frame: $TEMPLATE"
echo "Output: $OUTPUT"
echo "Black & White filter: $ENABLE_BW_FILTER"

# Step 1: Get frame dimensions
FRAME_SIZE=$(magick identify -format "%wx%h" "$TEMPLATE")
FRAME_WIDTH=$(echo $FRAME_SIZE | cut -d'x' -f1)
FRAME_HEIGHT=$(echo $FRAME_SIZE | cut -d'x' -f2)

echo "Frame size: ${FRAME_WIDTH}x${FRAME_HEIGHT}"

# Step 2: Apply black & white filter to the photo (if enabled)
if [ "$ENABLE_BW_FILTER" = true ]; then
    echo "Applying black & white filter..."
    magick "$PHOTO" -colorspace gray "$TEMP_BW"
    PROCESSING_PHOTO="$TEMP_BW"
else
    echo "Skipping black & white filter..."
    PROCESSING_PHOTO="$PHOTO"
fi

# Step 3: Extract alpha channel and find transparent areas
echo "Detecting transparent area in frame..."
magick "$TEMPLATE" -alpha extract "$TEMP_ALPHA"

# Step 4: Use a simpler approach - find the largest transparent region
# Create a mask of transparent pixels (alpha < 25)
magick "$TEMP_ALPHA" -threshold 25% -morphology Erode:1 Diamond -connected-components 4 -auto-level "$TEMP_ALPHA"

# Step 5: Get the bounding box of the largest transparent region
# Parse the connected components output to find the largest transparent area
COMPONENTS=$(magick "$TEMP_ALPHA" -define connected-components:verbose=true -define connected-components:area-threshold=100 -connected-components 4 -format "%w %h %X %Y" info: 2>&1)

# Parse the output to find the largest transparent region (gray(255) = white = transparent)
# Look for lines with format: "1: 821x455+41+507 451.0,734.0 373551 gray(255)"
TRANSPARENT_REGION=$(echo "$COMPONENTS" | grep "gray(255)" | head -1)

if [ -z "$TRANSPARENT_REGION" ]; then
    echo "Error: No transparent region found in frame"
    exit 1
fi

# Extract the bounding box part: "821x455+41+507"
BBOX=$(echo "$TRANSPARENT_REGION" | sed -n 's/.*: \([0-9]*x[0-9]*+[0-9]*+[0-9]*\).*/\1/p')

if [ -z "$BBOX" ]; then
    echo "Error: Could not parse bounding box from transparent region: $TRANSPARENT_REGION"
    exit 1
fi

# Parse width x height + x + y
WIDTH=$(echo $BBOX | cut -d'x' -f1)
HEIGHT=$(echo $BBOX | cut -d'x' -f2 | cut -d'+' -f1)
X=$(echo $BBOX | cut -d'+' -f2)
Y=$(echo $BBOX | cut -d'+' -f3)

echo "Detected transparent area: ${WIDTH}x${HEIGHT} at (${X},${Y})"

# Step 6: Resize and crop the photo to fit the detected area
echo "Resizing photo to fit frame area..."
magick "$PROCESSING_PHOTO" -resize ${WIDTH}x${HEIGHT}^ -gravity center -extent ${WIDTH}x${HEIGHT} "$TEMP_PHOTO"

# Step 7: Composite the photo onto the frame
echo "Compositing photo onto frame..."
magick composite -geometry +${X}+${Y} "$TEMP_PHOTO" "$TEMPLATE" "$OUTPUT"

# Clean up temporary files
rm -f "$TEMP_PHOTO" "$TEMP_ALPHA"
if [ "$ENABLE_BW_FILTER" = true ]; then
    rm -f "$TEMP_BW"
fi

echo "Photo processing complete: $OUTPUT"

# Print the photo
lp "$OUTPUT"