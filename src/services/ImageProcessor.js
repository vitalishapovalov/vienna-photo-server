/**
 * Image Processor Service
 * Handles image manipulation and processing with Sharp
 */

const sharp = require('sharp');
const path = require('path');
const config = require('../config/config');

class ImageProcessor {
    constructor() {
        this.supportedFormats = config.supportedFormats;
        this.defaultQuality = config.imageQuality;
    }

    /**
     * Process image with optional frame overlay
     */
    async processImage(imageBuffer, frameId = null, frameManager = null) {
        try {
            // Load the photo with Sharp
            let photo = sharp(imageBuffer);
            
            // Get image metadata
            const metadata = await photo.metadata();
            
            // Apply frame if specified
            if (frameId && frameManager) {
                const frameExists = await frameManager.frameExists(frameId);
                if (frameExists) {
                    photo = await this.applyFrame(photo, frameId, metadata, frameManager);
                } else {
                    throw new Error(`Frame ${frameId} not found`);
                }
            } else {
                throw new Error('Frame is required for photo processing');
            }
            
            return photo;
        } catch (error) {
            console.error('Error processing image:', error);
            throw new Error(`Image processing failed: ${error.message}`);
        }
    }

    /**
     * Apply frame overlay to image
     */
    async applyFrame(photo, frameId, metadata, frameManager) {
        try {
            const framePath = await frameManager.getFramePath(frameId);
            
            // Get frame metadata to determine target dimensions
            const frameMetadata = await sharp(framePath).metadata();
            
            // Detect the transparent/empty area in the frame
            const placement = await this.detectFramePlacement(framePath);
            
            if (!placement) {
                throw new Error('Could not detect transparent area in frame');
            }
            
            // Resize the photo to fit the placement area while maintaining aspect ratio
            const resizedPhoto = await photo
                .resize(placement.width, placement.height, {
                    fit: 'cover', // This will crop the image to fill the area
                    position: 'center' // Center the crop
                })
                .jpeg({ quality: this.defaultQuality })
                .toBuffer();
            
            // Load the frame
            const frameBuffer = await sharp(framePath)
                .png()
                .toBuffer();
            
            // Composite the resized photo into the frame at the detected position
            return sharp(frameBuffer).composite([{
                input: resizedPhoto,
                top: placement.top,
                left: placement.left
            }]);
        } catch (error) {
            console.error('Error applying frame:', error);
            throw new Error(`Frame application failed: ${error.message}`);
        }
    }

    /**
     * Detect the transparent/empty area in a frame PNG
     */
    async detectFramePlacement(framePath) {
        try {
            // Load the frame image
            const frame = sharp(framePath);
            const metadata = await frame.metadata();
            
            // Get raw pixel data
            const { data, info } = await frame
                .raw()
                .toBuffer({ resolveWithObject: true });
            
            const { width, height, channels } = info;
            
            // Find the bounds of the transparent area
            let minX = width, minY = height, maxX = 0, maxY = 0;
            let hasTransparentArea = false;
            let transparentPixels = 0;
            let totalPixels = width * height;
            
            // Scan the image to find transparent pixels
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * channels;
                    const alpha = channels === 4 ? data[index + 3] : 255;
                    
                    // Consider pixel transparent if alpha is very low (less than 25)
                    if (alpha < 25) {
                        hasTransparentArea = true;
                        transparentPixels++;
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            
            // If no transparent area found or transparent area is too small, use the entire frame
            const transparentPercentage = (transparentPixels / totalPixels) * 100;
            if (!hasTransparentArea || transparentPercentage < 5) {
                console.log(`No significant transparent area found in frame. Using entire frame (${width}x${height})`);
                return {
                    top: 0,
                    left: 0,
                    width: width,
                    height: height
                };
            }
            
            // Calculate the placement area
            const placementWidth = maxX - minX + 1;
            const placementHeight = maxY - minY + 1;
            
            // Ensure minimum size (at least 20% of frame size)
            const minWidth = Math.max(placementWidth, Math.floor(width * 0.2));
            const minHeight = Math.max(placementHeight, Math.floor(height * 0.2));
            
            // Ensure the placement area doesn't exceed frame bounds
            const finalWidth = Math.min(minWidth, width - minX);
            const finalHeight = Math.min(minHeight, height - minY);
            
            console.log(`Detected transparent area: ${placementWidth}x${placementHeight} at (${minX},${minY})`);
            console.log(`Final placement area: ${finalWidth}x${finalHeight} at (${minX},${minY})`);
            
            return {
                top: minY,
                left: minX,
                width: finalWidth,
                height: finalHeight
            };
            
        } catch (error) {
            console.error('Error detecting frame placement:', error);
            throw new Error(`Frame placement detection failed: ${error.message}`);
        }
    }

    /**
     * Save processed image to file
     */
    async saveImage(photo, outputPath, quality = null) {
        try {
            const imageQuality = quality || this.defaultQuality;
            
            await photo
                .jpeg({ quality: imageQuality })
                .toFile(outputPath);
            
            return outputPath;
        } catch (error) {
            console.error('Error saving image:', error);
            throw new Error(`Image save failed: ${error.message}`);
        }
    }

    /**
     * Save image as buffer
     */
    async saveImageAsBuffer(photo, quality = null) {
        try {
            const imageQuality = quality || this.defaultQuality;
            
            return await photo
                .jpeg({ quality: imageQuality })
                .toBuffer();
        } catch (error) {
            console.error('Error saving image as buffer:', error);
            throw new Error(`Image buffer save failed: ${error.message}`);
        }
    }

    /**
     * Resize image
     */
    async resizeImage(imageBuffer, width, height, options = {}) {
        try {
            const resizeOptions = {
                width,
                height,
                fit: options.fit || 'cover',
                background: options.background || { r: 255, g: 255, b: 255, alpha: 1 }
            };

            return await sharp(imageBuffer)
                .resize(resizeOptions)
                .jpeg({ quality: options.quality || this.defaultQuality })
                .toBuffer();
        } catch (error) {
            console.error('Error resizing image:', error);
            throw new Error(`Image resize failed: ${error.message}`);
        }
    }

    /**
     * Get image metadata
     */
    async getImageMetadata(imageBuffer) {
        try {
            return await sharp(imageBuffer).metadata();
        } catch (error) {
            console.error('Error getting image metadata:', error);
            throw new Error(`Failed to get image metadata: ${error.message}`);
        }
    }

    /**
     * Validate image format
     */
    validateImageFormat(format) {
        return this.supportedFormats.includes(format.toLowerCase());
    }

    /**
     * Generate unique timestamp for filenames
     */
    generateTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    }

    /**
     * Generate unique filename
     */
    generateFilename(prefix = 'photo', extension = 'jpg') {
        const timestamp = this.generateTimestamp();
        return `${prefix}_${timestamp}.${extension}`;
    }

    /**
     * Decode base64 image data
     */
    decodeBase64Image(imageData) {
        try {
            const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
            return Buffer.from(base64Data, 'base64');
        } catch (error) {
            throw new Error('Invalid image data format');
        }
    }

    /**
     * Convert image to different format
     */
    async convertFormat(imageBuffer, targetFormat, quality = null) {
        try {
            const imageQuality = quality || this.defaultQuality;
            let processedImage = sharp(imageBuffer);

            switch (targetFormat.toLowerCase()) {
                case 'jpeg':
                case 'jpg':
                    return await processedImage.jpeg({ quality: imageQuality }).toBuffer();
                case 'png':
                    return await processedImage.png().toBuffer();
                case 'webp':
                    return await processedImage.webp({ quality: imageQuality }).toBuffer();
                default:
                    throw new Error(`Unsupported format: ${targetFormat}`);
            }
        } catch (error) {
            console.error('Error converting image format:', error);
            throw new Error(`Format conversion failed: ${error.message}`);
        }
    }

    /**
     * Apply image effects
     */
    async applyEffects(imageBuffer, effects = {}) {
        try {
            let processedImage = sharp(imageBuffer);

            // Apply brightness
            if (effects.brightness) {
                processedImage = processedImage.modulate({
                    brightness: effects.brightness
                });
            }

            // Apply contrast
            if (effects.contrast) {
                processedImage = processedImage.modulate({
                    contrast: effects.contrast
                });
            }

            // Apply saturation
            if (effects.saturation) {
                processedImage = processedImage.modulate({
                    saturation: effects.saturation
                });
            }

            // Apply blur
            if (effects.blur) {
                processedImage = processedImage.blur(effects.blur);
            }

            // Apply sharpen
            if (effects.sharpen) {
                processedImage = processedImage.sharpen(effects.sharpen);
            }

            return processedImage;
        } catch (error) {
            console.error('Error applying image effects:', error);
            throw new Error(`Effects application failed: ${error.message}`);
        }
    }

    /**
     * Create thumbnail
     */
    async createThumbnail(imageBuffer, size = 200) {
        try {
            return await sharp(imageBuffer)
                .resize(size, size, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toBuffer();
        } catch (error) {
            console.error('Error creating thumbnail:', error);
            throw new Error(`Thumbnail creation failed: ${error.message}`);
        }
    }
}

module.exports = ImageProcessor; 