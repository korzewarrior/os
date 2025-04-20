// Unified window management system
import { ProgramManager } from './program.js'; // Import ProgramManager

export class WindowManager {
    // Static counter for z-index management
    static zIndexCounter = 100;
    
    constructor(element, options = {}) {
        this.element = element;
        this.id = element.id; // ID comes from the element
        
        this.options = Object.assign({
            title: '',
            initialWidth: 'auto',
            initialHeight: 'auto',
            minimized: false,
            onFocus: () => {}, 
            onClose: () => {}, 
            onMinimize: () => {},
            onMaximize: () => {},
            onRestore: () => {}
        }, options);
        
        // Create element references
        this.header = this.element.querySelector('.window-header');
        this.title = this.element.querySelector('.window-title');
        this.resizeHandle = this.element.querySelector('.resize-handle');
        this.dockIcon = document.getElementById(`${this.id}-dock-icon`);
        
        // Store callbacks for showing the window
        this.onShowCallbacks = [];
        
        // Store original state for restoring from fullscreen
        this.originalState = {
            width: this.options.initialWidth,
            height: this.options.initialHeight,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: '100'
        };
        
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
        
        console.log(`[WindowManager for ${this.id}] Initialized`);
    }
    
    setupControls() {
        const controlsContainer = this.element.querySelector('.window-controls');
        if (!controlsContainer) return;

        // Use event delegation on the container might be better than cloning
        controlsContainer.addEventListener('click', (e) => {
             e.stopPropagation();
             e.preventDefault();
             if (e.target.classList.contains('red')) {
                 this.close(); // Use the close method which calls the callback
             } else if (e.target.classList.contains('yellow')) {
                 this.minimize();
             } else if (e.target.classList.contains('green')) {
                 this.toggleFullscreen();
             }
        });
    }
    
    setupDragging() {
        if (!this.header) return;
        
        // Make header draggable visual cue
        this.header.style.cursor = 'grab';
        
        let isDragging = false;
        let offsetX, offsetY;
        
        // Define handlers in the scope of setupDragging so they can reference each other
        // and be removed correctly.
        
        const mouseMoveHandler = (e) => {
            if (!isDragging) return;
            
            // Prevent default browser behavior during drag
            e.preventDefault();
            
            // Calculate new position based on initial offset
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            
            // Apply boundaries to keep window within viewport
            const windowWidth = this.element.offsetWidth;
            const windowHeight = this.element.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const menuBarHeight = 24; // Assuming menu bar height is fixed
            
            // Ensure at least 50px of the header is visible horizontally, and top edge doesn't go under menu bar
            const boundedX = Math.min(Math.max(x, -windowWidth + 50), viewportWidth - 50);
            const boundedY = Math.min(Math.max(y, menuBarHeight), viewportHeight - 30); // Keep bottom 30px clear
            
            this.element.style.left = `${boundedX}px`;
            this.element.style.top = `${boundedY}px`;
        };
        
        const mouseUpHandler = (e) => {
            if (isDragging) {
                isDragging = false;
                this.header.style.cursor = 'grab'; // Reset cursor
                this.element.classList.remove('dragged');
                
                // Remove listeners from document
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
                
                console.log(`[WindowManager for ${this.id}] Drag ended`);
                
                // Save current position after drag ends, only if not fullscreen
                if (!this.element.classList.contains('fullscreen')) {
                    this.originalState.position = 'absolute';
                    this.originalState.top = this.element.style.top;
                    this.originalState.left = this.element.style.left;
                    this.originalState.transform = 'none'; // Position is now controlled by top/left
                }
            }
        };
        
        this.header.addEventListener('mousedown', (e) => {
            // Only drag with the primary mouse button
            if (e.button !== 0) return;
            
            // Don't drag if clicking controls or interactive elements within the header
            if (e.target.classList.contains('control') ||
                e.target.closest('.window-controls') || // Check parent controls div too
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'BUTTON' ||
                e.target.tagName === 'SELECT' ||
                e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Prevent default text selection or other actions
            e.preventDefault();
            
            // Bring window to front
            this.bringToFront();
            
            isDragging = true;
            this.header.style.cursor = 'grabbing'; // Change cursor during drag
            
            // --- Fix Start: Get position and lock it before adding .dragged ---
            // 1. Get current visual position FIRST
            const rect = this.element.getBoundingClientRect();

            // 2. Lock position with inline styles BEFORE adding .dragged class
            this.element.style.position = 'absolute';
            this.element.style.left = `${rect.left}px`;
            this.element.style.top = `${rect.top}px`;
            this.element.style.transform = 'none'; // Explicitly remove transform here

            // 3. Calculate offset based on the initial rect
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            // 4. NOW add the dragged class (shouldn't cause a jump)
            this.element.classList.add('dragged');
            // --- Fix End ---

            // Add listeners to the document to capture mouse move/up anywhere
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
            
            console.log(`[WindowManager for ${this.id}] Drag started`);
        });
    }
    
    setupResizing() {
        const handles = this.element.querySelectorAll('.resize-handle');
        if (!handles || handles.length === 0) return;

        let isResizing = false;
        let handleType = null; // 'br' or 'bl'
        let originalWidth, originalHeight, originalX, originalY, originalTop, originalLeft;
        
        const minWidth = 400;
        const minHeight = 300;
        
        const mouseMoveHandler = (e) => {
            if (!isResizing) return;

            const dx = e.clientX - originalX;
            const dy = e.clientY - originalY;
            
            let newWidth = originalWidth;
            let newHeight = originalHeight;
            let newTop = originalTop;
            let newLeft = originalLeft;

            if (handleType === 'br') {
                newWidth = originalWidth + dx;
                newHeight = originalHeight + dy;
            } else if (handleType === 'bl') {
                newWidth = originalWidth - dx;
                newHeight = originalHeight + dy;
                newLeft = originalLeft + dx;
            }

            // Apply minimum size constraints and update styles
            if (newWidth >= minWidth) {
                this.element.style.width = `${newWidth}px`;
                 if (handleType === 'bl') {
                     this.element.style.left = `${newLeft}px`;
                 }
            } else {
                 // If constraint met, potentially adjust left for BL handle
                 if (handleType === 'bl') {
                     this.element.style.left = `${originalLeft + (originalWidth - minWidth)}px`;
                 }
                 this.element.style.width = `${minWidth}px`;
            }
            
            if (newHeight >= minHeight) {
                 this.element.style.height = `${newHeight}px`;
            } else {
                 this.element.style.height = `${minHeight}px`;
            }
        };
        
        const mouseUpHandler = () => {
            if (isResizing) {
                isResizing = false;
                handleType = null;
                this.element.classList.remove('resizing'); // Remove class on mouseup
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
                console.log(`[WindowManager for ${this.id}] Resize ended`);
                this.saveCurrentState(); 
            }
        };

        handles.forEach(handle => {
            const newHandle = handle.cloneNode(true);
            handle.parentNode.replaceChild(newHandle, handle);
            
            newHandle.addEventListener('mousedown', (e) => {
                if (this.element.classList.contains('fullscreen')) return;
                
                isResizing = true;
                this.element.classList.add('resizing'); // Add class on mousedown
                handleType = newHandle.classList.contains('resize-handle-br') ? 'br' : 'bl';
                e.preventDefault();
                this.bringToFront();

                const rect = this.element.getBoundingClientRect();
                this.element.style.position = 'absolute'; 
                this.element.style.transform = 'none'; 
                this.element.style.left = `${rect.left}px`;
                this.element.style.top = `${rect.top}px`;
                this.element.style.width = `${rect.width}px`;
                this.element.style.height = `${rect.height}px`;
                
                originalWidth = rect.width;
                originalHeight = rect.height;
                originalX = e.clientX;
                originalY = e.clientY;
                originalLeft = rect.left;
                originalTop = rect.top;
                
                console.log(`[WindowManager for ${this.id}] Resize started from ${handleType}`);
                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);
            });
        });
    }
    
    setupDockIcon() {
        if (!this.dockIcon) {
            console.warn(`[WindowManager ${this.id}] No dock icon found.`);
            return; 
        }
        // Problem: Multiple instances share one dock icon.
        // Option 1: Dock click brings *all* windows of that type forward?
        // Option 2: Dock click brings *last focused* window of that type forward?
        // Option 3: Dock icon shows indicator for multiple windows? (Complex UI)
        // Current fix: dock icon click will use ProgramManager.launch(baseId) -> show() 
        // which is handled in menu-bar.js setupSimpleWindowListeners. We don't need a listener here.
        // We just need to manage the 'active' state.
        // This is now handled by ProgramManager.setFocusedInstance logic.
        console.log(`[WindowManager ${this.id}] Dock icon found, but listener is handled globally.`);
    }
    
    setupWindowFocus() {
        // When the window element is clicked (header or content, not controls)
        this.element.addEventListener('mousedown', (e) => {
            // Don't trigger focus change if clicking controls or resize handle
            if (e.target.closest('.window-controls') || e.target.classList.contains('resize-handle')) {
                return;
            }
            this.bringToFront();
            // Trigger the onFocus callback provided by Program
            this.options.onFocus(); 
        }, true); // Use capture phase to ensure it runs before drag starts maybe
    }
    
    minimize() {
        console.log(`[WindowManager ${this.id}] Minimizing.`);
        this.element.classList.add('minimized');
        if (this.dockIcon) this.dockIcon.classList.remove('active'); 
        // Let ProgramManager handle focus change if minimizing the focused window
        this.options.onMinimize(); // Notify program
        // If this was the focused window, clear global focus
        if (ProgramManager.focusedInstanceId === this.id) {
             ProgramManager.setFocusedInstance(null); 
        }
    }
    
    maximize() {
        // Implementation of maximize method
    }
    
    restore() {
        // Implementation of restore method
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
            
            console.log(`[WindowManager for ${this.id}] Window maximized`);
            
            // Call the onMaximize callback
            if (typeof this.options.onMaximize === 'function') {
                this.options.onMaximize();
            }
        } else {
            // Restore to previous state
            this.restoreOriginalState();
            
            console.log(`[WindowManager for ${this.id}] Window restored from fullscreen`);
            
            // Call the onRestore callback
            if (typeof this.options.onRestore === 'function') {
                this.options.onRestore();
            }
        }
    }
    
    show() {
        console.log(`[WindowManager ${this.id}] Showing window.`);
        this.element.classList.remove('minimized');
        this.bringToFront();
        // Trigger the onFocus callback as showing implies focusing
        this.options.onFocus(); 
        // Execute any callbacks registered specifically for showing this window
        this.onShowCallbacks.forEach(cb => cb());
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
    
    saveCurrentState() {
        // Only save if we're not in fullscreen mode
        if (!this.element.classList.contains('fullscreen')) {
            console.log(`[WindowManager for ${this.id}] Saving state:`, { 
                width: this.element.style.width, 
                height: this.element.style.height,
                position: this.element.style.position || 'absolute',
                top: this.element.style.top || '50%',
                left: this.element.style.left || '50%',
                transform: this.element.style.transform || 'translate(-50%, -50%)'
            }); // Log state being saved

            if (this.element.style.width) this.originalState.width = this.element.style.width;
            if (this.element.style.height) this.originalState.height = this.element.style.height;
            
            // Save position properties
            this.originalState.position = this.element.style.position || 'absolute';
            this.originalState.top = this.element.style.top || '50%';
            this.originalState.left = this.element.style.left || '50%';
            this.originalState.transform = this.element.style.transform || 'translate(-50%, -50%)';
            // zIndex is handled by bringToFront and restoreOriginalState
        }
    }
    
    restoreOriginalState() {
        console.log(`[WindowManager for ${this.id}] Restoring state to:`, this.originalState); // Log state being restored
        // Apply saved state explicitly
        this.element.style.position = this.originalState.position;
        this.element.style.top = this.originalState.top;
        this.element.style.left = this.originalState.left;
        this.element.style.width = this.originalState.width;
        this.element.style.height = this.originalState.height;
        this.element.style.transform = this.originalState.transform; // Ensure transform is restored
        this.element.style.zIndex = this.originalState.zIndex || '100'; // Ensure zIndex is restored (with fallback)
    }
    
    bringToFront() {
        // Use static counter from the class to get a new, higher z-index
        const newZIndex = WindowManager.zIndexCounter++;
        this.element.style.zIndex = newZIndex;
        
        // Don't save this temporary high z-index to originalState here,
        // let saveCurrentState handle it if needed after drag/resize.
        console.log(`[WindowManager ${this.id}] Set z-index to ${newZIndex}`);
        
        // Trigger the onFocus callback provided by Program, 
        // which should call ProgramManager.setFocusedInstance
        this.options.onFocus(); 
    }

    close() {
        console.log(`[WindowManager ${this.id}] Closing via manager.`);
        // Trigger the onClose callback provided by Program, which calls ProgramManager.close
        this.options.onClose(); 
    }
}

// Create a factory function for easy window creation
export function createWindowManager(elementId, options = {}) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Failed to create WindowManager: Element with ID ${elementId} not found.`);
        return null;
    }
    console.log(`Creating WindowManager for element: ${elementId}`);
    return new WindowManager(element, options);
}