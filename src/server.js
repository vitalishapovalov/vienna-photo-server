/**
 * Vienna Photo Booth Server
 * Modular Node.js server for photo booth functionality
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Import modules
const config = require('./config/config');
const MiddlewareManager = require('./middleware');
const RouteManager = require('./routes');
const FrameManager = require('./services/FrameManager');
const ImageProcessor = require('./services/ImageProcessor');
const PrinterManager = require('./services/PrinterManager');
const CleanupManager = require('./utils/cleanup');

class PhotoBoothServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.frameManager = new FrameManager();
        this.imageProcessor = new ImageProcessor();
        this.printerManager = new PrinterManager();
        this.cleanupManager = new CleanupManager();
        this.cleanupInterval = null;
        
        // Expose configuration properties
        this.uploadsDir = config.uploadPath;
        this.customFramesDir = config.customFramesPath;
        this.defaultPrinter = 'default'; // Will be updated during initialization
    }

    /**
     * Initialize the server
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Vienna Photo Booth Server...');
            
            // Validate configuration
            this.validateConfiguration();
            
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Setup middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Initialize services
            await this.initializeServices();
            
            // Start cleanup scheduler
            this.startCleanupScheduler();
            
            console.log('✅ Server initialization completed');
        } catch (error) {
            console.error('❌ Server initialization failed:', error);
            throw error;
        }
    }

    /**
     * Validate configuration
     */
    validateConfiguration() {
        const errors = config.validate();
        if (errors.length > 0) {
            throw new Error(`Configuration errors: ${errors.join(', ')}`);
        }
        console.log('✅ Configuration validated');
    }

    /**
     * Ensure required directories exist
     */
    async ensureDirectories() {
        const directories = [
            config.uploadPath,
            config.customFramesPath,
            config.templatesPath,
            config.staticPath
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ Directory created: ${dir}`);
            } catch (error) {
                console.error(`❌ Error creating directory ${dir}:`, error);
                throw error;
            }
        }
    }

    /**
     * Setup middleware
     */
    setupMiddleware() {
        const middlewareManager = new MiddlewareManager(this.app);
        middlewareManager.setup();
        console.log('✅ Middleware setup completed');
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        const routeManager = new RouteManager(this.app);
        routeManager.setup();
        
        // Make server instance available to routes
        this.app.set('server', this);
        
        // Setup error handling after routes
        this.setupErrorHandling();
        
        console.log('✅ Routes setup completed');
    }

    /**
     * Setup error handling middleware
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res, next) => {
            res.status(404).json({ 
                error: 'Route not found',
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            });
        });

        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('Unhandled error:', err);
            
            const errorResponse = {
                error: 'Internal server error',
                message: config.isDevelopment ? err.message : 'Something went wrong',
                timestamp: new Date().toISOString()
            };

            if (config.isDevelopment) {
                errorResponse.stack = err.stack;
            }

            res.status(500).json(errorResponse);
        });
    }

    /**
     * Initialize services
     */
    async initializeServices() {
        try {
            // Initialize frame manager
            await this.frameManager.ensureFramesDirectory();
            
            // Test printer connection and get default printer
            const cupsStatus = await this.printerManager.getCupsStatus();
            if (!cupsStatus.running) {
                console.warn('⚠️  CUPS server is not running');
            } else {
                console.log('✅ CUPS server is running');
                
                // Get default printer
                try {
                    const defaultPrinter = await this.printerManager.getDefaultPrinter();
                    this.defaultPrinter = defaultPrinter || 'default';
                } catch (error) {
                    console.warn('⚠️  Could not get default printer:', error.message);
                    this.defaultPrinter = 'default';
                }
            }
            
            // Run initial cleanup
            await this.runInitialCleanup();
            
            console.log('✅ Services initialized');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
            throw error;
        }
    }

    /**
     * Run initial cleanup on startup
     */
    async runInitialCleanup() {
        try {
            console.log('🧹 Running initial cleanup...');
            const result = await this.cleanupManager.runFullCleanup();
            console.log('✅ Initial cleanup completed');
            return result;
        } catch (error) {
            console.error('❌ Initial cleanup failed:', error);
            // Don't throw error, continue with startup
        }
    }

    /**
     * Start cleanup scheduler
     */
    startCleanupScheduler() {
        // Run cleanup every hour
        const cleanupIntervalMs = 60 * 60 * 1000; // 1 hour
        
        this.cleanupInterval = setInterval(async () => {
            try {
                await this.cleanupManager.runFullCleanup();
            } catch (error) {
                console.error('❌ Scheduled cleanup failed:', error);
            }
        }, cleanupIntervalMs);
        
        console.log(`✅ Cleanup scheduler started (every ${cleanupIntervalMs / 60000} minutes)`);
    }

    /**
     * Stop cleanup scheduler
     */
    stopCleanupScheduler() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('✅ Cleanup scheduler stopped');
        }
    }

    /**
     * Start the server
     */
    async start() {
        try {
            await this.initialize();
            
            this.server = this.app.listen(config.port, config.host, () => {
                console.log('🎉 Vienna Photo Booth Server is running!');
                console.log(`📍 Server: http://${config.host}:${config.port}`);
                console.log(`🌍 Environment: ${config.nodeEnv}`);
                console.log(`📁 Uploads: ${config.uploadPath}`);
                console.log(`🖼️  Custom Frames: ${config.customFramesPath}`);
                console.log(`🖨️  Default Printer: ${config.defaultPrinter}`);
                console.log('📋 Available endpoints:');
                console.log('   GET  / - Main page');
                console.log('   GET  /health - Health check');
                console.log('   GET  /api - API info');
                console.log('   GET  /api/frames - Get frames');
                console.log('   POST /api/print - Print photo');
                console.log('   GET  /api/printers - Get printers');
                console.log('   GET  /api/system - System info');
                console.log('   GET  /api/cleanup - Run cleanup');
                console.log('   GET  /gallery - Gallery page');
                console.log('');
                console.log('Press Ctrl+C to stop the server');
            });

            // Handle graceful shutdown
            this.setupGracefulShutdown();
            
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    /**
     * Setup graceful shutdown
     */
    setupGracefulShutdown() {
        const shutdown = (signal) => {
            console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
            
            // Stop cleanup scheduler
            this.stopCleanupScheduler();
            
            if (this.server) {
                this.server.close(() => {
                    console.log('✅ Server closed');
                    process.exit(0);
                });
                
                // Force close after 10 seconds
                setTimeout(() => {
                    console.error('❌ Could not close connections in time, forcefully shutting down');
                    process.exit(1);
                }, 10000);
            } else {
                process.exit(0);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    /**
     * Stop the server
     */
    async stop() {
        // Stop cleanup scheduler
        this.stopCleanupScheduler();
        
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log('✅ Server stopped');
                    resolve();
                });
            });
        }
    }

    /**
     * Get server status
     */
    getStatus() {
        return {
            running: !!this.server,
            port: config.port,
            host: config.host,
            environment: config.nodeEnv,
            uptime: this.server ? process.uptime() : 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Run manual cleanup
     */
    async runCleanup() {
        try {
            return await this.cleanupManager.runFullCleanup();
        } catch (error) {
            console.error('❌ Manual cleanup failed:', error);
            throw error;
        }
    }

    /**
     * Get cleanup statistics
     */
    async getCleanupStats() {
        try {
            return await this.cleanupManager.getUploadStats();
        } catch (error) {
            console.error('❌ Failed to get cleanup stats:', error);
            throw error;
        }
    }

    /**
     * Cleanup method for graceful shutdown
     */
    cleanup() {
        this.stopCleanupScheduler();
        if (this.server) {
            this.server.close();
        }
    }
}

// Create and start server if this file is run directly
if (require.main === module) {
    const server = new PhotoBoothServer();
    server.start().catch((error) => {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    });
}

module.exports = PhotoBoothServer; 