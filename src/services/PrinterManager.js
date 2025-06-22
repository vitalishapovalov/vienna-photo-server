/**
 * Printer Manager Service
 * Handles printing operations and CUPS integration
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

class PrinterManager {
    constructor() {
        this.defaultPrinter = config.defaultPrinter;
        this.printTimeout = config.printTimeout;
        this.execAsync = util.promisify(exec);
    }

    /**
     * Convert image to PDF using ImageMagick
     */
    async convertImageToPDF(imagePath) {
        try {
            const pdfPath = imagePath.replace(/\.[^.]+$/, '.pdf');
            
            // Use 'convert' command (works on Raspberry Pi OS)
            const command = `convert "${imagePath}" -page A4 -resize 100% "${pdfPath}"`;
            
            const { stdout, stderr } = await this.execAsync(command, {
                timeout: this.printTimeout
            });
            
            if (stderr && !stderr.includes('warning')) {
                throw new Error(stderr);
            }
            
            return pdfPath;
        } catch (error) {
            console.error('PDF conversion error:', error);
            
            // Check if it's a security policy error
            if (error.message.includes('security policy') || error.message.includes('not allowed')) {
                const fixMessage = `
ImageMagick security policy is blocking PDF operations. 
To fix this, run the following commands on your Raspberry Pi:

1. Find the policy file:
   sudo find /etc -name "policy.xml" | grep -i imagemagick

2. Edit the policy file (replace PATH with the actual path):
   sudo nano /etc/ImageMagick-6/policy.xml

3. Find and comment out or remove this line:
   <policy domain="coder" rights="none" pattern="PDF" />

4. Add this line instead:
   <policy domain="coder" rights="read|write" pattern="PDF" />

5. Save and restart your application.

Or run the provided fix script: ./fix_imagemagick_policy.sh
                `;
                console.error(fixMessage);
                throw new Error(`ImageMagick security policy blocks PDF operations. ${fixMessage}`);
            }
            
            throw new Error(`PDF conversion failed: ${error.message}`);
        }
    }

    /**
     * Print image using CUPS
     */
    async printImage(imagePath, printerName = null) {
        try {
            let printer = printerName;
            if (!printer) {
                // Get the actual system default printer
                printer = await this.getDefaultPrinter();
            }
            
            // Always convert image to PDF for all printers
            console.log('Converting image to PDF for printing...');
            const pdfPath = await this.convertImageToPDF(imagePath);
            
            const command = `lp -d ${printer} "${pdfPath}"`;
            
            const { stdout, stderr } = await this.execAsync(command, {
                timeout: this.printTimeout
            });
            
            if (stderr && !stderr.includes('request id is')) {
                throw new Error(stderr);
            }
            
            // Don't clean up PDF file - keep it for gallery download
            console.log(`PDF saved at: ${pdfPath}`);
            
            return {
                success: true,
                printJob: stdout.trim(),
                printer: printer,
                imagePath: imagePath,
                pdfPath: pdfPath,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Printing error:', error);
            throw new Error(`Printing failed: ${error.message}`);
        }
    }

    /**
     * Get available printers
     */
    async getAvailablePrinters() {
        try {
            const { stdout } = await this.execAsync('lpstat -p', { timeout: 10000 });
            
            const printers = [];
            const lines = stdout.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('printer')) {
                    const parts = line.split(' ');
                    if (parts.length >= 2) {
                        const printerName = parts[1];
                        const isIdle = line.includes('idle');
                        const isEnabled = !line.includes('disabled');
                        
                        printers.push({
                            name: printerName,
                            status: isIdle ? 'idle' : 'busy',
                            enabled: isEnabled
                        });
                    }
                }
            }
            
            return printers;
        } catch (error) {
            console.error('Error getting printers:', error);
            return [];
        }
    }

    /**
     * Get default printer
     */
    async getDefaultPrinter() {
        try {
            const { stdout } = await this.execAsync('lpstat -d', { timeout: 10000 });
            
            const match = stdout.match(/system default destination: (.+)/);
            if (match) {
                return match[1].trim();
            }
            
            return this.defaultPrinter;
        } catch (error) {
            console.error('Error getting default printer:', error);
            return this.defaultPrinter;
        }
    }

    /**
     * Set default printer
     */
    async setDefaultPrinter(printerName) {
        try {
            await this.execAsync(`lpoptions -d ${printerName}`, { timeout: 10000 });
            this.defaultPrinter = printerName;
            console.log(`✅ Default printer set to: ${printerName}`);
            return true;
        } catch (error) {
            console.error('Error setting default printer:', error);
            throw new Error(`Failed to set default printer: ${error.message}`);
        }
    }

    /**
     * Test printer
     */
    async testPrinter(printerName = null) {
        try {
            const printer = printerName || this.defaultPrinter;
            const testMessage = 'Vienna Photo Booth Test Print';
            
            const { stdout, stderr } = await this.execAsync(
                `echo "${testMessage}" | lp -d ${printer}`,
                { timeout: this.printTimeout }
            );
            
            if (stderr && !stderr.includes('request id is')) {
                throw new Error(stderr);
            }
            
            return {
                success: true,
                message: 'Test print sent successfully',
                printJob: stdout.trim(),
                printer: printer
            };
        } catch (error) {
            console.error('Test print error:', error);
            throw new Error(`Test print failed: ${error.message}`);
        }
    }

    /**
     * Get print queue status
     */
    async getPrintQueue() {
        try {
            const { stdout } = await this.execAsync('lpstat -o', { timeout: 10000 });
            
            const jobs = [];
            const lines = stdout.split('\n');
            
            for (const line of lines) {
                if (line.includes('printer')) {
                    const parts = line.split(' ');
                    if (parts.length >= 3) {
                        const jobId = parts[0];
                        const printer = parts[1];
                        const status = parts[2];
                        
                        jobs.push({
                            jobId,
                            printer,
                            status,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
            
            return jobs;
        } catch (error) {
            console.error('Error getting print queue:', error);
            return [];
        }
    }

    /**
     * Cancel print job
     */
    async cancelPrintJob(jobId) {
        try {
            await this.execAsync(`cancel ${jobId}`, { timeout: 10000 });
            console.log(`✅ Print job ${jobId} cancelled successfully`);
            return true;
        } catch (error) {
            console.error('Error cancelling print job:', error);
            throw new Error(`Failed to cancel print job: ${error.message}`);
        }
    }

    /**
     * Get printer status
     */
    async getPrinterStatus(printerName = null) {
        try {
            const printer = printerName || this.defaultPrinter;
            const { stdout } = await this.execAsync(`lpstat -p ${printer}`, { timeout: 10000 });
            
            const isIdle = stdout.includes('idle');
            const isEnabled = !stdout.includes('disabled');
            const isAccepting = !stdout.includes('not accepting');
            
            return {
                name: printer,
                status: isIdle ? 'idle' : 'busy',
                enabled: isEnabled,
                accepting: isAccepting,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting printer status:', error);
            return {
                name: printerName || this.defaultPrinter,
                status: 'unknown',
                enabled: false,
                accepting: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Set print timeout
     */
    setPrintTimeout(timeout) {
        if (timeout < 1000) {
            throw new Error('Print timeout must be at least 1000ms');
        }
        this.printTimeout = timeout;
        console.log(`✅ Print timeout set to: ${timeout}ms`);
    }

    /**
     * Get CUPS server status
     */
    async getCupsStatus() {
        try {
            const { stdout } = await this.execAsync('lpstat -r', { timeout: 10000 });
            
            return {
                running: stdout.includes('scheduler is running'),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting CUPS status:', error);
            return {
                running: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get printer options
     */
    async getPrinterOptions(printerName = null) {
        try {
            const printer = printerName || this.defaultPrinter;
            const { stdout } = await this.execAsync(`lpoptions -p ${printer}`, { timeout: 10000 });
            
            const options = {};
            const lines = stdout.split('\n');
            
            for (const line of lines) {
                if (line.includes('=')) {
                    const [key, value] = line.split('=');
                    options[key.trim()] = value.trim();
                }
            }
            
            return options;
        } catch (error) {
            console.error('Error getting printer options:', error);
            return {};
        }
    }
}

module.exports = PrinterManager; 