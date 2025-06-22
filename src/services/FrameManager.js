/**
 * Frame Manager Service
 * Handles frame operations and management for custom frames only
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

class FrameManager {
    constructor() {
        this.customFramesFolder = config.customFramesPath;
    }

    /**
     * Ensure frames directories exist
     */
    async ensureFramesDirectory() {
        try {
            await fs.mkdir(this.customFramesFolder, { recursive: true });
            console.log('✅ Custom frames directory created successfully');
            return true;
        } catch (error) {
            console.error('❌ Error creating custom frames directory:', error);
            throw new Error(`Failed to create custom frames directory: ${error.message}`);
        }
    }

    /**
     * Get all available frames (custom only)
     */
    async getAvailableFrames() {
        try {
            const customFrames = await this.getCustomFrames();
            
            // Add type indicators
            const allFrames = customFrames.map(frame => ({ ...frame, type: 'custom' }));
            
            // Sort by name
            allFrames.sort((a, b) => a.name.localeCompare(b.name));
            
            return allFrames;
        } catch (error) {
            console.error('Error loading frames:', error);
            throw new Error('Failed to load frames');
        }
    }

    /**
     * Get custom frames only
     */
    async getCustomFrames() {
        try {
            const frames = [];
            const files = await fs.readdir(this.customFramesFolder);
            
            for (const file of files) {
                if (this.isValidCustomFrameFile(file)) {
                    const frameId = this.extractCustomFrameId(file);
                    const filePath = path.join(this.customFramesFolder, file);
                    
                    // Get file stats for size
                    const stats = await fs.stat(filePath);
                    
                    frames.push({
                        id: frameId,
                        name: this.getCustomFrameName(file),
                        url: `/static/custom-frames/${file}`,
                        filename: file,
                        size: stats.size,
                        type: 'custom'
                    });
                }
            }
            
            // Sort frames by name
            frames.sort((a, b) => a.name.localeCompare(b.name));
            
            return frames;
        } catch (error) {
            console.error('Error loading custom frames:', error);
            return [];
        }
    }

    /**
     * Check if a frame exists (custom only)
     */
    async frameExists(frameId) {
        if (!frameId) return false;
        
        try {
            const customPath = this.getCustomFramePath(frameId);
            await fs.access(customPath);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get frame file path (custom only)
     */
    async getFramePath(frameId) {
        if (!frameId) return null;
        
        try {
            const customPath = this.getCustomFramePath(frameId);
            await fs.access(customPath);
            return customPath;
        } catch (error) {
            throw new Error('Frame not found');
        }
    }

    /**
     * Get custom frame file path
     */
    getCustomFramePath(frameId) {
        return path.join(this.customFramesFolder, `${frameId}.png`);
    }

    /**
     * Get frame metadata
     */
    async getFrameMetadata(frameId) {
        try {
            const framePath = await this.getFramePath(frameId);
            if (!framePath) {
                throw new Error('Frame not found');
            }
            
            const stats = await fs.stat(framePath);
            
            // Get image dimensions using Sharp
            const sharp = require('sharp');
            const metadata = await sharp(framePath).metadata();
            
            return {
                id: frameId,
                path: framePath,
                type: 'custom',
                size: stats.size,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            throw new Error(`Failed to get frame metadata: ${error.message}`);
        }
    }

    /**
     * Get frame dimensions
     */
    async getFrameDimensions(frameId) {
        try {
            const framePath = await this.getFramePath(frameId);
            if (!framePath) {
                throw new Error('Frame not found');
            }
            
            const sharp = require('sharp');
            const metadata = await sharp(framePath).metadata();
            
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format
            };
        } catch (error) {
            throw new Error(`Failed to get frame dimensions: ${error.message}`);
        }
    }

    /**
     * Get frame placement information (transparent area)
     */
    async getFramePlacement(frameId) {
        try {
            const framePath = await this.getFramePath(frameId);
            
            if (!framePath) {
                throw new Error('Frame not found');
            }
            
            const ImageProcessor = require('./ImageProcessor');
            const imageProcessor = new ImageProcessor();
            
            return await imageProcessor.detectFramePlacement(framePath);
        } catch (error) {
            throw new Error(`Failed to get frame placement: ${error.message}`);
        }
    }

    /**
     * Upload custom frame
     */
    async uploadCustomFrame(fileBuffer, originalName) {
        try {
            // Validate file format
            if (!this.isValidCustomFrameFile(originalName)) {
                throw new Error('Invalid file format. Only PNG files are allowed.');
            }
            
            // Sanitize the original filename
            const sanitizedName = this.sanitizeFilename(originalName);
            const nameWithoutExt = path.basename(sanitizedName, path.extname(sanitizedName));
            
            // Generate unique suffix
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const uniqueSuffix = `_${timestamp}_${random}`;
            
            // Create final filename with original name + unique suffix
            const filename = `${nameWithoutExt}${uniqueSuffix}.png`;
            const filePath = path.join(this.customFramesFolder, filename);
            
            // Check if file already exists (shouldn't happen with unique suffix, but just in case)
            try {
                await fs.access(filePath);
                throw new Error('A frame with this name already exists.');
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
            }
            
            // Save file
            await fs.writeFile(filePath, fileBuffer);
            
            // Get file stats
            const stats = await fs.stat(filePath);
            
            // Extract frame ID from filename (without extension)
            const frameId = path.basename(filename, path.extname(filename));
            
            return {
                id: frameId,
                name: this.getCustomFrameName(filename),
                filename: filename,
                size: stats.size,
                created: stats.birthtime,
                url: `/static/custom-frames/${filename}`,
                type: 'custom'
            };
        } catch (error) {
            console.error('Error uploading custom frame:', error);
            throw new Error(`Failed to upload custom frame: ${error.message}`);
        }
    }

    /**
     * Remove custom frame
     */
    async removeCustomFrame(frameId) {
        try {
            const framePath = this.getCustomFramePath(frameId);
            
            // Check if file exists
            await fs.access(framePath);
            
            // Delete file
            await fs.unlink(framePath);
            
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error('Frame not found');
            }
            throw new Error(`Failed to remove custom frame: ${error.message}`);
        }
    }

    /**
     * Get frames count
     */
    async getFramesCount() {
        try {
            const customFrames = await this.getCustomFrames();
            return {
                custom: customFrames.length,
                total: customFrames.length
            };
        } catch (error) {
            console.error('Error getting frames count:', error);
            return { custom: 0, total: 0 };
        }
    }

    /**
     * Validate custom frame file
     */
    isValidCustomFrameFile(filename) {
        const ext = path.extname(filename).toLowerCase();
        return ext === '.png';
    }

    /**
     * Extract custom frame ID from filename
     */
    extractCustomFrameId(filename) {
        return path.basename(filename, path.extname(filename));
    }

    /**
     * Get custom frame display name
     */
    getCustomFrameName(filename) {
        const name = this.extractCustomFrameId(filename);
        return name.replace(/_/g, ' ').replace(/-/g, ' ');
    }

    /**
     * Generate unique frame ID
     */
    generateFrameId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `frame_${timestamp}_${random}`;
    }

    /**
     * Sanitize filename
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .toLowerCase();
    }

    /**
     * Get directory information
     */
    async getDirectoryInfo() {
        try {
            const stats = await fs.stat(this.customFramesFolder);
            const files = await fs.readdir(this.customFramesFolder);
            
            let totalSize = 0;
            for (const file of files) {
                try {
                    const filePath = path.join(this.customFramesFolder, file);
                    const fileStats = await fs.stat(filePath);
                    totalSize += fileStats.size;
                } catch (error) {
                    console.warn(`Error reading file ${file}:`, error);
                }
            }
            
            return {
                path: this.customFramesFolder,
                exists: true,
                size: totalSize,
                fileCount: files.length,
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            return {
                path: this.customFramesFolder,
                exists: false,
                size: 0,
                fileCount: 0,
                error: error.message
            };
        }
    }
}

module.exports = FrameManager; 