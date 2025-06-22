/**
 * Printer Controller
 * Handles printer-related HTTP requests and business logic
 */

const PrinterManager = require('../services/PrinterManager');

class PrinterController {
    constructor() {
        this.printerManager = new PrinterManager();
    }

    /**
     * Get available printers
     */
    async getPrinters(req, res) {
        try {
            const printers = await this.printerManager.getAvailablePrinters();
            res.json({
                success: true,
                printers: printers,
                count: printers.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in get printers controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get printer status
     */
    async getPrinterStatus(req, res) {
        try {
            const { printerName } = req.params;
            
            if (!printerName) {
                return res.status(400).json({ 
                    error: 'Printer name is required',
                    timestamp: new Date().toISOString()
                });
            }

            const status = await this.printerManager.getPrinterStatus(printerName);
            res.json({
                success: true,
                status: status,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in get printer status controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Set default printer
     */
    async setDefaultPrinter(req, res) {
        try {
            const { printerName } = req.body;
            
            if (!printerName) {
                return res.status(400).json({ 
                    error: 'Printer name is required',
                    timestamp: new Date().toISOString()
                });
            }

            await this.printerManager.setDefaultPrinter(printerName);
            res.json({
                success: true,
                message: `Default printer set to: ${printerName}`,
                printer: printerName,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in set default printer controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Test printer
     */
    async testPrinter(req, res) {
        try {
            const { printerName } = req.params;
            
            const result = await this.printerManager.testPrinter(printerName);
            res.json({
                success: true,
                result: result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in test printer controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get print queue
     */
    async getPrintQueue(req, res) {
        try {
            const queue = await this.printerManager.getPrintQueue();
            res.json({
                success: true,
                queue: queue,
                count: queue.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in get print queue controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Cancel print job
     */
    async cancelPrintJob(req, res) {
        try {
            const { jobId } = req.params;
            
            if (!jobId) {
                return res.status(400).json({ 
                    error: 'Job ID is required',
                    timestamp: new Date().toISOString()
                });
            }

            await this.printerManager.cancelPrintJob(jobId);
            res.json({
                success: true,
                message: `Print job ${jobId} cancelled successfully`,
                jobId: jobId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in cancel print job controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get CUPS status
     */
    async getCupsStatus(req, res) {
        try {
            const status = await this.printerManager.getCupsStatus();
            res.json({
                success: true,
                status: status,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in get CUPS status controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get printer options
     */
    async getPrinterOptions(req, res) {
        try {
            const { printerName } = req.params;
            
            if (!printerName) {
                return res.status(400).json({ 
                    error: 'Printer name is required',
                    timestamp: new Date().toISOString()
                });
            }

            const options = await this.printerManager.getPrinterOptions(printerName);
            res.json({
                success: true,
                printer: printerName,
                options: options,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in get printer options controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get default printer
     */
    async getDefaultPrinter(req, res) {
        try {
            const printer = await this.printerManager.getDefaultPrinter();
            res.json({
                success: true,
                printer: printer,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in get default printer controller:', error);
            res.status(500).json({ 
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = PrinterController; 