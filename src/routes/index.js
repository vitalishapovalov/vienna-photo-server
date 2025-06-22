/**
 * Routes Configuration
 * Centralized route setup for Vienna Photo Booth
 */

const express = require('express');
const path = require('path');
const multer = require('multer');
const config = require('../config/config');
const PhotoController = require('../controllers/PhotoController');
const PrinterController = require('../controllers/PrinterController');
const GalleryController = require('../controllers/GalleryController');
const middleware = require('../middleware');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow PNG files
        if (file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only PNG files are allowed'), false);
        }
    }
});

class RouteManager {
    constructor(app) {
        this.app = app;
        this.photoController = new PhotoController();
        this.printerController = new PrinterController();
        this.galleryController = new GalleryController();
    }

    /**
     * Setup all routes
     */
    setup() {
        this.setupMainRoutes();
        this.setupPhotoRoutes();
        this.setupPrinterRoutes();
        this.setupSystemRoutes();
        this.setupCleanupRoutes();
        this.setupGalleryRoutes();
    }

    /**
     * Setup main application routes
     */
    setupMainRoutes() {
        // Main page route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(config.templatesPath, 'index.html'));
        });

        // System information page route
        this.app.get('/system', (req, res) => {
            res.sendFile(path.join(config.templatesPath, 'system.html'));
        });

        // Gallery route
        this.app.get('/gallery', (req, res) => {
            res.sendFile(path.join(config.templatesPath, 'gallery.html'));
        });

        // Health check route
        this.app.get('/health', (req, res) => {
            const uptime = process.uptime();
            const health = {
                status: 'OK',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                nodeVersion: process.version,
                uptime: uptime,
                environment: process.env.NODE_ENV || 'development',
                config: {
                    server: {
                        port: process.env.PORT || 5000,
                        host: process.env.HOST || '0.0.0.0',
                        environment: process.env.NODE_ENV || 'development'
                    },
                    paths: {
                        upload: process.env.UPLOAD_PATH || './uploads',
                        frames: process.env.FRAMES_PATH || './static/frames',
                        customFrames: process.env.CUSTOM_FRAMES_PATH || './static/custom-frames',
                        templates: process.env.TEMPLATES_PATH || './templates',
                        static: process.env.STATIC_PATH || './static'
                    },
                    features: {
                        imageQuality: 95,
                        defaultPrinter: 'default',
                        printTimeout: 30000
                    }
                }
            };
            res.json(health);
        });

        // API info route
        this.app.get('/api', (req, res) => {
            res.json({
                name: 'Vienna Photo Booth API',
                version: '1.0.0',
                description: 'Photo booth web API for capturing, processing, and printing photos',
                endpoints: {
                    health: 'GET /health',
                    frames: 'GET /api/frames',
                    print: 'POST /api/print',
                    printers: 'GET /api/printers',
                    system: 'GET /api/system',
                    cleanup: 'GET /api/cleanup',
                    gallery: 'GET /api/gallery'
                },
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * Setup photo-related routes
     */
    setupPhotoRoutes() {
        const router = express.Router();

        // Get available frames
        router.get('/frames', (req, res) => this.photoController.getFrames(req, res));

        // Get frame metadata
        router.get('/frames/:frameId/metadata', (req, res) => this.photoController.getFrameMetadata(req, res));

        // Get frame placement information
        router.get('/frames/:frameId/placement', (req, res) => this.photoController.getFramePlacement(req, res));

        // Custom frame management - these must come BEFORE the generic /frames/:frameId routes
        router.post('/frames/upload', upload.single('frame'), (req, res) => this.photoController.uploadCustomFrame(req, res));
        router.delete('/frames/custom/:frameId', (req, res) => this.photoController.removeCustomFrame(req, res));
        router.get('/frames/custom', (req, res) => this.photoController.getCustomFrames(req, res));
        router.get('/frames/builtin', (req, res) => this.photoController.getBuiltinFrames(req, res));

        // Add new frame
        router.post('/frames/:frameId', (req, res) => this.photoController.addFrame(req, res));

        // Remove frame
        router.delete('/frames/:frameId', (req, res) => this.photoController.removeFrame(req, res));

        // Get frames directory info
        router.get('/frames-info', (req, res) => this.photoController.getFramesInfo(req, res));

        // Print photo
        router.post('/print', (req, res) => this.photoController.printPhoto(req, res));

        // Process image without printing
        router.post('/process', (req, res) => this.photoController.processImage(req, res));

        // Get image metadata
        router.post('/metadata', (req, res) => this.photoController.getImageMetadata(req, res));

        // Mount photo routes
        this.app.use('/api', router);
    }

    /**
     * Setup printer-related routes
     */
    setupPrinterRoutes() {
        const router = express.Router();

        // Get available printers
        router.get('/printers', (req, res) => this.printerController.getPrinters(req, res));

        // Get printer status
        router.get('/printers/:printerName/status', (req, res) => this.printerController.getPrinterStatus(req, res));

        // Set default printer
        router.post('/printers/default', (req, res) => this.printerController.setDefaultPrinter(req, res));

        // Test printer
        router.post('/printers/:printerName/test', (req, res) => this.printerController.testPrinter(req, res));

        // Get print queue
        router.get('/print-queue', (req, res) => this.printerController.getPrintQueue(req, res));

        // Cancel print job
        router.delete('/print-queue/:jobId', (req, res) => this.printerController.cancelPrintJob(req, res));

        // Get CUPS status
        router.get('/cups-status', (req, res) => this.printerController.getCupsStatus(req, res));

        // Mount printer routes
        this.app.use('/api', router);
    }

    /**
     * Setup system-related routes
     */
    setupSystemRoutes() {
        const router = express.Router();

        // Get system information
        router.get('/system', (req, res) => {
            const os = require('os');
            
            res.json({
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                uptime: process.uptime(),
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem()
                },
                cpu: {
                    cores: os.cpus().length,
                    model: os.cpus()[0].model
                },
                loadAverage: os.loadavg(),
                timestamp: new Date().toISOString()
            });
        });

        // Get configuration
        router.get('/config', (req, res) => {
            res.json({
                config: config.getSummary(),
                timestamp: new Date().toISOString()
            });
        });

        // Mount system routes
        this.app.use('/api', router);
    }

    /**
     * Setup cleanup-related routes
     */
    setupCleanupRoutes() {
        const router = express.Router();

        // Run cleanup
        router.get('/cleanup', async (req, res) => {
            try {
                // Get the server instance (this is a bit of a hack, but works for now)
                const server = this.app.get('server');
                if (!server) {
                    return res.status(500).json({
                        error: 'Server instance not available',
                        timestamp: new Date().toISOString()
                    });
                }

                const result = await server.runCleanup();
                res.json({
                    success: true,
                    message: 'Cleanup completed successfully',
                    result: result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error in cleanup route:', error);
                res.status(500).json({
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Get cleanup statistics
        router.get('/cleanup/stats', async (req, res) => {
            try {
                // Get the server instance
                const server = this.app.get('server');
                if (!server) {
                    return res.status(500).json({
                        error: 'Server instance not available',
                        timestamp: new Date().toISOString()
                    });
                }

                const stats = await server.getCleanupStats();
                res.json({
                    success: true,
                    stats: stats,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error in cleanup stats route:', error);
                res.status(500).json({
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Mount cleanup routes
        this.app.use('/api', router);
    }

    /**
     * Setup gallery-related routes
     */
    setupGalleryRoutes() {
        const router = express.Router();

        // Get gallery images
        router.get('/gallery', this.galleryController.getImages.bind(this.galleryController));

        // Get gallery stats
        router.get('/gallery/stats', this.galleryController.getStats.bind(this.galleryController));

        // Download image
        router.get('/gallery/download/:filename', this.galleryController.downloadImage.bind(this.galleryController));

        // Delete image
        router.delete('/gallery/delete/:filename', this.galleryController.deleteImage.bind(this.galleryController));

        // Delete multiple images
        router.delete('/gallery/delete', this.galleryController.deleteMultiple.bind(this.galleryController));

        // Mount gallery routes
        this.app.use('/api', router);
    }
}

module.exports = RouteManager; 