// Unified window management system
export class WindowManager {
    // Static counter for z-index management
    static zIndexCounter = 100;
    
    constructor(id, options = {}) {
        this.id = id;
        this.options = Object.assign({
            title: '',
            initialWidth: 'auto',
            initialHeight: 'auto',
            minimized: false,
            onMinimize: () => {},
            onMaximize: () => {},
            onRestore: () => {}
        }, options);
        
        // Create element references
        this.element = document.getElementById(id);
        this.header = this.element ? this.element.querySelector('.window-header') : null;
        this.title = this.element ? this.element.querySelector('.window-title') : null;
        this.resizeHandle = this.element ? this.element.querySelector('.resize-handle') : null;
        this.dockIcon = document.getElementById(`${id}-dock-icon`);
        
        // Store callbacks for showing the window
        this.onShowCallbacks = [];
        
        // Store original state for restoring from fullscreen
        this.originalState = {
            width: this.options.initialWidth,
            height: this.options.initialHeight,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        };
        
        // Register this window manager in the global registry for emergency-fix.js to access
        if (!window.windowManagers) {
            window.windowManagers = {};
        }
        window.windowManagers[id] = this;
        
        // Initialize if element exists
        if (this.element) {
            this.initialize();
        } else {
            console.error(`Window element with ID ${id} not found`);
        }
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
        
        // Remove any existing event listeners by cloning the header
        const newHeader = this.header.cloneNode(true);
        this.header.parentNode.replaceChild(newHeader, this.header);
        this.header = newHeader;
        
        // Set visual cues and ensure proper interaction
        this.header.style.cursor = 'grab';
        this.header.style.pointerEvents = 'auto';
        
        let isDragging = false;
        let offsetX, offsetY;
        
        // Rebind controls if they exist in the header
        this.controlsContainer = this.header.querySelector('.window-controls');
        if (this.controlsContainer) {
            this.setupControls();
        }
        
        this.header.addEventListener('mousedown', (e) => {
            // Don't drag if clicking controls or inputs
            if (e.target.classList.contains('control') || 
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'BUTTON') {
                return;
            }
            
            // Prevent default browser behavior
            e.preventDefault();
            
            // Ensure we're focused when beginning a drag operation
            this.bringToFront();
            
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
            
            console.log(`[${this.id}] Drag started`);
        });
        
        // Use document for mouse move/up to catch events outside the header
        const mouseMoveHandler = (e) => {
            if (!isDragging) return;
            
            // Prevent default browser behavior during drag
            e.preventDefault();
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            // Apply boundaries to keep window within viewport
            const windowWidth = this.element.offsetWidth;
            const windowHeight = this.element.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Ensure at least part of the window is always visible and draggable
            // (at least 100px of the window must remain in viewport)
            const boundedX = Math.min(Math.max(x, -windowWidth + 100), viewportWidth - 100);
            const boundedY = Math.min(Math.max(y, 0), viewportHeight - 50);
            
            this.element.style.left = `${boundedX}px`;
            this.element.style.top = `${boundedY}px`;
        };
        
        const mouseUpHandler = () => {
            if (isDragging) {
                isDragging = false;
                console.log(`[${this.id}] Drag ended`);
                
                // Remove the dragged class
                this.element.classList.remove('dragged');
                
                // Save current position in the originalState to enable returning to this position
                if (!this.element.classList.contains('fullscreen')) {
                    this.originalState.position = 'absolute';
                    this.originalState.top = this.element.style.top;
                    this.originalState.left = this.element.style.left;
                    this.originalState.transform = 'none';
                }
            }
        };
        
        // Add the event listeners to document to ensure they work when mouse moves outside the header
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        
        // Store reference to these handlers for potential cleanup
        this._dragHandlers = {
            mousemove: mouseMoveHandler,
            mouseup: mouseUpHandler
        };
    }
    
    setupResizing() {
        if (!this.resizeHandle) return;
        
        // Remove any existing event listeners by cloning the resize handle
        const newResizeHandle = this.resizeHandle.cloneNode(true);
        this.resizeHandle.parentNode.replaceChild(newResizeHandle, this.resizeHandle);
        this.resizeHandle = newResizeHandle;
        
        // Ensure proper interaction capabilities
        this.resizeHandle.style.cursor = 'nwse-resize';
        this.resizeHandle.style.pointerEvents = 'auto';
        this.resizeHandle.style.zIndex = '10';
        
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
        
        const mouseMoveHandler = (e) => {
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
        };
        
        const mouseUpHandler = () => {
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
        };
        
        // Add the event listeners to document to ensure they work when mouse moves outside the resize handle
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        
        // Store reference to these handlers for potential cleanup
        this._resizeHandlers = {
            mousemove: mouseMoveHandler,
            mouseup: mouseUpHandler
        };
    }
    
    setupDockIcon() {
        if (!this.dockIcon) return;
        
        // Remove any existing listeners by cloning the dock icon
        const newDockIcon = this.dockIcon.cloneNode(true);
        this.dockIcon.parentNode.replaceChild(newDockIcon, this.dockIcon);
        this.dockIcon = newDockIcon;
        
        // Apply high-priority styles to ensure clickability
        this.dockIcon.style.pointerEvents = 'auto';
        this.dockIcon.style.cursor = 'pointer';
        this.dockIcon.style.position = 'relative';
        this.dockIcon.style.zIndex = '9999'; // Ensure dock icons are always clickable
        
        // Make images inside non-interactive to prevent event capture issues
        const img = this.dockIcon.querySelector('img');
        if (img) {
            img.style.pointerEvents = 'none';
        }
        
        // Add a robust click handler
        this.dockIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event propagation
            e.preventDefault(); // Prevent default action
            console.log(`[${this.id}] Dock icon clicked`);
            
            // Show the window
            this.show(); // Use the show method which already handles focus
            
            // Remove active class from all dock icons and add to this one
            document.querySelectorAll('.dock-item').forEach(icon => {
                icon.classList.remove('active');
            });
            this.dockIcon.classList.add('active');
            
            // Add focused class to window
            this.element.classList.add('window-focused');
            
            return false; // Ensure no further processing
        });
        
        // Add visual feedback for interaction
        this.dockIcon.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            this.style.transform = 'scale(0.95)';
        });
        
        this.dockIcon.addEventListener('mouseup', function(e) {
            e.stopPropagation();
            this.style.transform = 'scale(1)';
        });
        
        this.dockIcon.addEventListener('mouseleave', function(e) {
            e.stopPropagation();
            this.style.transform = 'scale(1)';
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
        
        // Update the active window state in menu-bar.js if available
        if (typeof setActiveWindow === 'function') {
            try {
                setActiveWindow(this.id);
            } catch (e) {
                console.error(`Error calling setActiveWindow: ${e}`);
            }
        }
        
        // Call show callbacks
        this.onShowCallbacks.forEach(callback => callback());
    }
    
    /**
     * Add a callback function to be called when the window is shown
     * @param {Function} callback - The function to call
     */
    addOnShowCallback(callback) {
        if (typeof callback === 'function') {
            this.onShowCallbacks.push(callback);
        }
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
            this.element.style.top = '24px'; // Account for menu bar height
            this.element.style.left = '0';
            this.element.style.width = '100%';
            this.element.style.height = 'calc(100vh - 24px)'; // Account for menu bar height
            this.element.style.transform = 'none';
            this.element.style.zIndex = '1000'; // Ensure it's above other elements but respects menu bar positioning
            
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
        // First, lower z-index of all windows
        document.querySelectorAll('.window-container').forEach(win => {
            // Only adjust windows that aren't this one
            if (win.id !== this.id) {
                win.style.zIndex = '100';
                win.classList.remove('window-focused');
                
                // Also update dock icon active states
                const dockIconId = `${win.id}-dock-icon`;
                const dockIcon = document.getElementById(dockIconId);
                if (dockIcon) {
                    dockIcon.classList.remove('active');
                }
            }
        });
        
        // Increment the counter and set the z-index for this window
        WindowManager.zIndexCounter += 10;
        const newZIndex = WindowManager.zIndexCounter;
        
        // Set a high value to ensure it's above all other windows
        this.element.style.zIndex = newZIndex.toString();
        this.element.classList.add('window-focused');
        
        // Add active class to corresponding dock icon
        if (this.dockIcon) {
            this.dockIcon.classList.add('active');
        }
        
        console.log(`[${this.id}] Brought to front with z-index: ${newZIndex}`);
    }
}

// Create a factory function for easy window creation
export function createWindowManager(id, options = {}) {
    return new WindowManager(id, options);
} 