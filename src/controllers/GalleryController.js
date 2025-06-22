/**
 * Gallery Controller
 * Handles gallery operations for browsing and managing processed photos
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

class GalleryController {
    constructor() {
        this.uploadsPath = config.uploadPath;
        this.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp'];
    }

    /**
     * Get all images from uploads directory
     */
    async getImages(req, res) {
        try {
            const images = await this.scanImages();
            
            res.json({
                success: true,
                images: images,
                count: images.length
            });
        } catch (error) {
            console.error('Error getting images:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get images'
            });
        }
    }

    /**
     * Download single image
     */
    async downloadImage(req, res) {
        try {
            const filename = req.params.filename;
            const filePath = path.join(this.uploadsPath, filename);
            
            // Validate filename
            if (!this.isValidImageFile(filename)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid file format'
                });
            }
            
            // Check if file exists
            try {
                await fs.access(filePath);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found'
                });
            }
            
            // Send file
            res.download(filePath, filename);
            
        } catch (error) {
            console.error('Error downloading image:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to download image'
            });
        }
    }

    /**
     * Delete single image
     */
    async deleteImage(req, res) {
        try {
            const filename = req.params.filename;
            const filePath = path.join(this.uploadsPath, filename);
            
            // Validate filename
            if (!this.isValidImageFile(filename)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid file format'
                });
            }
            
            // Check if file exists
            try {
                await fs.access(filePath);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found'
                });
            }
            
            // Delete the image file
            await fs.unlink(filePath);
            
            // Also delete the corresponding PDF file if it exists
            const pdfFilename = filename.replace(/\.[^.]+$/, '.pdf');
            const pdfPath = path.join(this.uploadsPath, pdfFilename);
            
            try {
                await fs.access(pdfPath);
                await fs.unlink(pdfPath);
                console.log(`Deleted PDF file: ${pdfFilename}`);
            } catch (error) {
                // PDF file doesn't exist, which is fine
                console.log(`No PDF file found for: ${filename}`);
            }
            
            res.json({
                success: true,
                message: 'Image and corresponding PDF deleted successfully'
            });
            
        } catch (error) {
            console.error('Error deleting image:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete image'
            });
        }
    }

    /**
     * Delete multiple images
     */
    async deleteMultiple(req, res) {
        try {
            const { filenames } = req.body;
            
            if (!Array.isArray(filenames) || filenames.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No files specified'
                });
            }
            
            let deletedCount = 0;
            let deletedPdfCount = 0;
            const errors = [];
            
            // Delete each file
            for (const filename of filenames) {
                try {
                    if (!this.isValidImageFile(filename)) {
                        errors.push(`Invalid file format: ${filename}`);
                        continue;
                    }
                    
                    const filePath = path.join(this.uploadsPath, filename);
                    await fs.access(filePath);
                    await fs.unlink(filePath);
                    deletedCount++;
                    
                    // Also delete the corresponding PDF file if it exists
                    const pdfFilename = filename.replace(/\.[^.]+$/, '.pdf');
                    const pdfPath = path.join(this.uploadsPath, pdfFilename);
                    
                    try {
                        await fs.access(pdfPath);
                        await fs.unlink(pdfPath);
                        deletedPdfCount++;
                        console.log(`Deleted PDF file: ${pdfFilename}`);
                    } catch (error) {
                        // PDF file doesn't exist, which is fine
                        console.log(`No PDF file found for: ${filename}`);
                    }
                    
                } catch (error) {
                    if (error.code === 'ENOENT') {
                        errors.push(`File not found: ${filename}`);
                    } else {
                        errors.push(`Failed to delete ${filename}: ${error.message}`);
                    }
                }
            }
            
            res.json({
                success: true,
                deletedCount: deletedCount,
                deletedPdfCount: deletedPdfCount,
                totalRequested: filenames.length,
                errors: errors.length > 0 ? errors : undefined
            });
            
        } catch (error) {
            console.error('Error deleting multiple images:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete images'
            });
        }
    }

    /**
     * Scan uploads directory for images
     */
    async scanImages() {
        try {
            const files = await fs.readdir(this.uploadsPath);
            const images = [];
            
            for (const file of files) {
                if (this.isValidImageFile(file)) {
                    try {
                        const filePath = path.join(this.uploadsPath, file);
                        const stats = await fs.stat(filePath);
                        
                        // Check if PDF version exists
                        const pdfFilename = file.replace(/\.[^.]+$/, '.pdf');
                        const pdfPath = path.join(this.uploadsPath, pdfFilename);
                        let pdfExists = false;
                        let pdfStats = null;
                        
                        try {
                            pdfStats = await fs.stat(pdfPath);
                            pdfExists = true;
                        } catch (error) {
                            // PDF doesn't exist
                        }
                        
                        images.push({
                            filename: file,
                            name: this.getDisplayName(file),
                            size: stats.size,
                            created: stats.birthtime,
                            modified: stats.mtime,
                            path: `/uploads/${file}`,
                            pdfExists: pdfExists,
                            pdfFilename: pdfExists ? pdfFilename : null,
                            pdfPath: pdfExists ? `/uploads/${pdfFilename}` : null,
                            pdfSize: pdfExists ? pdfStats.size : null
                        });
                    } catch (error) {
                        console.warn(`Error reading file ${file}:`, error);
                    }
                }
            }
            
            // Sort by creation date (newest first)
            return images.sort((a, b) => b.created - a.created);
        } catch (error) {
            console.error('Error scanning images:', error);
            return [];
        }
    }

    /**
     * Check if file is a valid image
     */
    isValidImageFile(filename) {
        const ext = path.extname(filename).toLowerCase();
        return this.supportedFormats.includes(ext);
    }

    /**
     * Get display name for image
     */
    getDisplayName(filename) {
        // Remove extension and replace underscores with spaces
        const name = path.basename(filename, path.extname(filename));
        return name.replace(/_/g, ' ').replace(/-/g, ' ');
    }

    /**
     * Get gallery statistics
     */
    async getStats(req, res) {
        try {
            const images = await this.scanImages();
            const totalSize = images.reduce((sum, img) => sum + img.size, 0);
            
            res.json({
                success: true,
                stats: {
                    totalImages: images.length,
                    totalSize: totalSize,
                    averageSize: images.length > 0 ? Math.round(totalSize / images.length) : 0,
                    oldestImage: images.length > 0 ? images[images.length - 1].created : null,
                    newestImage: images.length > 0 ? images[0].created : null
                }
            });
        } catch (error) {
            console.error('Error getting gallery stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get gallery statistics'
            });
        }
    }

    /**
     * Download PDF file
     */
    async downloadPDF(req, res) {
        try {
            const filename = req.params.filename;
            const pdfFilename = filename.replace(/\.[^.]+$/, '.pdf');
            const filePath = path.join(this.uploadsPath, pdfFilename);
            
            // Validate filename
            if (!this.isValidImageFile(filename)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid file format'
                });
            }
            
            // Check if PDF exists
            try {
                await fs.access(filePath);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    error: 'PDF file not found'
                });
            }
            
            // Send PDF file
            res.download(filePath, pdfFilename);
            
        } catch (error) {
            console.error('Error downloading PDF:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to download PDF'
            });
        }
    }
}

module.exports = GalleryController; 