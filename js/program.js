/**
 * Base Program Class
 * Provides common functionality for all programs in the OS
 */

import { createWindowManager } from './window-manager.js';

// Program Manager to handle registration and launching of program instances
export class ProgramManager {
    static programClasses = {}; // Stores registered Program classes by base ID (e.g., 'browser')
    static activeInstances = {}; // Stores active program instances by unique ID (e.g., 'browser-123')
    static focusedInstanceId = null; // Track the ID of the focused window

    /**
     * Register a program with the manager
     * @param {class} ProgramClass - The program's class definition
     */
    static register(ProgramClass) {
        // Use a static property on the class or a getter for the base ID
        const baseId = ProgramClass.BASE_ID || ProgramClass.name.toLowerCase().replace('program', '');
        if (!baseId) {
            console.error('Program class must have a static BASE_ID property or follow naming convention.');
            return;
        }
        this.programClasses[baseId] = ProgramClass;
        console.log(`Program class registered: ${baseId}`);
    }
    
    /**
     * Launch a program by ID
     * @param {string} baseId - The program's base ID
     * @param {object} options - Optional parameters for the program
     * @returns {object} The program instance
     */
    static launch(baseId, options = {}) {
        // --- Singleton Check for Settings --- 
        if (baseId === 'settings') {
            const existingInstances = this.getInstancesByType('settings');
            if (existingInstances.length > 0) {
                 console.log('Settings instance already exists. Focusing existing.');
                 existingInstances[0].show(); // Show the first existing instance
                 return existingInstances[0]; // Return existing instance
            }
        }
        // --- End Singleton Check ---
        
        const ProgramClass = this.programClasses[baseId];
        if (!ProgramClass) {
            console.error(`Program class not found for base ID: ${baseId}`);
            return null;
        }

        // Generate a unique instance ID
        const instanceId = `${baseId}-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;
        console.log(`Launching new instance for ${baseId} with ID: ${instanceId}`);

        // Create the program instance with its unique ID
        const programInstance = new ProgramClass(instanceId, options);

        // Store the active instance
        this.activeInstances[instanceId] = programInstance;

        // Store the initialization promise on the instance
        // This promise will resolve when init is done, or reject if it fails
        programInstance._initPromise = programInstance.init().catch(err => {
            console.error(`Error initializing program instance ${instanceId}:`, err);
            // Clean up if initialization fails
            delete this.activeInstances[instanceId];
            const windowElement = document.getElementById(instanceId);
            if (windowElement) windowElement.remove();
            // Rethrow the error so callers know init failed if they await the promise
            throw err; 
        });

        return programInstance; // Return the instance immediately
    }

    static getInstance(instanceId) {
        return this.activeInstances[instanceId];
    }
    
    // Get count of currently VISIBLE instances of a specific base type
    static getVisibleInstanceCount(baseId) {
        let count = 0;
        for (const instanceId in this.activeInstances) {
            const instance = this.activeInstances[instanceId];
            // Check baseId and if the window element exists and is not minimized
            if (instance.baseId === baseId && instance.windowElement && !instance.windowElement.classList.contains('minimized')) {
                count++;
            }
        }
        return count;
    }

    // Get all instances of a specific base type (e.g., all browsers)
    static getInstancesByType(baseId) {
        return Object.values(this.activeInstances).filter(instance => instance.baseId === baseId);
    }

    static close(instanceId) {
        const instance = this.activeInstances[instanceId];
        if (instance) {
            console.log(`Closing instance: ${instanceId}`);
            if (instance.destroy) {
                instance.destroy(); // Allow program to clean up
            }
            const windowElement = document.getElementById(instanceId);
            if (windowElement) windowElement.remove();
            delete this.activeInstances[instanceId];
            if (this.focusedInstanceId === instanceId) {
                this.setFocusedInstance(null); // Clear focus if closed window was focused
            }
        } else {
            console.warn(`Attempted to close non-existent instance: ${instanceId}`);
        }
    }
    
    static setFocusedInstance(instanceId) {
         // Only proceed if focus is actually changing
         if (this.focusedInstanceId === instanceId) return;

         console.log(`Changing focused instance from ${this.focusedInstanceId} to: ${instanceId}`);

         // 1. Unfocus the previously focused instance (if any)
         const previousInstance = this.getInstance(this.focusedInstanceId);
         if (previousInstance && previousInstance.windowElement) {
             console.log(`Unfocusing previous instance: ${this.focusedInstanceId}`);
             previousInstance.windowElement.classList.remove('window-focused');
             // Update its dock icon (find by baseId)
             const prevDockIcon = document.getElementById(`${previousInstance.baseId}-dock-icon`);
             if (prevDockIcon) prevDockIcon.classList.remove('active');
         }

         // 2. Update the internal focus tracking
         this.focusedInstanceId = instanceId;

         // 3. Focus the new instance (if not null/desktop)
         const newInstance = this.getInstance(instanceId);
         let newBaseId = 'desktop'; // Default if no window is focused
         if (newInstance && newInstance.windowElement) {
             console.log(`Focusing new instance: ${instanceId}`);
             newInstance.windowElement.classList.add('window-focused');
             newBaseId = newInstance.baseId;
             // Update its dock icon
             const newDockIcon = document.getElementById(`${newInstance.baseId}-dock-icon`);
             if (newDockIcon) newDockIcon.classList.add('active');
             // Ensure it's physically on top (WindowManager should have handled z-index on click)
             // Optionally call bringToFront again, but might be redundant?
             // newInstance.windowManager?.bringToFront(); 
         } else {
              console.log('Focus set to desktop (no instance ID provided).');
         }

         // 4. Update the menu bar based on the newly focused app type (or desktop)
         if (window.updateMenuBarForApp) {
             window.updateMenuBarForApp(newBaseId);
         } else {
              console.warn('window.updateMenuBarForApp not found, cannot update menu bar.');
         }
    }

    static getFocusedInstance() {
        return this.getInstance(this.focusedInstanceId);
    }
}

/**
 * Base Program class that all application windows extend
 */
export class Program {
    /**
     * Create a new program window
     * @param {string} instanceId - The program's unique identifier
     * @param {string} title - The window title
     * @param {string} baseId - The program's base ID
     * @param {number} width - Initial window width in pixels
     * @param {number} height - Initial window height in pixels
     */
    constructor(instanceId, title, baseId, width = 800, height = 600) {
        this.instanceId = instanceId; // Unique ID for this specific window instance
        this.baseId = baseId;         // Base type ID (e.g., 'browser')
        this.title = title;
        this.width = width;
        this.height = height;
        this.icon = ''; // Program-specific icon (optional)
        this.windowManager = null; // Will be created in init
        this.windowElement = null; // Reference to the main window DOM element
        this.windowContent = null; // Reference to the content area
        this.isInitialized = false;
    }
    
    /**
     * Initialize the program window
     */
    async init() {
        if (this.isInitialized) return;
        
        console.log(`Initializing program instance: ${this.instanceId} (Base: ${this.baseId})`);
        
        // Create the window DOM element
        this.windowElement = this.createWindowElement();
        document.body.appendChild(this.windowElement); 
        this.windowContent = this.windowElement.querySelector('.window-content');
        
        // Create a WindowManager for THIS instance
        this.windowManager = createWindowManager(this.instanceId, {
            initialWidth: `${this.width}px`,
            initialHeight: `${this.height}px`,
            minimized: false, // Usually launch unminimized
            onFocus: () => ProgramManager.setFocusedInstance(this.instanceId),
            onClose: () => ProgramManager.close(this.instanceId),
            // Add other callbacks as needed (onMinimize, onDragEnd etc.)
        });
        
        if (!this.windowManager) {
            console.error(`[Program ${this.instanceId}] Failed to create WindowManager.`);
            // Clean up DOM element if manager creation fails?
            this.windowElement.remove();
            throw new Error('WindowManager creation failed'); // Throw to signal failure
        }
        
        this.isInitialized = true;
    }
    
    /**
     * Create the window DOM element
     * @returns {HTMLElement} The window element
     */
    createWindowElement() {
        const windowElement = document.createElement('div');
        windowElement.id = this.instanceId; // Use unique instance ID
        // Add baseId class for potential general styling
        windowElement.className = `window-container ${this.baseId}-container`; 
        windowElement.style.width = `${this.width}px`;
        windowElement.style.height = `${this.height}px`;
        
        // Create window header
        const header = document.createElement('div');
        header.className = `window-header ${this.baseId}-header`; // Style based on base type
        
        // Create window controls
        const controls = document.createElement('div');
        controls.className = `window-controls ${this.baseId}-controls`;
        
        // Add buttons (consider making this reusable)
        controls.innerHTML = '<span class="control red"></span><span class="control yellow"></span><span class="control green"></span>';
        
        // Create title
        const titleDiv = document.createElement('div');
        titleDiv.className = `window-title ${this.baseId}-title`;
        titleDiv.textContent = this.title;
        
        // Add icon if specified
        if (this.icon) {
            const iconElement = document.createElement('i');
            iconElement.className = `fas ${this.icon}`;
            titleDiv.insertBefore(iconElement, titleDiv.firstChild);
        }
        
        header.appendChild(controls);
        header.appendChild(titleDiv);
        
        // Create content area
        const content = document.createElement('div');
        // Use instanceId for content if needed, but baseId is common
        content.className = `window-content ${this.baseId}-content`; 
        
        // Create resize handle (bottom-right)
        const resizeHandleBR = document.createElement('div');
        resizeHandleBR.className = 'resize-handle resize-handle-br'; // Added specific class
        resizeHandleBR.id = `${this.instanceId}-resize-handle-br`;
        
        // Create resize handle (bottom-left)
        const resizeHandleBL = document.createElement('div');
        resizeHandleBL.className = 'resize-handle resize-handle-bl'; // New class
        resizeHandleBL.id = `${this.instanceId}-resize-handle-bl`;
        
        // Assemble window
        windowElement.appendChild(header);
        windowElement.appendChild(content);
        windowElement.appendChild(resizeHandleBR); // Add bottom-right handle
        windowElement.appendChild(resizeHandleBL); // Add bottom-left handle
        
        // --- Center Window on Screen --- 
        windowElement.style.position = 'absolute'; 
        // Calculate center position, ensuring it stays within bounds
        const top = Math.max(30, (window.innerHeight - this.height) / 2); // Ensure below menu bar
        const left = Math.max(0, (window.innerWidth - this.width) / 2);
        
        windowElement.style.top = `${top}px`;
        windowElement.style.left = `${left}px`;
        // Remove transform if previously used for centering
        windowElement.style.transform = 'none'; 
        // -------------------------------

        return windowElement;
    }
    
    /**
     * Show the program window
     */
    async show() {
        // Ensure initialization is complete before showing
        if (this._initPromise) {
            try {
                 console.log(`[Program ${this.instanceId}] Waiting for init promise before showing...`);
                 await this._initPromise;
                 console.log(`[Program ${this.instanceId}] Init promise resolved.`);
                 // Clear the promise reference once resolved to avoid re-awaiting unnecessarily?
                 // delete this._initPromise; 
            } catch (error) {
                 console.error(`[Program ${this.instanceId}] Init failed before show could complete:`, error);
                 // ProgramManager should have handled cleanup in the .catch 
                 // where _initPromise was defined.
                 return; // Don't proceed if init failed
            }
        } else if (!this.isInitialized) {
             // Fallback if promise wasn't set or init wasn't called yet?
             // This might indicate a problem in launch logic.
             console.warn(`[Program ${this.instanceId}] Show called without _initPromise and not initialized. Attempting late init.`);
             try {
                 await this.init();
             } catch (error) {
                  console.error(`[Program ${this.instanceId}] Late init failed during show:`, error);
                  return;
             }
        }
        
        // Proceed with showing only if initialization succeeded and WM exists
        if (!this.windowManager) {
            console.error(`[Program ${this.instanceId}] Show called but windowManager is not set (likely due to init failure).`);
            return;
        }
        
        console.log(`[Program ${this.instanceId}] Calling WindowManager.show()`);
        this.windowManager.show(); 
    }
    
    /**
     * Hide/minimize the program window
     */
    hide() {
        // Now this.windowManager should be correctly set if init() ran successfully
        if (!this.windowManager) {
            console.error(`[Program ${this.instanceId}] Hide/Minimize called but windowManager is not set.`);
            return;
        }
        
        this.windowManager.minimize(); 

        // Removed redundant DOM manipulation here, rely on WindowManager.minimize()
    }
    
    /**
     * Load a stylesheet for this program
     * @param {string} path - Path to the CSS file
     */
    loadStylesheet(path) {
        // Stylesheets are usually global, maybe check if needed per instance?
        if (document.querySelector(`link[href="${path}"]`)) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        document.head.appendChild(link);
    }

    // Method to update the window title text
    setTitle(newTitle) {
        this.title = newTitle;
        const titleElement = this.windowElement?.querySelector('.window-title');
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    }

    close() { // Trigger the close process via ProgramManager
        ProgramManager.close(this.instanceId);
    }

    // Optional: Method for programs to clean up resources (event listeners etc.)
    destroy() {
         console.log(`Destroying program instance: ${this.instanceId}`);
         // Base implementation does nothing, subclasses can override
    }
} 