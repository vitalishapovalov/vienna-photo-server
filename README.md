# Vienna Photo Booth Server

A modern, modular photo booth application built with Node.js, featuring real-time camera capture, custom frame overlays, photo filters, printing capabilities, and a comprehensive gallery system.

## ✨ Features

### 📸 **Camera & Photo Capture**
- **Real-time Camera**: Live camera feed with web browser support
- **Mobile Optimized**: Works perfectly on mobile devices with HTTPS
- **Camera Switching**: Switch between front and back cameras on mobile devices
- **Frame Selection**: Choose from uploaded custom frames before taking photos
- **Photo Filters**: Apply real-time filters (Normal, Black & White, Sepia, Old Camera)
- **Dual Download**: Download both filtered and original versions of photos

### 🖼️ **Frame Management**
- **Custom Frame Upload**: Upload PNG frames with transparency
- **Frame Gallery**: Browse and manage uploaded frames
- **Smart Placement**: Automatic photo placement within frame's transparent areas
- **Frame Statistics**: View frame usage and file information
- **Frame Deletion**: Remove unwanted custom frames

### 🎨 **Photo Processing**
- **High-Quality Processing**: Sharp-based image processing
- **Frame Overlay**: Apply frames with precise photo placement
- **Filter Application**: Real-time and post-capture filter effects
- **Aspect Ratio Handling**: Proper handling of portrait and landscape frames
- **Multiple Formats**: Support for various image formats

### 🖨️ **Printing System**
- **CUPS Integration**: Direct printing to CUPS-compatible printers
- **Printer Management**: Select and manage available printers
- **Print Queue**: Monitor and manage print jobs
- **Print Status**: Real-time printing status updates
- **Process Only**: Process photos without printing

### 📱 **User Interface**
- **Responsive Design**: Modern, mobile-friendly interface
- **Multi-Page Navigation**: Separate pages for Photo Booth, Gallery, and System
- **Real-time Feedback**: Loading indicators and status messages
- **Error Handling**: Comprehensive error messages and recovery
- **Mobile Camera Support**: Optimized for mobile camera access

### 🗂️ **Gallery System**
- **Photo Gallery**: Browse all processed photos
- **Download Options**: Download individual photos
- **Photo Management**: Delete unwanted photos
- **Gallery Statistics**: View photo counts and storage information

### ⚙️ **System Management**
- **System Monitoring**: Real-time server and printer status
- **File Cleanup**: Automatic and manual file cleanup
- **Storage Management**: Monitor disk usage and file sizes
- **Health Checks**: System health monitoring
- **Configuration**: View and manage system settings

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (recommended: Node.js 22 LTS)
- **CUPS printing system** (for printing functionality)
- **Modern web browser** with camera access
- **OpenSSL** (for HTTPS development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vienna-photo-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup HTTPS (for mobile camera access)**
   ```bash
   # Generate SSL certificates for development
   npm run ssl
   ```

4. **Start the server**
   ```bash
   # Start with HTTPS (recommended for mobile)
   npm run https
   
   # Or start with HTTP only
   npm start
   ```

5. **Access the application**
   - **HTTPS**: `https://localhost:5000` (recommended for mobile)
   - **HTTP**: `http://localhost:5000` (desktop only)
   - Allow camera access when prompted
   - Upload custom frames and start taking photos!

## 🍓 Raspberry Pi Deployment

For deploying the Vienna Photo Booth Server on a Raspberry Pi, follow these steps:

### Prerequisites
- Raspberry Pi (3 or 4 recommended)
- Raspberry Pi OS (latest version)
- Internet connection

### Installation Steps

1. **Update system packages**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. **Install Node.js 22.x**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install CUPS printing system**
   ```bash
   sudo apt install cups cups-client cups-daemon
   sudo usermod -a -G lp $USER
   ```

4. **Install ImageMagick**
   ```bash
   sudo apt install imagemagick
   ```

5. **Fix ImageMagick security policy (Important!)**
   
   ImageMagick has a security policy that blocks PDF operations by default. You must fix this for PDF printing to work:
   
   ```bash
   # Find the policy file
   sudo find /etc -name "policy.xml" | grep -i imagemagick
   
   # Edit the policy file (replace PATH with the actual path found above)
   sudo nano /etc/ImageMagick-6/policy.xml
   
   # Find and comment out this line:
   # <policy domain="coder" rights="none" pattern="PDF" />
   
   # Add this line instead:
   # <policy domain="coder" rights="read|write" pattern="PDF" />
   
   # Save the file (Ctrl+X, then Y, then Enter)
   ```

6. **Clone and setup the application**
   ```bash
   git clone https://github.com/vitalishapovalov/vienna-photo-server
   cd vienna-photo-server
   npm install
   ```

7. **Generate SSL certificates**
   ```bash
   npm run ssl
   ```

8. **Install PM2 for process management**
   ```bash
   sudo npm install -g pm2
   ```

9. **Start the application with PM2**
   ```bash
   sudo pm2 start npm --name "vienna-photo-server" -- start
   sudo pm2 startup
   sudo pm2 save
   ```

### Accessing the Application

After installation, you can access the Vienna Photo Booth Server at:
- **HTTPS**: `https://YOUR_RASPBERRY_PI_IP:5000`
- **HTTP**: `http://YOUR_RASPBERRY_PI_IP:5000`

### PM2 Management Commands

```bash
# View application status
sudo pm2 status

# View logs
sudo pm2 logs vienna-photo-server

# Restart application
sudo pm2 restart vienna-photo-server

# Stop application
sudo pm2 stop vienna-photo-server

# Delete application from PM2
sudo pm2 delete vienna-photo-server
```

### Printer Setup on Raspberry Pi

1. **Access CUPS web interface**
   - Open browser and go to: `http://YOUR_RASPBERRY_PI_IP:631`
   - Login with your Raspberry Pi credentials

2. **Add printer**
   - Click "Administration" tab
   - Click "Add Printer"
   - Follow the setup wizard for your specific printer

3. **Test printing**
   - Use the Vienna Photo Booth Server to test print functionality

### Troubleshooting

#### ImageMagick Security Policy Error
If you see this error when printing:
```
convert-im6.q16: attempt to perform an operation not allowed by the security policy `PDF'
```

**Solution**: Follow step 5 in the installation process to fix the ImageMagick security policy.

#### PDF Conversion Issues
- Ensure ImageMagick is installed: `sudo apt install imagemagick`
- Verify the security policy fix was applied correctly
- Check that the `convert` command works: `convert -version`
- Restart the application after making policy changes

#### Printer Not Found
- Check CUPS status: `sudo systemctl status cups`
- Verify printer is connected and powered on
- Check CUPS web interface at `http://YOUR_RASPBERRY_PI_IP:631`

## 📱 Mobile Camera Access

**Important**: Mobile browsers require HTTPS for camera access. For development:

1. **Generate SSL certificates**:
   ```bash
   npm run ssl
   ```

2. **Start with HTTPS**:
   ```bash
   npm run https
   ```

3. **Access on mobile**:
   - Find your computer's IP address: `ifconfig` (macOS/Linux) or `ipconfig` (Windows)
   - On your mobile device, go to `https://YOUR_IP:5000`
   - Accept the security warning (self-signed certificate)
   - Allow camera permissions

**Note**: Self-signed certificates will show a security warning in browsers. This is normal for development. Click "Advanced" and "Proceed to localhost" to continue.

## 🏗️ Project Structure

```
vienna-photo-server/
├── src/
│   ├── config/          # Configuration management
│   │   └── config.js    # Application configuration
│   ├── controllers/     # Request handlers
│   │   ├── GalleryController.js    # Gallery management
│   │   ├── PhotoController.js      # Photo processing
│   │   └── PrinterController.js    # Printer management
│   ├── middleware/      # Express middleware
│   │   └── index.js     # Middleware setup
│   ├── routes/          # API route definitions
│   │   └── index.js     # Route configuration
│   ├── services/        # Business logic services
│   │   ├── FrameManager.js     # Frame management
│   │   ├── ImageProcessor.js   # Image processing
│   │   └── PrinterManager.js   # Printer operations
│   ├── utils/           # Utility functions
│   │   ├── cleanup.js   # File cleanup utilities
│   │   └── helpers.js   # Helper functions
│   └── server.js        # Main server class
├── static/
│   ├── css/            # Stylesheets
│   │   └── style.css   # Main stylesheet
│   ├── js/             # Frontend JavaScript
│   │   ├── script.js   # Main photo booth logic
│   │   ├── gallery.js  # Gallery functionality
│   │   └── system.js   # System management
│   └── custom-frames/  # Custom frame uploads
├── templates/          # HTML templates
│   ├── index.html      # Photo booth interface
│   ├── gallery.html    # Gallery interface
│   └── system.html     # System management
├── uploads/           # Processed photo storage
├── ssl/              # SSL certificates (generated)
├── package.json
├── server.js         # Server entry point
├── generate-ssl.js   # SSL certificate generator
└── README.md
```

## 📖 Usage Guide

### 📸 Photo Booth Workflow

1. **Frame Selection**
   - Choose a custom frame from the frame gallery
   - View frame placement information
   - Navigate to camera section

2. **Camera Setup**
   - Click "Start Camera" to begin
   - On mobile: Use "Switch Camera" to toggle front/back cameras
   - Select photo filters (Normal, Black & White, Sepia, Old Camera)
   - Position yourself in the frame

3. **Photo Capture**
   - Click "Take Photo" to capture
   - Review the preview with frame and filter applied
   - Use "Back to Camera" to retake if needed

4. **Download & Print**
   - **Download**: Get the filtered photo with frame
   - **Download Original**: Get the unfiltered photo without frame
   - **Print Photo**: Send to printer with frame
   - **Process Only**: Process without printing

### 🖼️ Custom Frame Management

1. **Upload Frames**
   - Go to System page → Frame Management
   - Upload PNG files with transparency
   - Frames are automatically saved with unique names

2. **Frame Gallery**
   - Browse all uploaded frames
   - View frame dimensions and file sizes
   - Search frames by name
   - Delete unwanted frames

3. **Frame Requirements**
   - **Format**: PNG with transparency
   - **Transparency**: Use transparent areas for photo placement
   - **Size**: Recommended to match camera resolution
   - **Quality**: High-quality PNG for best results

### 🗂️ Gallery Management

1. **Browse Photos**
   - View all processed photos
   - See photo details and timestamps
   - Refresh gallery for new photos

2. **Photo Actions**
   - Download individual photos
   - Delete unwanted photos
   - View photo information

### ⚙️ System Management

1. **System Status**
   - Monitor server uptime and status
   - Check printer connectivity
   - View system resources

2. **Printer Management**
   - Select default printer
   - View print queue
   - Monitor print jobs

3. **File Cleanup**
   - Automatic cleanup of old files
   - Manual cleanup options
   - Storage statistics

## 🔧 API Endpoints

### Core Pages
- `GET /` - Photo booth interface
- `GET /gallery` - Photo gallery
- `GET /system` - System management

### Frame Management
- `GET /api/frames` - Get available frames
- `POST /api/frames/upload` - Upload custom frame
- `DELETE /api/frames/custom/:id` - Delete custom frame
- `GET /api/frames/:id/placement` - Get frame placement info

### Photo Processing
- `POST /api/print` - Print photo with frame
- `POST /api/process` - Process photo with frame
- `GET /api/gallery` - Get gallery images
- `DELETE /api/gallery/:id` - Delete gallery image

### System Management
- `GET /api/printers` - Get available printers
- `GET /api/print-queue` - Get print queue
- `DELETE /api/print-queue/:id` - Cancel print job
- `GET /api/system` - Get system information
- `GET /api/cleanup/stats` - Get cleanup statistics
- `POST /api/cleanup` - Manual cleanup

### Health & Status
- `GET /health` - Health check
- `GET /api/health` - Detailed health information

## ⚙️ Configuration

### Environment Variables

```bash
# Server Configuration
PORT=5000                    # Server port
HOST=0.0.0.0                # Server host
NODE_ENV=development         # Environment

# File Paths
UPLOAD_PATH=./uploads        # Photo storage
CUSTOM_FRAMES_PATH=./static/custom-frames  # Custom frames
TEMPLATES_PATH=./templates   # HTML templates
STATIC_PATH=./static         # Static files

# Printer Configuration
DEFAULT_PRINTER=default      # Default printer
PRINT_TIMEOUT=30000         # Print timeout (ms)

# Image Processing
IMAGE_QUALITY=95            # JPEG quality (1-100)
MAX_FILE_SIZE=10485760      # Max file size (10MB)

# Cleanup Configuration
CLEANUP_INTERVAL=3600000    # Cleanup interval (1 hour)
MAX_FILE_AGE=86400000       # Max file age (24 hours)
MAX_UPLOADS_SIZE=104857600  # Max uploads size (100MB)
```

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start server with HTTP
npm run https      # Start server with HTTPS
npm run ssl        # Generate SSL certificates
npm run dev        # Start with nodemon (development)
```

### Development Notes

- **HTTPS Required**: Mobile camera access requires HTTPS
- **Self-Signed Certificates**: Accept security warnings in development
- **Camera Permissions**: Allow camera access when prompted
- **File Permissions**: Ensure write permissions for uploads directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Camera not working on mobile:**
- Ensure HTTPS is enabled
- Accept SSL certificate warnings
- Allow camera permissions in browser

**Printer not found:**
- Check CUPS installation
- Verify printer is connected and powered
- Check printer permissions

**Frames not uploading:**
- Ensure PNG format with transparency
- Check file size limits
- Verify directory permissions

**Photos not processing:**
- Check Sharp installation
- Verify image format support
- Check available disk space

### Support

For issues and questions:
- Check the troubleshooting section
- Review browser console for errors
- Check server logs for detailed error messages
- Ensure all prerequisites are installed 