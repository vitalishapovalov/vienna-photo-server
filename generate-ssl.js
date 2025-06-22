#!/usr/bin/env node

/**
 * Generate SSL certificates for development
 * This creates self-signed certificates for HTTPS testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SSL_DIR = path.join(__dirname, 'ssl');
const KEY_PATH = path.join(SSL_DIR, 'key.pem');
const CERT_PATH = path.join(SSL_DIR, 'cert.pem');

console.log('🔐 Generating SSL certificates for development...');

// Create SSL directory
if (!fs.existsSync(SSL_DIR)) {
    fs.mkdirSync(SSL_DIR, { recursive: true });
    console.log('✅ Created SSL directory');
}

// Check if certificates already exist
if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    console.log('⚠️  SSL certificates already exist');
    console.log('   To regenerate, delete the ssl/ directory and run this script again');
    process.exit(0);
}

try {
    // Generate private key
    console.log('📝 Generating private key...');
    execSync(`openssl genrsa -out "${KEY_PATH}" 2048`, { stdio: 'inherit' });
    
    // Generate certificate
    console.log('📜 Generating certificate...');
    const certCommand = `openssl req -new -x509 -key "${KEY_PATH}" -out "${CERT_PATH}" -days 365 -subj "/C=US/ST=Development/L=Development/O=Vienna Photo Booth/OU=Development/CN=localhost"`;
    execSync(certCommand, { stdio: 'inherit' });
    
    console.log('✅ SSL certificates generated successfully!');
    console.log('📍 Key file:', KEY_PATH);
    console.log('📍 Cert file:', CERT_PATH);
    console.log('');
    console.log('🚀 You can now start the server with HTTPS support:');
    console.log('   npm start');
    console.log('');
    console.log('⚠️  Note: These are self-signed certificates for development only.');
    console.log('   Your browser will show a security warning - this is normal.');
    console.log('   Click "Advanced" and "Proceed to localhost" to continue.');
    
} catch (error) {
    console.error('❌ Failed to generate SSL certificates:', error.message);
    console.log('');
    console.log('💡 Make sure OpenSSL is installed on your system:');
    console.log('   macOS: brew install openssl');
    console.log('   Ubuntu/Debian: sudo apt-get install openssl');
    console.log('   Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
    process.exit(1);
} 