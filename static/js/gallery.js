/**
 * Vienna Photo Booth - Gallery JavaScript
 * Handles gallery functionality for browsing and managing processed photos
 */

class Gallery {
    constructor() {
        this.images = [];
        this.selectedImages = new Set();
        this.initializeElements();
        this.bindEvents();
        this.initializeGallery();
    }

    initializeElements() {
        // Gallery controls
        this.refreshGalleryBtn = document.getElementById('refreshGallery');
        this.selectAllBtn = document.getElementById('selectAll');
        this.deselectAllBtn = document.getElementById('deselectAll');
        this.deleteSelectedBtn = document.getElementById('deleteSelected');
        
        // Gallery display
        this.galleryGrid = document.getElementById('galleryGrid');
        this.galleryEmpty = document.getElementById('galleryEmpty');
        
        // Stats
        this.totalImagesSpan = document.getElementById('totalImages');
        this.selectedCountSpan = document.getElementById('selectedCount');
        this.totalSizeSpan = document.getElementById('totalSize');
        
        // Status indicators
        this.serverStatusIndicator = document.getElementById('serverStatus');
        this.printerStatusIndicator = document.getElementById('printerStatus');
        
        // Loading and modals
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.closeErrorModal = document.getElementById('closeErrorModal');
        this.dismissError = document.getElementById('dismissError');
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.closeConfirmModal = document.getElementById('closeConfirmModal');
        this.cancelAction = document.getElementById('cancelAction');
        this.confirmAction = document.getElementById('confirmAction');
        
        // Validate critical elements exist
        const criticalElements = [
            { element: this.galleryGrid, name: 'galleryGrid' },
            { element: this.errorModal, name: 'errorModal' },
            { element: this.errorMessage, name: 'errorMessage' }
        ];
        
        const missingElements = criticalElements
            .filter(item => !item.element)
            .map(item => item.name);
            
        if (missingElements.length > 0) {
            throw new Error(`Missing critical DOM elements: ${missingElements.join(', ')}`);
        }
    }

    bindEvents() {
        // Gallery controls
        if (this.refreshGalleryBtn) {
            this.refreshGalleryBtn.addEventListener('click', () => this.loadGallery());
        }
        if (this.selectAllBtn) {
            this.selectAllBtn.addEventListener('click', () => this.selectAll());
        }
        if (this.deselectAllBtn) {
            this.deselectAllBtn.addEventListener('click', () => this.deselectAll());
        }
        if (this.deleteSelectedBtn) {
            this.deleteSelectedBtn.addEventListener('click', () => this.confirmDeleteSelected());
        }
        
        // Modal events
        if (this.closeErrorModal) {
            this.closeErrorModal.addEventListener('click', () => this.hideErrorModal());
        }
        if (this.dismissError) {
            this.dismissError.addEventListener('click', () => this.hideErrorModal());
        }
        if (this.errorModal) {
            this.errorModal.addEventListener('click', (e) => {
                if (e.target === this.errorModal) this.hideErrorModal();
            });
        }
        
        if (this.closeConfirmModal) {
            this.closeConfirmModal.addEventListener('click', () => this.hideConfirmModal());
        }
        if (this.cancelAction) {
            this.cancelAction.addEventListener('click', () => this.hideConfirmModal());
        }
        if (this.confirmAction) {
            this.confirmAction.addEventListener('click', () => this.executeConfirmedAction());
        }
        if (this.confirmModal) {
            this.confirmModal.addEventListener('click', (e) => {
                if (e.target === this.confirmModal) this.hideConfirmModal();
            });
        }
    }

    async initializeGallery() {
        try {
            // Check server health
            await this.checkServerHealth();
            
            // Check printer status
            await this.checkPrinterStatus();
            
            // Load gallery
            await this.loadGallery();
            
        } catch (error) {
            console.error('Failed to initialize gallery:', error);
            this.showError('Failed to initialize gallery: ' + error.message);
        }
    }

    async checkServerHealth() {
        try {
            const response = await fetch('/health');
            const health = await response.json();
            
            if (health.status === 'OK') {
                this.updateServerStatus('online', 'Server Online');
            } else {
                this.updateServerStatus('offline', 'Server Offline');
            }
        } catch (error) {
            this.updateServerStatus('offline', 'Server Unreachable');
            throw error;
        }
    }

    async checkPrinterStatus() {
        try {
            const response = await fetch('/api/printers');
            const data = await response.json();
            
            if (data.success && data.printers && data.printers.length > 0) {
                const defaultPrinter = data.printers.find(p => p.name === 'default') || data.printers[0];
                this.updatePrinterStatus('online', `Printer: ${defaultPrinter.name}`);
            } else {
                this.updatePrinterStatus('offline', 'No printers available');
            }
        } catch (error) {
            console.error('Failed to check printer status:', error);
            this.updatePrinterStatus('offline', 'Printer: Error');
        }
    }

    updatePrinterStatus(status, text) {
        if (!this.printerStatusIndicator) return;
        
        const dot = this.printerStatusIndicator.querySelector('.status-dot');
        const textElement = this.printerStatusIndicator.querySelector('.status-text');
        
        if (dot) {
            dot.className = 'status-dot ' + status;
        }
        
        if (textElement) {
            textElement.textContent = text;
        }
    }

    async loadGallery() {
        try {
            this.showLoading('Loading gallery...');
            
            const response = await fetch('/api/gallery');
            const data = await response.json();
            
            if (data.success) {
                this.images = data.images || [];
                this.renderGallery();
                this.updateStats();
            } else {
                throw new Error(data.error || 'Failed to load gallery');
            }
            
        } catch (error) {
            console.error('Failed to load gallery:', error);
            this.showError('Failed to load gallery: ' + error.message);
            this.showEmptyState();
        } finally {
            this.hideLoading();
        }
    }

    renderGallery() {
        if (this.images.length === 0) {
            this.showEmptyState();
            return;
        }

        this.galleryEmpty.style.display = 'none';
        this.galleryGrid.innerHTML = '';

        this.images.forEach(image => {
            const imageElement = this.createImageElement(image);
            this.galleryGrid.appendChild(imageElement);
        });
    }

    createImageElement(image) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'gallery-item';
        imageContainer.setAttribute('data-filename', image.filename);
        
        const isSelected = this.selectedImages.has(image.filename);
        if (isSelected) {
            imageContainer.classList.add('selected');
        }
        
        // Create action buttons HTML
        let actionButtons = `
            <button class="btn btn-small btn-outline download-single" title="Download Image">
                <span class="btn-icon">📥</span>
            </button>`;
        
        // Add PDF download button if PDF exists
        if (image.pdfExists) {
            actionButtons += `
                <button class="btn btn-small btn-outline download-pdf" title="Download PDF">
                    <span class="btn-icon">📄</span>
                </button>`;
        }
        
        actionButtons += `
            <button class="btn btn-small btn-danger delete-single" title="Delete">
                <span class="btn-icon">🗑️</span>
            </button>`;
        
        imageContainer.innerHTML = `
            <div class="image-preview">
                <img src="/uploads/${image.filename}" alt="${image.name}" loading="lazy">
                <div class="image-overlay">
                    <div class="image-info">
                        <span class="image-name">${image.name}</span>
                        <span class="image-size">${this.formatBytes(image.size)}</span>
                        <span class="image-date">${this.formatDate(image.created)}</span>
                        ${image.pdfExists ? `<span class="pdf-indicator">📄 PDF Available</span>` : ''}
                    </div>
                    <div class="image-actions">
                        ${actionButtons}
                    </div>
                </div>
                <div class="selection-indicator">
                    <span class="checkmark">✓</span>
                </div>
            </div>
        `;
        
        // Add click event for selection
        imageContainer.addEventListener('click', (e) => {
            if (!e.target.closest('.image-actions')) {
                this.toggleImageSelection(image.filename);
            }
        });
        
        // Add download button event
        const downloadBtn = imageContainer.querySelector('.download-single');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadImage(image.filename);
            });
        }
        
        // Add PDF download button event
        const downloadPdfBtn = imageContainer.querySelector('.download-pdf');
        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadPDF(image.filename);
            });
        }
        
        // Add delete button event
        const deleteBtn = imageContainer.querySelector('.delete-single');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.confirmDeleteImage(image.filename, image.name);
            });
        }
        
        return imageContainer;
    }

    toggleImageSelection(filename) {
        if (this.selectedImages.has(filename)) {
            this.selectedImages.delete(filename);
        } else {
            this.selectedImages.add(filename);
        }
        
        this.updateSelectionUI();
        this.updateStats();
    }

    selectAll() {
        this.images.forEach(image => {
            this.selectedImages.add(image.filename);
        });
        this.updateSelectionUI();
        this.updateStats();
    }

    deselectAll() {
        this.selectedImages.clear();
        this.updateSelectionUI();
        this.updateStats();
    }

    updateSelectionUI() {
        // Update gallery items
        document.querySelectorAll('.gallery-item').forEach(item => {
            const filename = item.getAttribute('data-filename');
            if (this.selectedImages.has(filename)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
        
        // Update control buttons
        const hasSelection = this.selectedImages.size > 0;
        if (this.deleteSelectedBtn) {
            this.deleteSelectedBtn.disabled = !hasSelection;
        }
    }

    updateStats() {
        if (this.totalImagesSpan) {
            this.totalImagesSpan.textContent = `Total: ${this.images.length} images`;
        }
        
        if (this.selectedCountSpan) {
            this.selectedCountSpan.textContent = `Selected: ${this.selectedImages.size}`;
        }
        
        if (this.totalSizeSpan) {
            const totalSize = this.images.reduce((sum, image) => sum + image.size, 0);
            this.totalSizeSpan.textContent = `Size: ${this.formatBytes(totalSize)}`;
        }
    }

    async downloadImage(filename) {
        try {
            const response = await fetch(`/uploads/${filename}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showSuccess('Image downloaded successfully!');
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Download failed:', error);
            this.showError('Download failed: ' + error.message);
        }
    }

    async downloadPDF(filename) {
        try {
            const response = await fetch(`/api/gallery/pdf/${encodeURIComponent(filename)}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename.replace(/\.[^.]+$/, '.pdf');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showSuccess('PDF downloaded successfully!');
            } else {
                throw new Error('PDF download failed');
            }
        } catch (error) {
            console.error('PDF download failed:', error);
            this.showError('PDF download failed: ' + error.message);
        }
    }

    confirmDeleteSelected() {
        if (this.selectedImages.size === 0) return;
        
        const count = this.selectedImages.size;
        const message = `Are you sure you want to delete ${count} selected image${count > 1 ? 's' : ''} and their corresponding PDF files? This action cannot be undone.`;
        
        this.showConfirmModal(message, () => this.deleteSelected());
    }

    confirmDeleteImage(filename, name) {
        const message = `Are you sure you want to delete "${name}" and its corresponding PDF file? This action cannot be undone.`;
        
        this.showConfirmModal(message, () => this.deleteImage(filename));
    }

    async deleteSelected() {
        try {
            this.showLoading('Deleting images and PDFs...');
            
            const response = await fetch('/api/gallery/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filenames: Array.from(this.selectedImages)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.selectedImages.clear();
                await this.loadGallery();
                
                let message = `Successfully deleted ${data.deletedCount} images`;
                if (data.deletedPdfCount > 0) {
                    message += ` and ${data.deletedPdfCount} PDF files`;
                }
                this.showSuccess(message);
            } else {
                throw new Error(data.error || 'Delete failed');
            }
            
        } catch (error) {
            console.error('Delete failed:', error);
            this.showError('Delete failed: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async deleteImage(filename) {
        try {
            this.showLoading('Deleting image and PDF...');
            
            const response = await fetch(`/api/gallery/delete/${encodeURIComponent(filename)}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadGallery();
                this.showSuccess('Image and corresponding PDF deleted successfully');
            } else {
                throw new Error(data.error || 'Delete failed');
            }
            
        } catch (error) {
            console.error('Delete failed:', error);
            this.showError('Delete failed: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    showEmptyState() {
        this.galleryGrid.innerHTML = '';
        this.galleryEmpty.style.display = 'block';
    }

    updateServerStatus(status, text) {
        if (!this.serverStatusIndicator) return;
        
        const dot = this.serverStatusIndicator.querySelector('.status-dot');
        const textElement = this.serverStatusIndicator.querySelector('.status-text');
        
        if (dot && textElement) {
            dot.className = `status-dot ${status}`;
            textElement.textContent = text;
        }
    }

    showLoading(message = 'Processing...') {
        if (this.loadingMessage && this.loadingOverlay) {
            this.loadingMessage.textContent = message;
            this.loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }

    showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showError(message) {
        if (this.errorMessage && this.errorModal) {
            this.errorMessage.textContent = message;
            this.errorModal.style.display = 'flex';
        } else {
            console.error('Error:', message);
            alert('Error: ' + message);
        }
    }

    hideErrorModal() {
        if (this.errorModal) {
            this.errorModal.style.display = 'none';
        }
    }

    showConfirmModal(message, onConfirm) {
        if (this.confirmMessage && this.confirmModal) {
            this.confirmMessage.textContent = message;
            this.confirmModal.style.display = 'flex';
            this.confirmAction.onclick = onConfirm;
        }
    }

    hideConfirmModal() {
        if (this.confirmModal) {
            this.confirmModal.style.display = 'none';
        }
    }

    executeConfirmedAction() {
        // This will be set by showConfirmModal
        this.hideConfirmModal();
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

// Initialize the gallery when the page loads
let gallery;

document.addEventListener('DOMContentLoaded', () => {
    gallery = new Gallery();
}); 