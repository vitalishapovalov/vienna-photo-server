/**
 * Vienna Photo Booth Server - Main Entry Point
 * This file serves as the entry point for the modular photo booth application
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const PhotoBoothServer = require('./src/server');

// SSL certificate paths (for development)
const SSL_KEY_PATH = path.join(__dirname, 'ssl', 'key.pem');
const SSL_CERT_PATH = path.join(__dirname, 'ssl', 'cert.pem');

// Check if SSL certificates exist
const hasSSL = fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH);

// Initialize the photo booth server
const photoBoothServer = new PhotoBoothServer();

// Initialize the server first
photoBoothServer.initialize().then(() => {
    // Create Express app
    const app = photoBoothServer.app;
    
    // Start server based on SSL availability
    if (hasSSL) {
        // HTTPS server
        const httpsOptions = {
            key: fs.readFileSync(SSL_KEY_PATH),
            cert: fs.readFileSync(SSL_CERT_PATH)
        };
        
        const httpsServer = https.createServer(httpsOptions, app);
        httpsServer.listen(5000, '0.0.0.0', () => {
            console.log('🎉 Vienna Photo Booth Server is running!');
            console.log('📍 HTTPS Server: https://0.0.0.0:5000');
            console.log('🌍 Environment: development (HTTPS)');
            console.log('📁 Uploads:', photoBoothServer.uploadsDir);
            console.log('🖼️  Custom Frames:', photoBoothServer.customFramesDir);
            console.log('🖨️  Default Printer:', photoBoothServer.defaultPrinter);
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
            console.log('Press Ctrl+C to stop the server');
        });
    } else {
        // HTTP server (fallback)
        const httpServer = http.createServer(app);
        httpServer.listen(5000, '0.0.0.0', () => {
            console.log('🎉 Vienna Photo Booth Server is running!');
            console.log('📍 HTTP Server: http://0.0.0.0:5000');
            console.log('🌍 Environment: development (HTTP)');
            console.log('⚠️  Note: Camera access requires HTTPS on mobile devices');
            console.log('📁 Uploads:', photoBoothServer.uploadsDir);
            console.log('🖼️  Custom Frames:', photoBoothServer.customFramesDir);
            console.log('🖨️  Default Printer:', photoBoothServer.defaultPrinter);
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
            console.log('Press Ctrl+C to stop the server');
        });
    }
}).catch((error) => {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
    photoBoothServer.cleanup();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
    photoBoothServer.cleanup();
    process.exit(0);
}); 