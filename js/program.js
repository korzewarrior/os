/**
 * Base Program Class
 * Provides common functionality for all programs in the OS
 */

import { createWindowManager } from './window-manager.js';

// Program Manager to keep track of registered programs
export class ProgramManager {
    static programs = {};
    
    /**
     * Register a program with the manager
     * @param {class} ProgramClass - The program's class definition
     */
    static register(ProgramClass) {
        const instance = new ProgramClass();
        const id = instance.id;
        
        if (!id) {
            console.error('Program must have an ID');
            return;
        }
        
        this.programs[id] = ProgramClass;
        console.log(`Program registered: ${id}`);
    }
    
    /**
     * Launch a program by ID
     * @param {string} id - The program's ID
     * @param {object} options - Optional parameters for the program
     * @returns {object} The program instance
     */
    static launch(id, options = {}) {
        if (!this.programs[id]) {
            console.error(`Program not found: ${id}`);
            return null;
        }
        
        const ProgramClass = this.programs[id];
        const program = new ProgramClass(options);
        program.init();
        
        return program;
    }
}

/**
 * Base Program class that all application windows extend
 */
export class Program {
    /**
     * Create a new program window
     * @param {string} id - The program's unique identifier
     * @param {string} title - The window title
     * @param {number} width - Initial window width in pixels
     * @param {number} height - Initial window height in pixels
     */
    constructor(id, title, width = 800, height = 600) {
        this.id = id;
        this.title = title;
        this.width = width;
        this.height = height;
        this.icon = '';
        this.windowManager = null;
        this.windowContent = null;
        this.isInitialized = false;
    }
    
    /**
     * Initialize the program window
     */
    async init() {
        if (this.isInitialized) return;
        
        console.log(`Initializing program: ${this.id}`);
        
        // Create or get the window container
        let windowElement = document.getElementById(this.id);
        
        if (!windowElement) {
            // Create new window if it doesn't exist
            windowElement = this.createWindowElement();
            document.body.appendChild(windowElement);
        }
        
        // Setup window manager
        this.windowManager = createWindowManager(this.id, {
            title: this.title,
            initialWidth: `${this.width}px`,
            initialHeight: `${this.height}px`,
            minimized: false
        });
        
        // Store reference to content area
        this.windowContent = windowElement.querySelector('.window-content');
        
        // Mark as initialized
        this.isInitialized = true;
        
        // Show the window
        this.show();
    }
    
    /**
     * Create the window DOM element
     * @returns {HTMLElement} The window element
     */
    createWindowElement() {
        const windowElement = document.createElement('div');
        windowElement.id = this.id;
        windowElement.className = `window-container ${this.id}-container`;
        
        // Create window header
        const header = document.createElement('div');
        header.className = `window-header ${this.id}-header`;
        
        // Create window controls
        const controls = document.createElement('div');
        controls.className = `window-controls ${this.id}-controls`;
        
        const redButton = document.createElement('span');
        redButton.className = 'control red';
        
        const yellowButton = document.createElement('span');
        yellowButton.className = 'control yellow';
        
        const greenButton = document.createElement('span');
        greenButton.className = 'control green';
        
        controls.appendChild(redButton);
        controls.appendChild(yellowButton);
        controls.appendChild(greenButton);
        
        // Create title
        const title = document.createElement('div');
        title.className = `window-title ${this.id}-title`;
        title.textContent = this.title;
        
        // Add icon if specified
        if (this.icon) {
            const iconElement = document.createElement('i');
            iconElement.className = `fas ${this.icon}`;
            title.insertBefore(iconElement, title.firstChild);
        }
        
        header.appendChild(controls);
        header.appendChild(title);
        
        // Create content area
        const content = document.createElement('div');
        content.className = `${this.id}-content window-content`;
        
        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.id = `${this.id}-resize-handle`;
        
        // Assemble window
        windowElement.appendChild(header);
        windowElement.appendChild(content);
        windowElement.appendChild(resizeHandle);
        
        return windowElement;
    }
    
    /**
     * Show the program window
     */
    show() {
        if (!this.windowManager) return;
        
        const element = document.getElementById(this.id);
        if (element) {
            element.classList.remove('minimized');
            
            // Activate dock icon if exists
            const dockIcon = document.getElementById(`${this.id}-dock-icon`);
            if (dockIcon) {
                dockIcon.classList.add('active');
            }
        }
    }
    
    /**
     * Hide/minimize the program window
     */
    hide() {
        if (!this.windowManager) return;
        
        const element = document.getElementById(this.id);
        if (element) {
            element.classList.add('minimized');
            
            // Deactivate dock icon if exists
            const dockIcon = document.getElementById(`${this.id}-dock-icon`);
            if (dockIcon) {
                dockIcon.classList.remove('active');
            }
        }
    }
    
    /**
     * Load a stylesheet for this program
     * @param {string} path - Path to the CSS file
     */
    loadStylesheet(path) {
        if (document.querySelector(`link[href="${path}"]`)) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        document.head.appendChild(link);
    }
} 