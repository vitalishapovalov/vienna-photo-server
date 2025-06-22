/**
 * Helper Utilities
 * Common utility functions for Vienna Photo Booth
 */

const crypto = require('crypto');
const path = require('path');

class Helpers {
    /**
     * Generate a unique ID
     */
    static generateId(length = 8) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate a timestamp string
     */
    static generateTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    }

    /**
     * Format file size in human readable format
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format duration in human readable format
     */
    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate filename
     */
    static isValidFilename(filename) {
        const invalidChars = /[<>:"/\\|?*]/;
        return !invalidChars.test(filename) && filename.length > 0 && filename.length <= 255;
    }

    /**
     * Sanitize filename
     */
    static sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 255);
    }

    /**
     * Get file extension
     */
    static getFileExtension(filename) {
        return path.extname(filename).toLowerCase();
    }

    /**
     * Check if file is an image
     */
    static isImageFile(filename) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const ext = this.getFileExtension(filename);
        return imageExtensions.includes(ext);
    }

    /**
     * Create a delay promise
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry function with exponential backoff
     */
    static async retry(fn, maxAttempts = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await this.delay(delay);
            }
        }
    }

    /**
     * Deep clone an object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }

    /**
     * Merge objects deeply
     */
    static deepMerge(target, source) {
        const result = this.deepClone(target);
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    /**
     * Generate a random string
     */
    static randomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Validate URL format
     */
    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Get memory usage info
     */
    static getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: this.formatFileSize(usage.rss),
            heapTotal: this.formatFileSize(usage.heapTotal),
            heapUsed: this.formatFileSize(usage.heapUsed),
            external: this.formatFileSize(usage.external),
            arrayBuffers: this.formatFileSize(usage.arrayBuffers)
        };
    }

    /**
     * Get system uptime
     */
    static getSystemUptime() {
        return this.formatDuration(process.uptime());
    }

    /**
     * Create a debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Create a throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Check if running in development mode
     */
    static isDevelopment() {
        return process.env.NODE_ENV === 'development';
    }

    /**
     * Check if running in production mode
     */
    static isProduction() {
        return process.env.NODE_ENV === 'production';
    }

    /**
     * Get environment variable with fallback
     */
    static getEnv(key, fallback = null) {
        return process.env[key] || fallback;
    }

    /**
     * Log with timestamp
     */
    static log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level}] ${message}`);
    }

    /**
     * Log error with timestamp
     */
    static logError(message, error = null) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR] ${message}`);
        if (error) {
            console.error(error);
        }
    }
}

module.exports = Helpers; 