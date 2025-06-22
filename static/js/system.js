/**
 * Vienna Photo Booth - System Management JavaScript
 * Handles system information, printer management, and frame management
 */

class SystemManager {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeApp();
    }

    initializeElements() {
        // Status indicators
        this.serverStatusIndicator = document.getElementById('serverStatus');
        this.printerStatusIndicator = document.getElementById('printerStatus');
        
        // System information
        this.serverStatusValue = document.getElementById('serverStatusValue');
        this.serverUptime = document.getElementById('serverUptime');
        this.serverVersion = document.getElementById('serverVersion');
        this.systemMemory = document.getElementById('systemMemory');
        this.systemCPU = document.getElementById('systemCPU');
        this.systemPlatform = document.getElementById('systemPlatform');
        this.configEnv = document.getElementById('configEnv');
        this.configQuality = document.getElementById('configQuality');
        this.configMaxSize = document.getElementById('configMaxSize');
        
        // Cleanup management
        this.uploadFileCount = document.getElementById('uploadFileCount');
        this.uploadTotalSize = document.getElementById('uploadTotalSize');
        this.uploadOldestFile = document.getElementById('uploadOldestFile');
        this.runCleanupBtn = document.getElementById('runCleanup');
        this.refreshCleanupBtn = document.getElementById('refreshCleanup');
        this.cleanupStatus = document.getElementById('cleanupStatus');
        
        // Printer management
        this.printerSelect = document.getElementById('printerSelect');
        this.refreshPrintersBtn = document.getElementById('refreshPrinters');
        this.printQueue = document.getElementById('printQueue');
        
        // Frame management - Upload
        this.frameUpload = document.getElementById('frameUpload');
        this.selectFrameFileBtn = document.getElementById('selectFrameFile');
        this.uploadFrameBtn = document.getElementById('uploadFrame');
        this.uploadStatus = document.getElementById('uploadStatus');
        
        // Frame management - Gallery
        this.frameGallery = document.getElementById('frameGallery');
        this.frameLoading = document.getElementById('frameLoading');
        this.frameSearch = document.getElementById('frameSearch');
        this.clearFrameSearch = document.getElementById('clearFrameSearch');
        
        // Modal elements
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.closeErrorModal = document.getElementById('closeErrorModal');
        this.dismissError = document.getElementById('dismissError');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingMessage = document.getElementById('loadingMessage');
        
        // Frame data
        this.frames = [];
        this.filteredFrames = [];
    }

    bindEvents() {
        // Cleanup management
        this.runCleanupBtn.addEventListener('click', () => this.runCleanup());
        this.refreshCleanupBtn.addEventListener('click', () => this.loadCleanupStats());
        
        // Printer management
        this.refreshPrintersBtn.addEventListener('click', () => this.loadPrinters());
        this.printerSelect.addEventListener('change', (e) => this.selectPrinter(e.target.value));
        
        // Frame management - Upload
        this.selectFrameFileBtn.addEventListener('click', () => this.frameUpload.click());
        this.frameUpload.addEventListener('change', (e) => this.handleFrameFileSelect(e));
        this.uploadFrameBtn.addEventListener('click', () => this.uploadCustomFrame());
        
        // Frame management - Gallery
        this.frameSearch.addEventListener('input', (e) => this.filterFrames(e.target.value));
        this.clearFrameSearch.addEventListener('click', () => this.clearFrameSearch());
        
        // Modal events
        this.closeErrorModal.addEventListener('click', () => this.hideErrorModal());
        this.dismissError.addEventListener('click', () => this.hideErrorModal());
        this.errorModal.addEventListener('click', (e) => {
            if (e.target === this.errorModal) this.hideErrorModal();
        });
    }

    async initializeApp() {
        try {
            // Check server health
            await this.checkServerHealth();
            
            // Load system information
            await this.loadSystemInfo();
            
            // Load cleanup stats
            await this.loadCleanupStats();
            
            // Load printers
            await this.loadPrinters();
            
            // Load frame gallery
            await this.loadFrameGallery();
            
            // Start monitoring
            this.startMonitoring();
            
        } catch (error) {
            console.error('Failed to initialize system manager:', error);
            this.showError('Failed to initialize system manager: ' + error.message);
        }
    }

    async checkServerHealth() {
        try {
            const response = await fetch('/health');
            const health = await response.json();
            
            if (health.status === 'OK') {
                this.updateServerStatus('online', 'Server Online');
                this.serverStatusValue.textContent = 'Online';
                this.serverUptime.textContent = this.formatUptime(health.uptime);
                this.serverVersion.textContent = health.version;
            } else {
                this.updateServerStatus('offline', 'Server Offline');
                this.serverStatusValue.textContent = 'Offline';
            }
        } catch (error) {
            this.updateServerStatus('offline', 'Server Unreachable');
            this.serverStatusValue.textContent = 'Unreachable';
            throw error;
        }
    }

    async loadSystemInfo() {
        try {
            const [systemResponse, configResponse] = await Promise.all([
                fetch('/api/system'),
                fetch('/api/config')
            ]);
            
            const system = await systemResponse.json();
            const config = await configResponse.json();
            
            // Update system information
            this.systemMemory.textContent = this.formatBytes(system.memory.used) + ' / ' + this.formatBytes(system.memory.total);
            this.systemCPU.textContent = system.cpu.cores + ' cores';
            this.systemPlatform.textContent = system.platform + ' (' + system.arch + ')';
            
            // Update configuration
            this.configEnv.textContent = config.config.server.environment;
            this.configQuality.textContent = config.config.features.imageQuality + '%';
            this.configMaxSize.textContent = config.config.features.maxImageSize;
            
        } catch (error) {
            console.error('Failed to load system info:', error);
        }
    }

    async loadCleanupStats() {
        try {
            const response = await fetch('/api/cleanup/stats');
            const data = await response.json();
            
            if (data.success) {
                const stats = data.stats;
                
                // Update cleanup information
                this.uploadFileCount.textContent = stats.fileCount;
                this.uploadTotalSize.textContent = stats.totalSizeFormatted;
                this.uploadOldestFile.textContent = stats.oldestFileAge || 'No files';
                
                // Clear any previous status
                this.cleanupStatus.textContent = '';
                this.cleanupStatus.className = 'status-message';
                
            } else {
                this.uploadFileCount.textContent = 'Error';
                this.uploadTotalSize.textContent = 'Error';
                this.uploadOldestFile.textContent = 'Error';
            }
        } catch (error) {
            console.error('Failed to load cleanup stats:', error);
            this.uploadFileCount.textContent = 'Error';
            this.uploadTotalSize.textContent = 'Error';
            this.uploadOldestFile.textContent = 'Error';
        }
    }

    async runCleanup() {
        try {
            // Disable button during cleanup
            this.runCleanupBtn.disabled = true;
            this.runCleanupBtn.textContent = '🧹 Cleaning...';
            
            // Show loading status
            this.cleanupStatus.textContent = 'Running cleanup...';
            this.cleanupStatus.className = 'status-message';
            
            const response = await fetch('/api/cleanup');
            const data = await response.json();
            
            if (data.success) {
                const result = data.result;
                const ageDeleted = result.ageCleanup.deletedCount;
                const sizeDeleted = result.sizeCleanup.deletedCount;
                const totalDeleted = ageDeleted + sizeDeleted;
                
                if (totalDeleted > 0) {
                    this.cleanupStatus.textContent = `✅ Cleanup completed: ${totalDeleted} files deleted`;
                    this.cleanupStatus.className = 'status-message success';
                } else {
                    this.cleanupStatus.textContent = '✅ No files needed cleanup';
                    this.cleanupStatus.className = 'status-message success';
                }
                
                // Refresh stats after cleanup
                await this.loadCleanupStats();
                
            } else {
                this.cleanupStatus.textContent = '❌ Cleanup failed: ' + (data.error || 'Unknown error');
                this.cleanupStatus.className = 'status-message error';
            }
            
        } catch (error) {
            console.error('Cleanup failed:', error);
            this.cleanupStatus.textContent = '❌ Cleanup failed: ' + error.message;
            this.cleanupStatus.className = 'status-message error';
        } finally {
            // Re-enable button
            this.runCleanupBtn.disabled = false;
            this.runCleanupBtn.innerHTML = '<span class="btn-icon">🧹</span>Cleanup Files';
        }
    }

    async loadPrinters() {
        try {
            const response = await fetch('/api/printers');
            const data = await response.json();
            
            if (data.success && data.printers.length > 0) {
                // Clear existing options
                this.printerSelect.innerHTML = '';
                
                // Add printer options
                data.printers.forEach(printer => {
                    const option = document.createElement('option');
                    option.value = printer.name;
                    option.textContent = `${printer.name} (${printer.status})`;
                    this.printerSelect.appendChild(option);
                });
                
                // Update printer status
                this.updatePrinterStatus('online', `Printer: ${data.printers[0].name}`);
                
            } else {
                this.updatePrinterStatus('offline', 'No printers available');
                this.printerSelect.innerHTML = '<option value="">No printers found</option>';
            }
            
            // Load print queue
            await this.loadPrintQueue();
            
        } catch (error) {
            console.error('Failed to load printers:', error);
            this.updatePrinterStatus('offline', 'Printer: Error');
            this.printerSelect.innerHTML = '<option value="">Error loading printers</option>';
        }
    }

    async loadPrintQueue() {
        try {
            const response = await fetch('/api/print-queue');
            const data = await response.json();
            
            if (data.success && data.queue.length > 0) {
                this.printQueue.innerHTML = data.queue.map(job => `
                    <div class="queue-item">
                        <span class="job-id">${job.jobId}</span>
                        <span class="job-status">${job.status}</span>
                        <button class="btn btn-small" onclick="systemManager.cancelPrintJob('${job.jobId}')">Cancel</button>
                    </div>
                `).join('');
            } else {
                this.printQueue.innerHTML = '<span class="queue-empty">No jobs in queue</span>';
            }
        } catch (error) {
            console.error('Failed to load print queue:', error);
            this.printQueue.innerHTML = '<span class="queue-empty">Error loading queue</span>';
        }
    }

    async loadFrameGallery() {
        try {
            if (this.frameLoading) {
                this.frameLoading.style.display = 'flex';
            }
            
            const response = await fetch('/api/frames');
            this.frames = await response.json();
            this.filteredFrames = [...this.frames];
            
            this.renderFrameGallery();
            
            if (this.frameLoading) {
                this.frameLoading.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Failed to load frame gallery:', error);
            if (this.frameLoading) {
                this.frameLoading.innerHTML = '<span>Error loading frames</span>';
            }
        }
    }

    renderFrameGallery() {
        if (!this.frameGallery) return;
        
        if (this.filteredFrames.length === 0) {
            this.frameGallery.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🖼️</div>
                    <h3>No frames found</h3>
                    <p>Upload your first custom frame to get started!</p>
                </div>
            `;
            return;
        }
        
        const frameItems = this.filteredFrames.map(frame => this.createFrameGalleryItem(frame)).join('');
        this.frameGallery.innerHTML = frameItems;
        
        // Add event listeners to frame items
        this.frameGallery.querySelectorAll('.frame-gallery-item').forEach((item, index) => {
            item.addEventListener('click', () => this.showFrameDetails(this.filteredFrames[index].id));
        });
    }

    createFrameGalleryItem(frame) {
        const dimensions = frame.width && frame.height ? 
            `${frame.width}×${frame.height}` : 'Unknown size';
        const size = frame.size ? this.formatBytes(frame.size) : 'Unknown size';
        
        return `
            <div class="frame-gallery-item">
                <div class="frame-gallery-preview">
                    <img src="${frame.url}" alt="${frame.name}" loading="lazy">
                </div>
                <div class="frame-gallery-info">
                    <div class="frame-gallery-name">${frame.name}</div>
                    <div class="frame-gallery-details">
                        <span>Dimensions: ${dimensions}</span>
                        <span>Size: ${size}</span>
                        <span>Type: ${frame.type}</span>
                    </div>
                </div>
                <div class="frame-gallery-actions">
                    <button class="btn btn-small btn-outline" onclick="event.stopPropagation(); systemManager.showFrameDetails('${frame.id}')">
                        <span class="btn-icon">👁️</span>
                        Details
                    </button>
                    <button class="btn btn-small btn-warning" onclick="event.stopPropagation(); systemManager.deleteFrame('${frame.id}', '${frame.name}')">
                        <span class="btn-icon">🗑️</span>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    filterFrames(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredFrames = [...this.frames];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredFrames = this.frames.filter(frame => 
                frame.name.toLowerCase().includes(term) ||
                frame.type.toLowerCase().includes(term)
            );
        }
        this.renderFrameGallery();
    }

    clearFrameSearch() {
        this.frameSearch.value = '';
        this.filterFrames('');
    }

    async showFrameDetails(frameId) {
        try {
            const response = await fetch(`/api/frames/${frameId}/placement`);
            const placement = await response.json();
            
            if (placement.error) {
                throw new Error(placement.error);
            }
            
            this.showSuccess(`Frame Details: ${placement.width}×${placement.height} pixels at position (${placement.left}, ${placement.top})`);
        } catch (error) {
            console.error('Failed to get frame details:', error);
            this.showError('Failed to get frame details: ' + error.message);
        }
    }

    async deleteFrame(frameId, frameName) {
        if (!confirm(`Are you sure you want to delete the frame "${frameName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/frames/custom/${frameId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(`Frame "${frameName}" deleted successfully`);
                await this.loadFrameGallery();
            } else {
                this.showError('Failed to delete frame: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to delete frame:', error);
            this.showError('Failed to delete frame: ' + error.message);
        }
    }

    handleFrameFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            this.selectedFrameFile = null;
            this.uploadFrameBtn.disabled = true;
            this.showUploadStatus('', '');
            return;
        }
        
        // Validate file type
        if (file.type !== 'image/png') {
            this.showUploadStatus('❌ Only PNG files are allowed', 'error');
            this.uploadFrameBtn.disabled = true;
            return;
        }
        
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showUploadStatus('❌ File size must be less than 10MB', 'error');
            this.uploadFrameBtn.disabled = true;
            return;
        }
        
        // Store selected file and enable upload
        this.selectedFrameFile = file;
        this.uploadFrameBtn.disabled = false;
        this.showUploadStatus(`✅ Selected: ${file.name} (${this.formatBytes(file.size)})`, 'success');
    }

    async uploadCustomFrame() {
        if (!this.selectedFrameFile) {
            this.showError('Please select a frame file first');
            return;
        }

        try {
            this.showLoading('Uploading frame...');
            this.uploadFrameBtn.disabled = true;
            
            const formData = new FormData();
            formData.append('frame', this.selectedFrameFile);
            
            const response = await fetch('/api/frames/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(`Frame "${data.frame.name}" uploaded successfully!`);
                
                // Reset form
                this.frameUpload.value = '';
                this.selectedFrameFile = null;
                this.uploadFrameBtn.disabled = true;
                this.showUploadStatus('', '');
                
                // Refresh frame gallery
                await this.loadFrameGallery();
                
            } else {
                this.showError('Failed to upload frame: ' + (data.error || 'Unknown error'));
            }
            
        } catch (error) {
            this.showError('Upload failed: ' + error.message);
            console.error('Upload error:', error);
        } finally {
            this.hideLoading();
            this.uploadFrameBtn.disabled = false;
        }
    }

    showUploadStatus(message, type = '') {
        this.uploadStatus.textContent = message;
        this.uploadStatus.className = 'status-message';
        if (type) {
            this.uploadStatus.className += ` ${type}`;
        }
    }

    async cancelPrintJob(jobId) {
        try {
            const response = await fetch(`/api/print-queue/${jobId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(`Print job ${jobId} cancelled`);
                await this.loadPrintQueue();
            } else {
                this.showError(result.error || 'Failed to cancel print job');
            }
        } catch (error) {
            this.showError('Failed to cancel print job: ' + error.message);
        }
    }

    selectPrinter(printerName) {
        console.log('Selected printer:', printerName);
    }

    startMonitoring() {
        // Monitor server health every 30 seconds
        setInterval(() => {
            this.checkServerHealth().catch(console.error);
        }, 30000);
        
        // Monitor system info every 60 seconds
        setInterval(() => {
            this.loadSystemInfo().catch(console.error);
        }, 60000);
        
        // Monitor print queue every 10 seconds
        setInterval(() => {
            this.loadPrintQueue().catch(console.error);
        }, 10000);
        
        // Monitor cleanup stats every 5 minutes
        setInterval(() => {
            this.loadCleanupStats().catch(console.error);
        }, 300000);
    }

    updateServerStatus(status, text) {
        const dot = this.serverStatusIndicator.querySelector('.status-dot');
        const textElement = this.serverStatusIndicator.querySelector('.status-text');
        
        dot.className = `status-dot ${status}`;
        textElement.textContent = text;
    }

    updatePrinterStatus(status, text) {
        const dot = this.printerStatusIndicator.querySelector('.status-dot');
        const textElement = this.printerStatusIndicator.querySelector('.status-text');
        
        dot.className = `status-dot ${status}`;
        textElement.textContent = text;
    }

    showLoading(message = 'Processing...') {
        this.loadingMessage.textContent = message;
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }

    showSuccess(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'status-message success';
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '20px';
        successDiv.style.right = '20px';
        successDiv.style.zIndex = '1000';
        successDiv.style.padding = '15px 20px';
        successDiv.style.borderRadius = '8px';
        successDiv.style.background = '#d4edda';
        successDiv.style.color = '#155724';
        successDiv.style.border = '1px solid #c3e6cb';
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 5000);
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.style.display = 'flex';
    }

    hideErrorModal() {
        this.errorModal.style.display = 'none';
    }

    formatUptime(seconds) {
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

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the system manager when the page loads
let systemManager;

document.addEventListener('DOMContentLoaded', () => {
    systemManager = new SystemManager();
}); 