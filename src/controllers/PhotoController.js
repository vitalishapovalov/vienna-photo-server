/**
 * Photo Controller
 * Handles photo-related HTTP requests and business logic
 */

const path = require('path');
const config = require('../config/config');
const ImageProcessor = require('../services/ImageProcessor');
const FrameManager = require('../services/FrameManager');
const PrinterManager = require('../services/PrinterManager');

class PhotoController {
    constructor() {
        this.imageProcessor = new ImageProcessor();
        this.frameManager = new FrameManager();
        this.printerManager = new PrinterManager();
    }

    /**
     * Handle print photo request
     */
    async printPhoto(req, res) {
        try {
            const { image, frame_id } = req.body;
            
            if (!image) {
                return res.status(400).json({ 
                    error: 'No image data provided',
                    timestamp: new Date().toISOString()
                });
            }

            // Process the print request
            const result = await this.processPrintRequest(image, frame_id);
            
            res.json(result);
        } catch (error) {
            console.error('Error in print photo controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Process print request
     */
    async processPrintRequest(imageData, frameId) {
        try {
            // Decode and process image
            const imageBuffer = this.imageProcessor.decodeBase64Image(imageData);
            const processedPhoto = await this.imageProcessor.processImage(
                imageBuffer, 
                frameId, 
                this.frameManager
            );

            // Save image
            const filename = this.imageProcessor.generateFilename();
            const outputPath = path.join(config.uploadPath, filename);
            await this.imageProcessor.saveImage(processedPhoto, outputPath);

            // Print image
            try {
                const printResult = await this.printerManager.printImage(outputPath);
                return {
                    success: true,
                    message: 'Photo printed successfully!',
                    file: outputPath,
                    filename: filename,
                    printJob: printResult.printJob,
                    printer: printResult.printer,
                    timestamp: new Date().toISOString()
                };
            } catch (printError) {
                // If printing fails, still return success with saved image
                return {
                    success: true,
                    message: 'Photo saved successfully! (Printing failed)',
                    file: outputPath,
                    filename: filename,
                    error: printError.message,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            throw new Error(`Print request failed: ${error.message}`);
        }
    }

    /**
     * Get available frames
     */
    async getFrames(req, res) {
        try {
            const frames = await this.frameManager.getAvailableFrames();
            
            // Add dimensions to each frame
            const framesWithDimensions = await Promise.all(
                frames.map(async (frame) => {
                    try {
                        const dimensions = await this.frameManager.getFrameDimensions(frame.id);
                        return {
                            ...frame,
                            width: dimensions.width,
                            height: dimensions.height,
                            format: dimensions.format
                        };
                    } catch (error) {
                        console.warn(`Could not get dimensions for frame ${frame.id}:`, error.message);
                        return frame;
                    }
                })
            );
            
            res.json(framesWithDimensions);
        } catch (error) {
            console.error('Error in get frames controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get frame metadata
     */
    async getFrameMetadata(req, res) {
        try {
            const { frameId } = req.params;
            
            if (!frameId) {
                return res.status(400).json({ 
                    error: 'Frame ID is required',
                    timestamp: new Date().toISOString()
                });
            }

            const metadata = await this.frameManager.getFrameMetadata(frameId);
            res.json(metadata);
        } catch (error) {
            console.error('Error in get frame metadata controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get frame placement information
     */
    async getFramePlacement(req, res) {
        try {
            const { frameId } = req.params;
            
            if (!frameId) {
                return res.status(400).json({ 
                    error: 'Frame ID is required',
                    timestamp: new Date().toISOString()
                });
            }

            const placement = await this.frameManager.getFramePlacement(frameId);
            res.json(placement);
        } catch (error) {
            console.error('Error in get frame placement controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Add new frame
     */
    async addFrame(req, res) {
        try {
            const { frameId } = req.params;
            const frameBuffer = req.body.frameData;
            
            if (!frameId || !frameBuffer) {
                return res.status(400).json({ 
                    error: 'Frame ID and frame data are required',
                    timestamp: new Date().toISOString()
                });
            }

            const framePath = await this.frameManager.addFrame(frameBuffer, frameId);
            res.json({
                success: true,
                message: `Frame ${frameId} added successfully`,
                path: framePath,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in add frame controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Remove frame
     */
    async removeFrame(req, res) {
        try {
            const { frameId } = req.params;
            
            if (!frameId) {
                return res.status(400).json({ 
                    error: 'Frame ID is required',
                    timestamp: new Date().toISOString()
                });
            }

            await this.frameManager.removeFrame(frameId);
            res.json({
                success: true,
                message: `Frame ${frameId} removed successfully`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in remove frame controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Upload custom frame
     */
    async uploadCustomFrame(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ 
                    error: 'No frame file uploaded',
                    timestamp: new Date().toISOString()
                });
            }

            const frameBuffer = req.file.buffer;
            const originalName = req.file.originalname;

            // Upload the custom frame
            const frameInfo = await this.frameManager.uploadCustomFrame(frameBuffer, originalName);
            
            res.json({
                success: true,
                message: 'Custom frame uploaded successfully',
                frame: frameInfo,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in upload custom frame controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Remove custom frame
     */
    async removeCustomFrame(req, res) {
        try {
            const { frameId } = req.params;
            
            if (!frameId) {
                return res.status(400).json({ 
                    error: 'Frame ID is required',
                    timestamp: new Date().toISOString()
                });
            }

            await this.frameManager.removeCustomFrame(frameId);
            res.json({
                success: true,
                message: `Custom frame ${frameId} removed successfully`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in remove custom frame controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get custom frames only
     */
    async getCustomFrames(req, res) {
        try {
            const frames = await this.frameManager.getCustomFrames();
            res.json(frames);
        } catch (error) {
            console.error('Error in get custom frames controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get built-in frames only
     */
    async getBuiltinFrames(req, res) {
        try {
            const frames = await this.frameManager.getBuiltinFrames();
            res.json(frames);
        } catch (error) {
            console.error('Error in get built-in frames controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get frames directory info
     */
    async getFramesInfo(req, res) {
        try {
            const info = await this.frameManager.getDirectoryInfo();
            res.json(info);
        } catch (error) {
            console.error('Error in get frames info controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Process image without printing
     */
    async processImage(req, res) {
        try {
            const { image, frame_id, effects } = req.body;
            
            if (!image) {
                return res.status(400).json({ 
                    error: 'No image data provided',
                    timestamp: new Date().toISOString()
                });
            }

            // Decode image
            const imageBuffer = this.imageProcessor.decodeBase64Image(image);
            
            // Process image
            let processedPhoto = await this.imageProcessor.processImage(
                imageBuffer, 
                frame_id, 
                this.frameManager
            );

            // Apply effects if specified
            if (effects) {
                processedPhoto = await this.imageProcessor.applyEffects(processedPhoto, effects);
            }

            // Save processed image
            const filename = this.imageProcessor.generateFilename();
            const outputPath = path.join(config.uploadPath, filename);
            await this.imageProcessor.saveImage(processedPhoto, outputPath);

            res.json({
                success: true,
                message: 'Image processed successfully',
                file: outputPath,
                filename: filename,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in process image controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get image metadata
     */
    async getImageMetadata(req, res) {
        try {
            const { image } = req.body;
            
            if (!image) {
                return res.status(400).json({ 
                    error: 'No image data provided',
                    timestamp: new Date().toISOString()
                });
            }

            const imageBuffer = this.imageProcessor.decodeBase64Image(image);
            const metadata = await this.imageProcessor.getImageMetadata(imageBuffer);
            
            res.json({
                success: true,
                metadata: metadata,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in get image metadata controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = PhotoController; 