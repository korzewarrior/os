// Unified window management system
export class WindowManager {
    // Static counter for z-index management
    static zIndexCounter = 100;
    
    constructor(id, options = {}) {
        this.id = id;
        this.element = document.getElementById(id);
        this.options = {
            title: options.title || id.charAt(0).toUpperCase() + id.slice(1),
            initialWidth: options.initialWidth || '800px',
            initialHeight: options.initialHeight || '600px',
            minimized: options.minimized !== false,
            onMinimize: options.onMinimize || (() => {}),
            onMaximize: options.onMaximize || (() => {}),
            onRestore: options.onRestore || (() => {})
        };
        
        // Store original dimensions and position for proper restoration
        this.originalState = {
            width: this.options.initialWidth,
            height: this.options.initialHeight,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100
        };
        
        if (!this.element) {
            console.error(`[${id}] Element with ID "${id}" not found`);
            return;
        }
        
        this.headerSelector = `.${id}-header`;
        this.header = this.element.querySelector(this.headerSelector) || 
                      this.element.querySelector('.window-header');
        
        this.controlsContainer = this.element.querySelector('.window-controls');
        this.dockIcon = document.getElementById(`${id}-dock-icon`);
        this.resizeHandle = this.element.querySelector('.resize-handle');
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Set initial dimensions if not already set
        if (!this.element.style.width) this.element.style.width = this.options.initialWidth;
        if (!this.element.style.height) this.element.style.height = this.options.initialHeight;
        
        // Setup key components
        this.setupControls();
        this.setupDragging();
        this.setupResizing();
        this.setupDockIcon();
        this.setupWindowFocus();
        
        // Apply initial state
        if (this.options.minimized) {
            this.minimize();
        }
        
        console.log(`[${this.id}] Window initialized`);
    }
    
    setupControls() {
        if (!this.controlsContainer) return;
        
        // Remove any existing listeners by cloning controls
        const parent = this.controlsContainer.parentNode;
        const newControls = this.controlsContainer.cloneNode(true);
        parent.replaceChild(newControls, this.controlsContainer);
        this.controlsContainer = newControls;
        
        // Get control buttons
        const redControl = this.controlsContainer.querySelector('.red');
        const yellowControl = this.controlsContainer.querySelector('.yellow');
        const greenControl = this.controlsContainer.querySelector('.green');
        
        // Set up control event handlers
        if (redControl) {
            redControl.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.minimize();
            });
        }
        
        if (yellowControl) {
            yellowControl.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.minimize();
            });
        }
        
        if (greenControl) {
            greenControl.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.toggleFullscreen();
            });
        }
    }
    
    setupDragging() {
        if (!this.header) return;
        
        let isDragging = false;
        let offsetX, offsetY;
        
        this.header.addEventListener('mousedown', (e) => {
            // Don't drag if clicking controls or inputs
            if (e.target.classList.contains('control') || 
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'BUTTON') {
                return;
            }
            
            isDragging = true;
            
            // Save current visual position
            const rect = this.element.getBoundingClientRect();
            
            // Calculate proper offset from mouse position
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // Position element explicitly
            this.element.style.left = `${rect.left}px`;
            this.element.style.top = `${rect.top}px`;
            
            // Remove transform to avoid jumping
            this.element.style.transform = 'none';
            this.element.classList.add('dragged');
            
            // Bring to front
            this.bringToFront();
            
            e.preventDefault();
            console.log(`[${this.id}] Drag started`);
        });
        
        // Use document for mouse move/up to catch events outside the header
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            this.element.style.left = `${x}px`;
            this.element.style.top = `${y}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                console.log(`[${this.id}] Drag ended`);
                
                // Save current position in the originalState to enable returning to this position
                if (!this.element.classList.contains('fullscreen')) {
                    this.originalState.position = 'absolute';
                    this.originalState.top = this.element.style.top;
                    this.originalState.left = this.element.style.left;
                    this.originalState.transform = 'none';
                }
            }
        });
    }
    
    setupResizing() {
        if (!this.resizeHandle) return;
        
        let isResizing = false;
        let originalWidth, originalHeight, originalX, originalY;
        
        this.resizeHandle.addEventListener('mousedown', (e) => {
            if (this.element.classList.contains('fullscreen')) return;
            
            isResizing = true;
            
            // Get current position and size before making any changes
            const rect = this.element.getBoundingClientRect();
            
            // Smoothly transition from centered to absolute positioning
            // Set position values first before changing position type or removing transform
            // This prevents the jump that occurs when changing positioning models
            this.element.style.width = `${rect.width}px`;
            this.element.style.height = `${rect.height}px`;
            this.element.style.left = `${rect.left}px`;
            this.element.style.top = `${rect.top}px`;
            
            // Now change the positioning attributes after position is explicitly set
            this.element.style.position = 'absolute';
            this.element.style.transform = 'none';
            
            // Store the original width, height, and mouse position
            originalWidth = rect.width;
            originalHeight = rect.height;
            originalX = e.clientX;
            originalY = e.clientY;
            
            // Bring to front when resizing
            this.bringToFront();
            
            e.preventDefault();
            console.log(`[${this.id}] Resize started`);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const width = originalWidth + (e.clientX - originalX);
            const height = originalHeight + (e.clientY - originalY);
            
            // Apply minimum size constraints
            const minWidth = 400;
            const minHeight = 300;
            
            if (width > minWidth) {
                this.element.style.width = `${width}px`;
                this.originalState.width = `${width}px`;
            }
            
            if (height > minHeight) {
                this.element.style.height = `${height}px`;
                this.originalState.height = `${height}px`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                console.log(`[${this.id}] Resize ended`);
                
                // Update the originalState to reflect new position
                this.originalState.position = 'absolute';
                this.originalState.top = this.element.style.top;
                this.originalState.left = this.element.style.left;
                this.originalState.transform = 'none';
                this.originalState.width = this.element.style.width;
                this.originalState.height = this.element.style.height;
            }
        });
    }
    
    setupDockIcon() {
        if (!this.dockIcon) return;
        
        this.dockIcon.addEventListener('click', () => {
            console.log(`[${this.id}] Dock icon clicked`);
            this.show();
        });
    }
    
    setupWindowFocus() {
        // Add a click handler to the entire window to bring it to front
        this.element.addEventListener('mousedown', (e) => {
            // Only do this if not clicking on controls
            if (!e.target.classList.contains('control')) {
                this.bringToFront();
            }
        });
    }
    
    minimize() {
        this.element.classList.add('minimized');
        
        // Add bounce effect to dock icon
        if (this.dockIcon) {
            this.dockIcon.classList.add('bounce');
            setTimeout(() => this.dockIcon.classList.remove('bounce'), 1000);
        }
        
        console.log(`[${this.id}] Window minimized`);
        
        // Call the onMinimize callback
        this.options.onMinimize();
    }
    
    show() {
        // Remove minimized class
        this.element.classList.remove('minimized');
        
        // Bring to front
        this.bringToFront();
        
        console.log(`[${this.id}] Window shown`);
    }
    
    toggleFullscreen() {
        // Before toggling fullscreen, save current state if not already fullscreen
        if (!this.element.classList.contains('fullscreen')) {
            this.saveCurrentState();
        }
        
        // Toggle fullscreen class
        this.element.classList.toggle('fullscreen');
        
        if (this.element.classList.contains('fullscreen')) {
            // Apply fullscreen styles
            this.element.style.position = 'fixed';
            this.element.style.top = '0';
            this.element.style.left = '0';
            this.element.style.width = '100%';
            this.element.style.height = '100vh';
            this.element.style.transform = 'none';
            this.element.style.zIndex = '1000';
            
            console.log(`[${this.id}] Window maximized`);
            
            // Call the onMaximize callback
            this.options.onMaximize();
        } else {
            // Restore to previous state
            this.restoreOriginalState();
            
            console.log(`[${this.id}] Window restored from fullscreen`);
            
            // Call the onRestore callback
            this.options.onRestore();
        }
    }
    
    saveCurrentState() {
        // Only save if we're not in fullscreen mode
        if (!this.element.classList.contains('fullscreen')) {
            if (this.element.style.width) this.originalState.width = this.element.style.width;
            if (this.element.style.height) this.originalState.height = this.element.style.height;
            
            // Save position properties
            this.originalState.position = this.element.style.position || 'absolute';
            this.originalState.top = this.element.style.top || '50%';
            this.originalState.left = this.element.style.left || '50%';
            this.originalState.transform = this.element.style.transform || 'translate(-50%, -50%)';
        }
    }
    
    restoreOriginalState() {
        // Apply saved state
        this.element.style.position = this.originalState.position;
        this.element.style.top = this.originalState.top;
        this.element.style.left = this.originalState.left;
        this.element.style.transform = this.originalState.transform;
        this.element.style.width = this.originalState.width;
        this.element.style.height = this.originalState.height;
        this.element.style.zIndex = this.originalState.zIndex;
    }
    
    bringToFront() {
        // Increment the counter and set the z-index
        WindowManager.zIndexCounter += 10;
        this.element.style.zIndex = WindowManager.zIndexCounter.toString();
        console.log(`[${this.id}] Brought to front with z-index: ${WindowManager.zIndexCounter}`);
    }
}

// Create a factory function for easy window creation
export function createWindowManager(id, options = {}) {
    return new WindowManager(id, options);
} 