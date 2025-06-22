/**
 * Middleware Configuration
 * Centralized middleware setup for Vienna Photo Booth
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('../config/config');

class MiddlewareManager {
    constructor(app) {
        this.app = app;
    }

    /**
     * Setup all middleware
     */
    setup() {
        this.setupSecurity();
        this.setupCors();
        this.setupLogging();
        this.setupBodyParsing();
        this.setupStaticFiles();
    }

    /**
     * Setup security middleware
     */
    setupSecurity() {
        if (config.helmetEnabled) {
            this.app.use(helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        scriptSrc: ["'self'"],
                        imgSrc: ["'self'", "data:", "blob:"],
                        mediaSrc: ["'self'", "blob:"],
                        connectSrc: ["'self'"]
                    }
                }
            }));
            console.log('✅ Security middleware (Helmet) enabled');
        }
    }

    /**
     * Setup CORS middleware
     */
    setupCors() {
        if (config.corsEnabled) {
            this.app.use(cors({
                origin: config.isDevelopment ? true : false,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization']
            }));
            console.log('✅ CORS middleware enabled');
        }
    }

    /**
     * Setup logging middleware
     */
    setupLogging() {
        if (config.enableMorgan) {
            this.app.use(morgan(config.logLevel));
            console.log('✅ Logging middleware (Morgan) enabled');
        }
    }

    /**
     * Setup body parsing middleware
     */
    setupBodyParsing() {
        this.app.use(express.json({ 
            limit: config.maxFileSize,
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));
        
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: config.maxFileSize 
        }));
        
        console.log('✅ Body parsing middleware enabled');
    }

    /**
     * Setup static files middleware
     */
    setupStaticFiles() {
        this.app.use('/static', express.static(config.staticPath));
        this.app.use('/static/custom-frames', express.static(config.customFramesPath));
        this.app.use('/uploads', express.static(config.uploadPath));
        console.log('✅ Static files middleware enabled');
    }

    /**
     * Setup request timeout middleware
     */
    setupRequestTimeout() {
        this.app.use((req, res, next) => {
            const timeout = setTimeout(() => {
                res.status(408).json({
                    error: 'Request timeout',
                    message: 'The request took too long to process',
                    timestamp: new Date().toISOString()
                });
            }, config.requestTimeout);

            res.on('finish', () => {
                clearTimeout(timeout);
            });

            next();
        });
    }

    /**
     * Setup rate limiting middleware (basic)
     */
    setupRateLimiting() {
        const requestCounts = new Map();
        const windowMs = 15 * 60 * 1000; // 15 minutes
        const maxRequests = config.maxConcurrentRequests;

        this.app.use((req, res, next) => {
            const clientIp = req.ip || req.connection.remoteAddress;
            const now = Date.now();
            
            // Clean old entries
            for (const [ip, data] of requestCounts.entries()) {
                if (now - data.timestamp > windowMs) {
                    requestCounts.delete(ip);
                }
            }

            // Check current requests
            const clientData = requestCounts.get(clientIp);
            if (!clientData) {
                requestCounts.set(clientIp, { count: 1, timestamp: now });
            } else if (clientData.count >= maxRequests) {
                return res.status(429).json({
                    error: 'Too many requests',
                    message: 'Rate limit exceeded',
                    timestamp: new Date().toISOString()
                });
            } else {
                clientData.count++;
            }

            next();
        });
    }
}

module.exports = MiddlewareManager; 