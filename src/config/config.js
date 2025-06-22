/**
 * Configuration Manager
 * Centralized configuration for the Vienna Photo Booth application
 */

const path = require('path');

class Config {
    constructor() {
        this.loadConfiguration();
    }

    /**
     * Load configuration from environment variables and defaults
     */
    loadConfiguration() {
        // Server configuration
        this.port = process.env.PORT || 5000;
        this.host = process.env.HOST || '0.0.0.0';
        this.nodeEnv = process.env.NODE_ENV || 'development';
        this.isDevelopment = this.nodeEnv === 'development';

        // File paths
        this.uploadPath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
        this.customFramesPath = process.env.CUSTOM_FRAMES_PATH || path.join(process.cwd(), 'static', 'custom-frames');
        this.templatesPath = process.env.TEMPLATES_PATH || path.join(process.cwd(), 'templates');
        this.staticPath = process.env.STATIC_PATH || path.join(process.cwd(), 'static');

        // Printer configuration
        this.defaultPrinter = process.env.DEFAULT_PRINTER || 'default';
        this.printTimeout = parseInt(process.env.PRINT_TIMEOUT) || 30000;

        // Image processing
        this.imageQuality = parseInt(process.env.IMAGE_QUALITY) || 95;
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

        // Cleanup configuration
        this.cleanupInterval = parseInt(process.env.CLEANUP_INTERVAL) || 60 * 60 * 1000; // 1 hour
        this.maxFileAge = parseInt(process.env.MAX_FILE_AGE) || 24 * 60 * 60 * 1000; // 24 hours
        this.maxUploadsSize = parseInt(process.env.MAX_UPLOADS_SIZE) || 100 * 1024 * 1024; // 100MB
    }

    /**
     * Get configuration summary
     */
    getSummary() {
        return {
            server: {
                port: this.port,
                host: this.host,
                environment: this.nodeEnv
            },
            paths: {
                upload: this.uploadPath,
                customFrames: this.customFramesPath,
                templates: this.templatesPath,
                static: this.staticPath
            },
            features: {
                imageQuality: this.imageQuality,
                defaultPrinter: this.defaultPrinter,
                printTimeout: this.printTimeout
            }
        };
    }

    /**
     * Validate configuration
     */
    validate() {
        const errors = [];

        // Validate port
        if (this.port < 1 || this.port > 65535) {
            errors.push('Port must be between 1 and 65535');
        }

        // Validate image quality
        if (this.imageQuality < 1 || this.imageQuality > 100) {
            errors.push('Image quality must be between 1 and 100');
        }

        // Validate file size limits
        if (this.maxFileSize < 1024) {
            errors.push('Max file size must be at least 1KB');
        }

        if (this.maxUploadsSize < this.maxFileSize) {
            errors.push('Max uploads size must be greater than max file size');
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }

        return true;
    }
}

module.exports = new Config(); 