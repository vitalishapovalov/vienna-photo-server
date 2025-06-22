/**
 * Vienna Photo Booth - Enhanced JavaScript
 * Modular photo booth application with system monitoring and printer management
 */

class PhotoBooth {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.photoPreview = document.getElementById('photoPreview');
        this.stream = null;
        this.capturedImage = null;
        this.originalImage = null; // Store the original photo without filters
        this.selectedFrame = null;
        this.selectedPrinter = 'default';
        this.systemInfo = null;
        this.isProcessing = false;
        this.selectedFilter = 'none';
        this.filterCanvas = null;
        this.facingMode = 'user'; // 'user' for front camera, 'environment' for back camera
        this.availableCameras = [];
        
        this.initializeElements();
        this.bindEvents();
        this.initializeApp();
    }

    initializeElements() {
        // Camera elements
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startCameraBtn = document.getElementById('startCamera');
        this.switchCameraBtn = document.getElementById('switchCamera');
        this.takePhotoBtn = document.getElementById('takePhoto');
        this.takePhotoAgainBtn = document.getElementById('takePhotoAgain');
        this.cameraSection = document.querySelector('.camera-section');
        
        // Preview elements
        this.photoPreview = document.getElementById('photoPreview');
        this.previewSection = document.querySelector('.preview-section');
        this.previewStatus = document.getElementById('previewStatus');
        this.downloadBtn = document.getElementById('downloadPhoto');
        this.downloadOriginalBtn = document.getElementById('downloadOriginal');
        
        // Frame elements
        this.frameSection = document.querySelector('.frame-section');
        this.frameLoading = document.getElementById('frameLoading');
        
        // Print elements
        this.printSection = document.querySelector('.print-section');
        this.printBtn = document.getElementById('printPhoto');
        this.processOnlyBtn = document.getElementById('processOnly');
        this.printStatus = document.getElementById('printStatus');
        
        // Printer management
        this.printerSelect = document.getElementById('printerSelect');
        this.refreshPrintersBtn = document.getElementById('refreshPrinters');
        this.printQueue = document.getElementById('printQueue');
        
        // Modal elements
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.closeErrorModal = document.getElementById('closeErrorModal');
        this.dismissError = document.getElementById('dismissError');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingMessage = document.getElementById('loadingMessage');
        
        // Status indicators
        this.serverStatusIndicator = document.getElementById('serverStatus');
        this.printerStatusIndicator = document.getElementById('printerStatus');
        
        // Mobile camera notice
        this.mobileCameraNotice = document.getElementById('mobileCameraNotice');
        
        // Filter elements
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.filterCanvas = document.createElement('canvas');
        this.filterCtx = this.filterCanvas.getContext('2d');
        
        // Validate critical elements exist
        const criticalElements = [
            { element: this.video, name: 'video' },
            { element: this.canvas, name: 'canvas' },
            { element: this.photoPreview, name: 'photoPreview' },
            { element: this.startCameraBtn, name: 'startCamera' },
            { element: this.takePhotoBtn, name: 'takePhoto' },
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
        // Camera controls
        if (this.startCameraBtn) {
            this.startCameraBtn.addEventListener('click', () => this.startCamera());
        }
        if (this.switchCameraBtn) {
            this.switchCameraBtn.addEventListener('click', () => this.switchCamera());
        }
        if (this.takePhotoBtn) {
            this.takePhotoBtn.addEventListener('click', () => this.takePhoto());
        }
        if (this.takePhotoAgainBtn) {
            this.takePhotoAgainBtn.addEventListener('click', () => this.takePhotoAgain());
        }
        if (this.printBtn) {
            this.printBtn.addEventListener('click', () => this.printPhoto());
        }
        if (this.processOnlyBtn) {
            this.processOnlyBtn.addEventListener('click', () => this.processOnly());
        }
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadPhoto());
        }
        if (this.downloadOriginalBtn) {
            this.downloadOriginalBtn.addEventListener('click', () => this.downloadOriginalPhoto());
        }
        
        // Printer management
        if (this.refreshPrintersBtn) {
            this.refreshPrintersBtn.addEventListener('click', () => this.loadPrinters());
        }
        if (this.printerSelect) {
            this.printerSelect.addEventListener('change', (e) => this.selectPrinter(e.target.value));
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
        
        // Back to frames button
        const backToFramesBtn = document.getElementById('backToFrames');
        if (backToFramesBtn) {
            backToFramesBtn.addEventListener('click', () => this.showFrameSection());
        }
        
        // Back to camera button
        const backToCameraBtn = document.getElementById('backToCamera');
        if (backToCameraBtn) {
            backToCameraBtn.addEventListener('click', () => this.showCameraSection());
        }
        
        // Filter buttons
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filterType = button.getAttribute('data-filter');
                this.selectFilter(filterType);
            });
        });
    }

    async initializeApp() {
        try {
            // Check browser compatibility for camera access
            this.checkCameraSupport();
            
            // Check server health
            await this.checkServerHealth();
            
            // Load printers
            await this.loadPrinters();
            
            // Load print queue
            await this.loadPrintQueue();
            
            // Load frames and show frame section
            await this.loadFrames();
            this.showFrameSection();
            
            // Start monitoring
            this.startMonitoring();
            
            console.log('Photo booth initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize photo booth:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    checkCameraSupport() {
        // Check if camera access is supported
        const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const hasLegacyGetUserMedia = !!(navigator.getUserMedia || 
                                        navigator.webkitGetUserMedia || 
                                        navigator.mozGetUserMedia || 
                                        navigator.msGetUserMedia);
        
        // Check if running on mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Show mobile notice if on mobile and not on HTTPS
        if (isMobile && location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            const mobileNotice = document.getElementById('mobileCameraNotice');
            if (mobileNotice) {
                mobileNotice.style.display = 'block';
            }
        }
        
        if (!hasGetUserMedia && !hasLegacyGetUserMedia) {
            console.warn('Camera access not supported in this browser');
            
            // Disable camera button and show warning
            if (this.startCameraBtn) {
                this.startCameraBtn.disabled = true;
                this.startCameraBtn.textContent = 'Camera Not Supported';
                this.startCameraBtn.title = 'Camera access requires HTTPS and a modern browser';
            }
            
            // Show warning message
            this.showError('Camera access not supported in this browser. Please use HTTPS and a modern browser for camera functionality.');
        }
        
        // Check if running on HTTPS (required for camera on mobile)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            console.warn('Camera access requires HTTPS on mobile devices');
            
            if (this.startCameraBtn) {
                this.startCameraBtn.title = 'Camera access requires HTTPS on mobile devices';
            }
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

    async loadPrinters() {
        try {
            const response = await fetch('/api/printers');
            const data = await response.json();
            
            if (data.success && data.printers.length > 0) {
                // Clear existing options
                if (this.printerSelect) {
                    this.printerSelect.innerHTML = '';
                    
                    // Add printer options
                    data.printers.forEach(printer => {
                        const option = document.createElement('option');
                        option.value = printer.name;
                        option.textContent = `${printer.name} (${printer.status})`;
                        this.printerSelect.appendChild(option);
                    });
                    
                    // Set default printer
                    this.selectedPrinter = data.printers[0].name;
                    this.printerSelect.value = this.selectedPrinter;
                }
                
                // Update printer status
                this.updatePrinterStatus('online', `Printer: ${this.selectedPrinter}`);
                
            } else {
                this.updatePrinterStatus('offline', 'No printers available');
                if (this.printerSelect) {
                    this.printerSelect.innerHTML = '<option value="">No printers found</option>';
                }
            }
            
            // Load print queue
            await this.loadPrintQueue();
            
        } catch (error) {
            console.error('Failed to load printers:', error);
            this.updatePrinterStatus('offline', 'Printer: Error');
            if (this.printerSelect) {
                this.printerSelect.innerHTML = '<option value="">Error loading printers</option>';
            }
        }
    }

    async loadPrintQueue() {
        try {
            const response = await fetch('/api/print-queue');
            const data = await response.json();
            
            if (this.printQueue) {
                if (data.success && data.queue.length > 0) {
                    this.printQueue.innerHTML = data.queue.map(job => `
                        <div class="queue-item">
                            <span class="job-id">${job.jobId}</span>
                            <span class="job-status">${job.status}</span>
                            <button class="btn btn-small" onclick="photoBooth.cancelPrintJob('${job.jobId}')">Cancel</button>
                        </div>
                    `).join('');
                } else {
                    this.printQueue.innerHTML = '<span class="queue-empty">No jobs in queue</span>';
                }
            }
        } catch (error) {
            console.error('Failed to load print queue:', error);
            if (this.printQueue) {
                this.printQueue.innerHTML = '<span class="queue-empty">Error loading queue</span>';
            }
        }
    }

    async loadFrames() {
        try {
            if (this.frameLoading) {
                this.frameLoading.style.display = 'flex';
            }
            
            const response = await fetch('/api/frames');
            const frames = await response.json();
            
            const frameOptions = document.querySelector('.frame-options');
            
            // Clear existing frames
            frameOptions.innerHTML = '';
            
            // Add custom frames
            if (frames.length > 0) {
                // Add section header for custom frames
                const customHeader = document.createElement('div');
                customHeader.className = 'frame-section-header';
                frameOptions.appendChild(customHeader);
                
                frames.forEach(frame => {
                    const frameOption = this.createFrameOption(frame, true);
                    frameOptions.appendChild(frameOption);
                });
                
                // Add start photo session button
                const startButton = document.createElement('div');
                startButton.className = 'start-photo-session';
                startButton.innerHTML = `
                    <button id="startPhotoSession" class="btn btn-primary btn-large">
                        <span class="btn-icon">📸</span>
                        Start Photo Session
                    </button>
                    <p class="start-instruction">Select a frame above, then click to start taking photos</p>
                `;
                frameOptions.appendChild(startButton);
                
                // Add event listener to start button
                setTimeout(() => {
                    const startBtn = document.getElementById('startPhotoSession');
                    if (startBtn) {
                        startBtn.addEventListener('click', () => this.startPhotoSession());
                    }
                }, 100);
                
            } else {
                // Show message if no frames available
                frameOptions.innerHTML = `
                    <div class="no-frames-message">
                        <p>No frames available. Please upload frames in the System page.</p>
                        <a href="/system#frame-management" class="btn btn-outline">Upload Frames</a>
                    </div>
                `;
            }
            
            if (this.frameLoading) {
                this.frameLoading.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Failed to load frames:', error);
            if (this.frameLoading) {
                this.frameLoading.innerHTML = '<span>Error loading frames</span>';
            }
        }
    }

    createFrameOption(frame, isCustom = false) {
        const frameOption = document.createElement('div');
        frameOption.className = 'frame-option';
        frameOption.setAttribute('data-frame', frame.id);
        frameOption.setAttribute('data-type', frame.type || 'custom');
        
        // Format dimensions for display
        const dimensions = frame.width && frame.height ? 
            `${frame.width}×${frame.height}` : 'Unknown size';
        
        frameOption.innerHTML = `
            <div class="frame-preview">
                <img src="${frame.url}" alt="${frame.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
            </div>
            <span class="frame-label">${frame.name}</span>
            <span class="frame-dimensions">${dimensions}</span>
            <span class="frame-type">Custom</span>
        `;
        
        // Add click event
        frameOption.addEventListener('click', () => this.selectFrame(frame.id));
        
        return frameOption;
    }

    async deleteCustomFrame(frameId, frameName) {
        if (!confirm(`Are you sure you want to delete the custom frame "${frameName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/frames/custom/${frameId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(`Custom frame "${frameName}" deleted successfully`);
                await this.loadFrames(); // Reload frames
            } else {
                this.showError('Failed to delete custom frame: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to delete custom frame:', error);
            this.showError('Failed to delete custom frame: ' + error.message);
        }
    }

    async startCamera() {
        try {
            console.log('startCamera() called');
            this.showLoading('Starting camera...');
            
            // Check if we're on mobile and need HTTPS
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile && location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                throw new Error('Camera access requires HTTPS on mobile devices. Please access this app via HTTPS.');
            }
            
            // Detect available cameras first
            await this.detectAvailableCameras();
            
            console.log('Checking getUserMedia support...');
            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                // Fallback for older browsers
                const getUserMedia = navigator.getUserMedia || 
                                   navigator.webkitGetUserMedia || 
                                   navigator.mozGetUserMedia || 
                                   navigator.msGetUserMedia;
                
                if (!getUserMedia) {
                    throw new Error('Camera access not supported in this browser. Please use a modern browser with HTTPS.');
                }
                
                console.log('Using legacy getUserMedia API');
                // Use legacy API
                this.stream = await new Promise((resolve, reject) => {
                    getUserMedia.call(navigator, 
                        { video: { width: 1280, height: 720, facingMode: this.facingMode } },
                        resolve,
                        reject
                    );
                });
            } else {
                console.log('Using modern getUserMedia API');
                // Use modern API
                this.stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: this.facingMode
                    }
                });
            }
            
            console.log('Camera stream obtained, setting video source...');
            // Set video source
            this.video.srcObject = this.stream;
            
            // Wait for video to load
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });
            
            console.log('Video metadata loaded, adjusting canvas...');
            // Set canvas size to match video (or frame dimensions if available)
            if (this.selectedFrame) {
                // Canvas size will be set by adjustCameraToFrame
                await this.adjustCameraToFrame(this.selectedFrame);
            } else {
                // Use video dimensions as fallback
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            }
            
            console.log('Updating UI...');
            // Update UI
            this.startCameraBtn.style.display = 'none';
            this.takePhotoBtn.style.display = 'inline-block';
            this.takePhotoBtn.disabled = false;
            
            // Show switch camera button if multiple cameras are available or on mobile devices
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (this.availableCameras.length > 1 || isMobileDevice) {
                console.log('Showing switch camera button. Available cameras:', this.availableCameras);
                this.switchCameraBtn.style.display = 'inline-block';
            } else {
                console.log('Hiding switch camera button. Available cameras:', this.availableCameras);
                this.switchCameraBtn.style.display = 'none';
            }
            
            this.hideLoading();
            
            // Apply selected filter to video
            this.applyFilterToVideo();
            
            console.log('Camera started successfully');
            
        } catch (error) {
            console.error('Camera start error:', error);
            this.hideLoading();
            
            // Provide more helpful error messages for mobile
            let errorMessage = 'Failed to start camera: ' + error.message;
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please check if your device has a camera.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Camera not supported. Please use HTTPS for camera access on mobile devices.';
            } else if (error.message.includes('getUserMedia')) {
                errorMessage = 'Camera access not supported. Please use a modern browser with HTTPS.';
            } else if (error.message.includes('HTTPS')) {
                errorMessage = 'Camera access requires HTTPS on mobile devices. Please access this app via HTTPS.';
            }
            
            this.showError(errorMessage);
            console.error('Camera error:', error);
        }
    }

    async detectAvailableCameras() {
        try {
            // Check if we're on a mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                // On mobile devices, assume both front and back cameras are available
                this.availableCameras = ['user', 'environment'];
                console.log('Mobile device detected, assuming front and back cameras available');
            } else {
                // On desktop, assume only front camera
                this.availableCameras = ['user'];
                console.log('Desktop device detected, assuming single camera');
            }
            
        } catch (error) {
            console.error('Error in camera detection:', error);
            // Fallback: assume multiple cameras on mobile devices
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
                this.availableCameras = ['user', 'environment'];
            } else {
                this.availableCameras = ['user'];
            }
        }
    }

    async switchCamera() {
        if (this.availableCameras.length < 2) {
            console.log('Available cameras:', this.availableCameras);
            this.showError('Only one camera available on this device');
            return;
        }
        
        try {
            console.log('Switching camera...');
            this.showLoading('Switching camera...');
            
            // Stop current stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            // Toggle facing mode
            this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
            console.log('Switched facing mode to:', this.facingMode);
            
            // Start new camera stream with updated facing mode
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: this.facingMode
                }
            });
            
            // Set video source
            this.video.srcObject = this.stream;
            
            // Wait for video to load
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });
            
            // Adjust canvas if frame is selected
            if (this.selectedFrame) {
                await this.adjustCameraToFrame(this.selectedFrame);
            } else {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            }
            
            // Apply selected filter
            this.applyFilterToVideo();
            
            this.hideLoading();
            const cameraName = this.facingMode === 'user' ? 'front' : 'back';
            this.showSuccess(`Switched to ${cameraName} camera`);
            
        } catch (error) {
            console.error('Error switching camera:', error);
            this.hideLoading();
            
            // Provide helpful error messages
            let errorMessage = 'Failed to switch camera: ' + error.message;
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Camera not found. This device might only have one camera.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Camera switching not supported on this device.';
            }
            
            this.showError(errorMessage);
            
            // Try to restart with original facing mode
            this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
            console.log('Reverting to original facing mode:', this.facingMode);
            await this.startCamera();
        }
    }

    takePhoto() {
        if (!this.stream) {
            this.showError('Camera not started');
            return;
        }

        try {
            // Temporarily remove CSS filter from video to capture clean image
            const originalFilter = this.video.style.filter;
            this.video.style.filter = 'none';
            
            // Use the stored canvas context
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Restore the CSS filter for video preview
            this.video.style.filter = originalFilter;
            
            // Save the original photo without any filters
            this.originalImage = this.canvas.toDataURL('image/jpeg', 0.9);
            
            // Apply filter to the captured image if a filter is selected
            if (this.selectedFilter && this.selectedFilter !== 'none') {
                console.log('Selected filter for photo capture:', this.selectedFilter);
                this.capturedImage = this.applyFilterToCanvas(this.canvas, this.selectedFilter);
            } else {
                console.log('No filter selected, capturing normal photo');
                // Use the original image as the captured image
                this.capturedImage = this.originalImage;
            }
            
            // Show preview
            if (this.photoPreview) {
                this.photoPreview.src = this.capturedImage;
            }
            
            // Show preview and print sections
            this.showPreviewAndPrintSections();
            
            // Show retake button and hide take photo button
            if (this.takePhotoAgainBtn) {
                this.takePhotoAgainBtn.style.display = 'inline-block';
            }
            if (this.takePhotoBtn) {
                this.takePhotoBtn.style.display = 'none';
            }
            
            this.showSuccess('Photo captured!');
            
        } catch (error) {
            this.showError('Failed to take photo: ' + error.message);
        }
    }

    applyFilterToCanvas(canvas, filterType) {
        console.log('Applying filter to canvas:', filterType);
        
        // Create a temporary canvas for applying filters
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // Draw the original image
        tempCtx.drawImage(canvas, 0, 0);
        
        // Get image data for pixel manipulation
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        // Apply filter based on type
        switch (filterType) {
            case 'blackwhite':
                console.log('Applying black & white filter');
                this.applyBlackWhiteFilter(data);
                break;
            case 'sepia':
                console.log('Applying sepia filter');
                this.applySepiaFilter(data);
                break;
            case 'oldcamera':
                console.log('Applying old camera filter');
                this.applyOldCameraFilter(data);
                break;
            default:
                console.log('No filter applied or unknown filter type:', filterType);
        }
        
        // Put the filtered image data back
        tempCtx.putImageData(imageData, 0, 0);
        
        // Return the filtered image as data URL
        return tempCanvas.toDataURL('image/jpeg', 0.9);
    }

    applyBlackWhiteFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;     // Red
            data[i + 1] = gray; // Green
            data[i + 2] = gray; // Blue
        }
    }

    applySepiaFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));     // Red
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // Green
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // Blue
        }
    }

    applyOldCameraFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale first (80% grayscale to match CSS)
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            
            // Apply sepia tone (30% sepia to match CSS)
            const sepiaR = gray * 0.393 + gray * 0.769 + gray * 0.189;
            const sepiaG = gray * 0.349 + gray * 0.686 + gray * 0.168;
            const sepiaB = gray * 0.272 + gray * 0.534 + gray * 0.131;
            
            // Blend with original (30% sepia, 70% grayscale)
            data[i] = Math.min(255, sepiaR * 0.3 + gray * 0.7);     // Red
            data[i + 1] = Math.min(255, sepiaG * 0.3 + gray * 0.7); // Green
            data[i + 2] = Math.min(255, sepiaB * 0.3 + gray * 0.7); // Blue
            
            // Add contrast (120% to match CSS)
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.2 + 128));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.2 + 128));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.2 + 128));
            
            // Reduce brightness (90% to match CSS)
            data[i] = data[i] * 0.9;
            data[i + 1] = data[i + 1] * 0.9;
            data[i + 2] = data[i + 2] * 0.9;
        }
    }

    async takePhotoAgain() {
        // Reset to camera view
        this.showSection('camera-section');
        this.hideSection('preview-section');
        this.hideSection('print-section');
        
        // Clear captured image but keep the selected frame
        this.capturedImage = null;
        this.originalImage = null;
        
        // Adjust camera canvas to frame dimensions if frame is selected
        if (this.selectedFrame) {
            await this.adjustCameraToFrame(this.selectedFrame);
        } else {
            // Fallback to video dimensions
            if (this.video.videoWidth && this.video.videoHeight) {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            }
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Show take photo button and hide other buttons
        if (this.takePhotoBtn) {
            this.takePhotoBtn.style.display = 'none';
        }
        if (this.startCameraBtn) {
            this.startCameraBtn.style.display = 'none';
        }
        if (this.takePhotoAgainBtn) {
            this.takePhotoAgainBtn.style.display = 'none';
        }
        
        // Show switch camera button if multiple cameras are available
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.availableCameras.length > 1 || isMobileDevice) {
            this.switchCameraBtn.style.display = 'inline-block';
        }
        
        // Apply selected filter to video if camera is running
        if (this.stream && this.video) {
            this.applyFilterToVideo();
        }

        this.takePhoto();
    }

    selectFrame(frameId) {
        // Remove active class from all frame options
        document.querySelectorAll('.frame-option').forEach(option => {
            option.classList.remove('active');
        });
        
        // Add active class to selected frame
        const selectedOption = document.querySelector(`[data-frame="${frameId}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }
        
        this.selectedFrame = frameId;
        console.log('Selected frame:', frameId);
        
        // Show frame placement information for selected frame
        if (frameId) {
            this.showFramePlacementInfo(frameId);
            // Adjust camera to frame dimensions (but don't show camera section yet)
            this.adjustCameraToFrame(frameId);
        } else {
            this.hideFramePlacementInfo();
        }
    }

    selectFilter(filterType) {
        console.log('selectFilter called with:', filterType);
        
        // Remove active class from all filter buttons
        this.filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Add active class to selected filter button
        const selectedButton = document.querySelector(`[data-filter="${filterType}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        
        this.selectedFilter = filterType;
        console.log('Selected filter stored as:', this.selectedFilter);
        
        // Apply filter to video if camera is running
        if (this.stream && this.video) {
            this.applyFilterToVideo();
        }
    }

    applyFilterToVideo() {
        if (!this.video || !this.stream) return;
        
        // Set up filter canvas
        this.filterCanvas.width = this.video.videoWidth || 640;
        this.filterCanvas.height = this.video.videoHeight || 480;
        
        // Apply filter using CSS filters
        this.video.style.filter = this.getFilterCSS(this.selectedFilter);
    }

    getFilterCSS(filterType) {
        switch (filterType) {
            case 'blackwhite':
                return 'grayscale(100%)';
            case 'sepia':
                return 'sepia(100%)';
            case 'oldcamera':
                return 'grayscale(80%) sepia(30%) contrast(120%) brightness(90%)';
            case 'none':
            default:
                return 'none';
        }
    }

    async showFramePlacementInfo(frameId) {
        try {
            const response = await fetch(`/api/frames/${frameId}/placement`);
            const placement = await response.json();
            
            // Create or update placement info display
            let placementInfo = document.getElementById('framePlacementInfo');
            if (!placementInfo) {
                placementInfo = document.createElement('div');
                placementInfo.id = 'framePlacementInfo';
                placementInfo.className = 'frame-placement-info';
                
                // Insert after frame section header
                const frameSection = document.querySelector('.frame-section');
                const sectionHeader = frameSection.querySelector('.section-header');
                sectionHeader.appendChild(placementInfo);
            }
            
            placementInfo.innerHTML = `
                <div class="placement-details">
                    <span class="placement-icon">🎯</span>
                    <div class="placement-text">
                        <strong>Photo Placement:</strong> ${placement.width}×${placement.height} pixels at position (${placement.left}, ${placement.top})
                    </div>
                </div>
            `;
            placementInfo.style.display = 'block';
            
        } catch (error) {
            console.error('Failed to get frame placement info:', error);
        }
    }

    hideFramePlacementInfo() {
        const placementInfo = document.getElementById('framePlacementInfo');
        if (placementInfo) {
            placementInfo.style.display = 'none';
        }
    }

    showCameraSection() {
        this.hideSection('frame-section');
        this.showSection('camera-section');
        
        // Check if we have a captured image (returning from preview)
        if (this.capturedImage) {
            // Show take photo again button
            if (this.takePhotoAgainBtn) {
                this.takePhotoAgainBtn.style.display = 'inline-block';
            }
            if (this.takePhotoBtn) {
                this.takePhotoBtn.style.display = 'none';
            }
            if (this.startCameraBtn) {
                this.startCameraBtn.style.display = 'none';
            }
        } else {
            // Show start camera button
            if (this.startCameraBtn) {
                this.startCameraBtn.style.display = 'inline-block';
            }
            if (this.takePhotoBtn) {
                this.takePhotoBtn.style.display = 'none';
            }
            if (this.takePhotoAgainBtn) {
                this.takePhotoAgainBtn.style.display = 'none';
            }
            
            // Auto-start camera when entering camera section for the first time
            if (this.selectedFrame) {
                console.log('Auto-starting camera for frame:', this.selectedFrame);
                // Small delay to ensure section is visible before starting camera
                setTimeout(() => {
                    console.log('Starting camera after delay...');
                    this.autoStartCamera();
                }, 200); // Increased delay to ensure section is fully visible
            } else {
                console.warn('No frame selected, cannot auto-start camera');
            }
        }
    }

    async autoStartCamera() {
        try {
            // Check if video element is ready
            if (!this.video) {
                console.error('Video element not found');
                return;
            }

            // Check if camera is already running
            if (this.stream) {
                console.log('Camera already running');
                return;
            }

            // Check if camera section is visible
            const cameraSection = document.querySelector('.camera-section');
            if (!cameraSection || cameraSection.style.display === 'none') {
                console.error('Camera section not visible');
                return;
            }

            console.log('Auto-starting camera...');
            await this.startCamera();
            
        } catch (error) {
            console.error('Failed to auto-start camera:', error);
            
            // Retry once after a longer delay
            setTimeout(async () => {
                try {
                    console.log('Retrying camera start...');
                    await this.startCamera();
                } catch (retryError) {
                    console.error('Camera retry failed:', retryError);
                    // Show error but don't block the UI
                    this.showError('Failed to start camera automatically: ' + retryError.message);
                    
                    // Show the start camera button as fallback
                    if (this.startCameraBtn) {
                        this.startCameraBtn.style.display = 'inline-block';
                    }
                }
            }, 1000);
        }
    }

    showPreviewSection() {
        this.showSection('preview-section');
    }

    showPrintSection() {
        this.showSection('print-section');
    }

    hideCameraSection() {
        if (this.cameraSection) {
            this.cameraSection.style.display = 'none';
        }
    }

    async adjustCameraToFrame(frameId) {
        try {
            // Get frame placement information
            const response = await fetch(`/api/frames/${frameId}/placement`);
            const placement = await response.json();
            
            if (placement.error) {
                throw new Error(placement.error);
            }
            
            // Adjust camera canvas size to match frame photo area
            if (this.canvas) {
                this.canvas.width = placement.width;
                this.canvas.height = placement.height;
            }
            
            // Adjust camera container aspect ratio to match frame photo area
            const cameraContainer = document.querySelector('.camera-container');
            if (cameraContainer) {
                const aspectRatio = placement.width / placement.height;
                cameraContainer.style.aspectRatio = aspectRatio;
                
                // Set max dimensions to ensure it fits well on screen
                const maxWidth = Math.min(placement.width, 800);
                const maxHeight = Math.min(placement.height, 600);
                const scale = Math.min(maxWidth / placement.width, maxHeight / placement.height);
                
                cameraContainer.style.maxWidth = `${placement.width * scale}px`;
                cameraContainer.style.maxHeight = `${placement.height * scale}px`;
                
                console.log(`Camera container adjusted to: ${placement.width * scale}x${placement.height * scale}px (aspect ratio: ${aspectRatio.toFixed(2)})`);
            }
            
            console.log(`Camera adjusted to frame photo area: ${placement.width}x${placement.height} (aspect ratio: ${(placement.width / placement.height).toFixed(2)})`);
            
        } catch (error) {
            console.error('Failed to adjust camera to frame:', error);
            // Use default camera size if frame adjustment fails
            if (this.canvas && this.video) {
                this.canvas.width = this.video.videoWidth || 1280;
                this.canvas.height = this.video.videoHeight || 720;
            }
        }
    }

    resetFrameSelection() {
        // Reset to first available frame
        const firstFrame = document.querySelector('.frame-option');
        if (firstFrame) {
            const frameId = firstFrame.getAttribute('data-frame');
            this.selectFrame(frameId);
        } else {
            this.selectedFrame = null;
            this.hideCameraSection();
        }
    }

    selectPrinter(printerName) {
        this.selectedPrinter = printerName;
        console.log('Selected printer:', printerName);
    }

    async printPhoto() {
        if (!this.capturedImage) {
            this.showError('No photo to print');
            return;
        }

        if (!this.selectedFrame) {
            this.showError('Please select a frame before printing');
            return;
        }

        try {
            this.showLoading('Printing photo...');
            this.printBtn.disabled = true;
            
            // Prepare data for printing
            const printData = {
                image: this.capturedImage,
                frame_id: this.selectedFrame
            };
            
            // Send to server
            const response = await fetch('/api/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(printData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(result.message);
                // Keep both preview and print sections visible
                this.showPreviewAndPrintSections();
                // Refresh print queue
                await this.loadPrintQueue();
            } else {
                this.showError(result.error || 'Printing failed');
            }
            
        } catch (error) {
            this.showError('Printing failed: ' + error.message);
            console.error('Print error:', error);
        } finally {
            this.hideLoading();
            this.printBtn.disabled = false;
        }
    }

    async processOnly() {
        if (!this.capturedImage) {
            this.showError('No photo to process');
            return;
        }

        if (!this.selectedFrame) {
            this.showError('Please select a frame before processing');
            return;
        }

        try {
            this.showLoading('Processing photo...');
            this.processOnlyBtn.disabled = true;
            
            // Prepare data for processing
            const processData = {
                image: this.capturedImage,
                frame_id: this.selectedFrame
            };
            
            // Send to server
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(processData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(result.message);
                // Keep both preview and print sections visible
                this.showPreviewAndPrintSections();
            } else {
                this.showError(result.error || 'Processing failed');
            }
            
        } catch (error) {
            this.showError('Processing failed: ' + error.message);
            console.error('Process error:', error);
        } finally {
            this.hideLoading();
            this.processOnlyBtn.disabled = false;
        }
    }

    downloadPhoto() {
        if (!this.capturedImage) {
            this.showError('No photo to download');
            return;
        }

        if (!this.selectedFrame) {
            this.showError('Please select a frame before downloading');
            return;
        }

        try {
            // Create download link
            const link = document.createElement('a');
            link.download = `vienna-photo-${new Date().toISOString().slice(0, -5)}.jpg`;
            link.href = this.capturedImage;
            link.click();
            
            this.showSuccess('Photo downloaded successfully');
        } catch (error) {
            this.showError('Download failed: ' + error.message);
        }
    }

    downloadOriginalPhoto() {
        if (!this.originalImage) {
            this.showError('No original photo to download');
            return;
        }

        try {
            // Create download link
            const link = document.createElement('a');
            link.download = `vienna-photo-original-${new Date().toISOString().slice(0, -5)}.jpg`;
            link.href = this.originalImage;
            link.click();
            
            this.showSuccess('Original photo downloaded successfully');
        } catch (error) {
            this.showError('Download failed: ' + error.message);
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

    startMonitoring() {
        // Monitor server health every 30 seconds
        setInterval(() => {
            this.checkServerHealth().catch(console.error);
        }, 30000);
        
        // Monitor print queue every 10 seconds
        setInterval(() => {
            this.loadPrintQueue().catch(console.error);
        }, 10000);
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

    updatePrinterStatus(status, text) {
        if (!this.printerStatusIndicator) return;
        
        const dot = this.printerStatusIndicator.querySelector('.status-dot');
        const textElement = this.printerStatusIndicator.querySelector('.status-text');
        
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
        // Show in preview section if available
        if (this.previewStatus) {
            this.previewStatus.textContent = message;
            this.previewStatus.className = 'preview-status success';
            setTimeout(() => {
                if (this.previewStatus) {
                    this.previewStatus.textContent = '';
                    this.previewStatus.className = 'preview-status';
                }
            }, 5000);
        } else if (this.printStatus) {
            // Fallback to print section if preview status not available
            this.printStatus.textContent = message;
            this.printStatus.className = 'status-message success';
            setTimeout(() => {
                if (this.printStatus) {
                    this.printStatus.textContent = '';
                    this.printStatus.className = 'status-message';
                }
            }, 5000);
        }
    }

    showError(message) {
        if (this.errorMessage && this.errorModal) {
            this.errorMessage.textContent = message;
            this.errorModal.style.display = 'flex';
        } else {
            // Fallback to console and alert if modal elements are not available
            console.error('Error:', message);
            alert('Error: ' + message);
        }
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

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }

    showSection(sectionName) {
        // Hide all sections first
        const sections = ['frame-section', 'camera-section', 'preview-section', 'print-section'];
        sections.forEach(section => {
            const element = document.querySelector(`.${section}`);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Show the requested section
        const targetSection = document.querySelector(`.${sectionName}`);
        if (targetSection) {
            targetSection.style.display = 'block';
        } else {
            console.warn(`Section ${sectionName} not found`);
        }
    }

    hideSection(sectionName) {
        const targetSection = document.querySelector(`.${sectionName}`);
        if (targetSection) {
            targetSection.style.display = 'none';
        } else {
            console.warn(`Section ${sectionName} not found`);
        }
    }

    showPreviewAndPrintSections() {
        // Hide frame and camera sections
        const frameSection = document.querySelector('.frame-section');
        const cameraSection = document.querySelector('.camera-section');
        if (frameSection) frameSection.style.display = 'none';
        if (cameraSection) cameraSection.style.display = 'none';
        
        // Show preview and print sections
        const previewSection = document.querySelector('.preview-section');
        const printSection = document.querySelector('.print-section');
        if (previewSection) previewSection.style.display = 'block';
        if (printSection) printSection.style.display = 'block';
    }

    showFrameSection() {
        this.showSection('frame-section');
        // Reset camera UI when going back to frame selection
        if (this.startCameraBtn) {
            this.startCameraBtn.style.display = 'inline-block';
        }
        if (this.takePhotoBtn) {
            this.takePhotoBtn.disabled = true;
        }
        // Stop camera stream if running
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    showPreviewSection() {
        this.showSection('preview-section');
    }

    showPrintSection() {
        this.showSection('print-section');
    }

    startPhotoSession() {
        if (!this.selectedFrame) {
            this.showError('Please select a frame before starting the photo session');
            return;
        }
        
        // Show camera section
        this.showCameraSection();
    }

    resetCamera() {
        // Clear only the captured image, keep the selected frame
        this.capturedImage = null;
        
        // Reset canvas dimensions to match video
        if (this.video.videoWidth && this.video.videoHeight) {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize the photo booth when the page loads
let photoBooth;

document.addEventListener('DOMContentLoaded', () => {
    photoBooth = new PhotoBooth();
});

// Cleanup when the page is unloaded
window.addEventListener('beforeunload', () => {
    if (photoBooth) {
        photoBooth.cleanup();
    }
}); 