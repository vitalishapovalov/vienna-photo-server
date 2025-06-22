/**
 * Cleanup Utility
 * Manages file cleanup for the Vienna Photo Booth
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

class CleanupManager {
    constructor() {
        this.uploadsPath = config.uploadPath;
        this.maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.maxSize = 100 * 1024 * 1024; // 100MB
        this.supportedExtensions = ['.jpg', '.jpeg', '.png'];
    }

    /**
     * Clean old files from uploads directory
     */
    async cleanOldFiles() {
        try {
            const files = await this.getUploadFiles();
            const now = Date.now();
            let deletedCount = 0;
            let totalSize = 0;

            for (const file of files) {
                const fileAge = now - file.mtime.getTime();
                
                if (fileAge > this.maxAge) {
                    await fs.unlink(file.path);
                    deletedCount++;
                    console.log(`🗑️  Deleted old file: ${file.name}`);
                } else {
                    totalSize += file.size;
                }
            }

            if (deletedCount > 0) {
                console.log(`✅ Cleanup completed: ${deletedCount} files deleted`);
            }

            return { deletedCount, totalSize };
        } catch (error) {
            console.error('❌ Cleanup error:', error);
            throw error;
        }
    }

    /**
     * Clean files based on size limit
     */
    async cleanBySize() {
        try {
            const files = await this.getUploadFiles();
            let totalSize = 0;
            let deletedCount = 0;

            // Calculate total size
            for (const file of files) {
                totalSize += file.size;
            }

            // If under limit, no cleanup needed
            if (totalSize <= this.maxSize) {
                return { deletedCount, totalSize };
            }

            // Sort files by modification time (oldest first)
            files.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

            // Delete oldest files until under limit
            for (const file of files) {
                if (totalSize <= this.maxSize) break;
                
                await fs.unlink(file.path);
                totalSize -= file.size;
                deletedCount++;
                console.log(`🗑️  Deleted file for size limit: ${file.name}`);
            }

            if (deletedCount > 0) {
                console.log(`✅ Size cleanup completed: ${deletedCount} files deleted`);
            }

            return { deletedCount, totalSize };
        } catch (error) {
            console.error('❌ Size cleanup error:', error);
            throw error;
        }
    }

    /**
     * Get all upload files with metadata
     */
    async getUploadFiles() {
        try {
            const files = await fs.readdir(this.uploadsPath);
            const filePromises = files
                .filter(file => this.isImageFile(file))
                .map(async (file) => {
                    const filePath = path.join(this.uploadsPath, file);
                    const stats = await fs.stat(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        mtime: stats.mtime
                    };
                });

            return await Promise.all(filePromises);
        } catch (error) {
            console.error('❌ Error reading upload files:', error);
            return [];
        }
    }

    /**
     * Check if file is an image
     */
    isImageFile(filename) {
        const ext = path.extname(filename).toLowerCase();
        return this.supportedExtensions.includes(ext);
    }

    /**
     * Get upload directory statistics
     */
    async getUploadStats() {
        try {
            const files = await this.getUploadFiles();
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            const oldestFile = files.length > 0 ? 
                files.reduce((oldest, file) => 
                    file.mtime < oldest.mtime ? file : oldest
                ) : null;

            return {
                fileCount: files.length,
                totalSize,
                totalSizeFormatted: this.formatBytes(totalSize),
                oldestFile: oldestFile ? oldestFile.name : null,
                oldestFileAge: oldestFile ? 
                    this.formatDuration((Date.now() - oldestFile.mtime.getTime()) / 1000) : null
            };
        } catch (error) {
            console.error('❌ Error getting upload stats:', error);
            return {
                fileCount: 0,
                totalSize: 0,
                totalSizeFormatted: '0 Bytes',
                oldestFile: null,
                oldestFileAge: null
            };
        }
    }

    /**
     * Run full cleanup (both age and size based)
     */
    async runFullCleanup() {
        try {
            console.log('🧹 Starting upload directory cleanup...');
            
            const [ageResult, sizeResult] = await Promise.all([
                this.cleanOldFiles(),
                this.cleanBySize()
            ]);

            const stats = await this.getUploadStats();
            
            console.log('📊 Upload directory stats:', stats);
            
            return {
                ageCleanup: ageResult,
                sizeCleanup: sizeResult,
                stats
            };
        } catch (error) {
            console.error('❌ Full cleanup failed:', error);
            throw error;
        }
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format duration in human readable format
     */
    formatDuration(seconds) {
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
     * Set cleanup configuration
     */
    setConfig(options = {}) {
        if (options.maxAge) this.maxAge = options.maxAge;
        if (options.maxSize) this.maxSize = options.maxSize;
        if (options.supportedExtensions) this.supportedExtensions = options.supportedExtensions;
    }
}

module.exports = CleanupManager; 