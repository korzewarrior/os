// Main script file - Entry point
// Remove the named import, but keep importing the module to ensure class registration
import './programs/terminal.js'; 
import './programs/browser.js'; 
import './programs/mail.js'; // Ensures MailProgram registers 
import './programs/settings.js'; // Ensures SettingsProgram registers
import './programs/pdf-viewer.js'; // Ensures PdfViewerProgram registers
// import { createWindowManager } from './window-manager.js'; // WindowManager is created by Program now
import { initializeDesktop } from './desktop.js';
import { initializeMenuBar } from './menu-bar.js';
import { Program, ProgramManager } from './program.js';
import { initializeDebug, autoRepair } from './debug.js';

// Make Program and ProgramManager globally available
window.Program = Program;
window.ProgramManager = ProgramManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing OS...');
    
    // IMPORTANT: Set initial UI preferences before any components are initialized
    setupUIPreferences();
    
    // Start the system initialization sequence
    startSystemInitialization();
    
    // --- Add Desktop Click Listener for Focus --- 
    document.body.addEventListener('click', (e) => {
         // Check if the click is directly on the body or the #desktop-files container,
         // but NOT on a window, dock item, or menu bar element.
         if ((e.target === document.body || e.target.id === 'desktop-files') && 
             !e.target.closest('.window-container') && 
             !e.target.closest('.dock-item') && 
             !e.target.closest('.menu-bar') &&
             !e.target.closest('.context-menu')) { // Also ignore context menus
             
             console.log('Desktop background clicked. Setting focus to desktop.');
             ProgramManager.setFocusedInstance(null); // Clear focus
         }
    }, false); // Use bubble phase
    // -----------------------------------------
});

/**
 * Set up UI preferences (theme, font size, wallpaper) before component initialization
 */
function setupUIPreferences() {
    // 1. Apply theme (must happen first so components render with correct theme)
    applyTheme();
    
    // 2. Apply font size (affects all text rendering)
    applyFontSize();
    
    // 3. Apply wallpaper
    applyWallpaper();
}

/**
 * Apply the user's theme preference or default to light theme
 */
function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToApply = savedTheme === 'dark' ? 'dark' : 'light';
    
    console.log('Applying theme:', themeToApply);
    
    // Apply the theme to the body element
    document.body.classList.toggle('dark-theme', themeToApply === 'dark');
    
    // Update any theme toggles in the DOM
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = themeToApply === 'light';
    }
    
    // Save theme preference if none exists
    if (!savedTheme) {
        localStorage.setItem('theme', 'light');
    }
}

/**
 * Apply the user's font size preference or default to 13px
 */
function applyFontSize() {
    const savedFontSize = localStorage.getItem('font-size') || '13';
    
    console.log('Applying font size:', savedFontSize);
    
    // Apply font size to the CSS variable used throughout the UI
    document.documentElement.style.setProperty('--base-font-size', `${savedFontSize}px`);
    
    // Update any font size sliders in the DOM
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeValue = document.getElementById('font-size-value');
    
    if (fontSizeSlider) {
        fontSizeSlider.value = savedFontSize;
    }
    
    if (fontSizeValue) {
        fontSizeValue.textContent = `${savedFontSize}px`;
    }
}

/**
 * Apply the user's wallpaper preference or default wallpaper
 */
function applyWallpaper() {
    const defaultWallpaper = 'img/wallpapers/gradient.jpg';
    const savedWallpaper = localStorage.getItem('background') || defaultWallpaper;
    
    console.log('Applying wallpaper:', savedWallpaper);
    
    // Apply the wallpaper to the body background with high specificity
    document.body.style.backgroundImage = `url('${savedWallpaper}')`;
    document.body.style.setProperty('background-image', `url('${savedWallpaper}')`, 'important');
    
    // Also update CSS variable for components that might reference it
    document.documentElement.style.setProperty('--current-wallpaper', `url('${savedWallpaper}')`);
}

/**
 * Start the system initialization sequence once UI preferences are applied
 */
function startSystemInitialization() {
    // Initialize application logic (registers program classes)
    initializeApplications();
    
    // Initialize desktop (creates icons)
    initializeDesktop(); 

    // Initialize menu bar (sets up listeners)
    initializeMenuBar();

    // Enhance UI elements
    enhanceUIElements();
    
    // Initialize system info
    updateSystemInfo();
    
    // Initialize debug tools last
    initializeDebug();
    
    console.log('System initialization complete');
}

/**
 * Initialize all applications (mainly registers their classes)
 */
function initializeApplications() {
    console.log('Initializing applications (imports handle registration)...');
    // Registration happens via imports above
   
    // --- Dock Icon Listeners --- 
    const dockIcons = document.querySelectorAll('.dock-item');
    dockIcons.forEach(icon => {
        const newIcon = icon.cloneNode(true);
        icon.parentNode.replaceChild(newIcon, icon);
        
        newIcon.addEventListener('click', function() {
            const appId = this.id.replace('-dock-icon', '');
            console.log(`[Dock Click] Launching/showing app: ${appId}`);
            try {
                const programInstance = ProgramManager.launch(appId); 
                if (programInstance) { 
                    programInstance.show();
                } else {
                    // No fallback needed if launch returns null - indicates class not registered
                    console.error(`Program class not found or launch failed for ID: ${appId}`); 
                }
            } catch (error) {
                 console.error(`Error during ProgramManager.launch for ${appId}:`, error);
            }
        });
    });
}

/**
 * Enhance UI elements with improved functionality
 */
function enhanceUIElements() {
    console.log('Enhancing UI elements...');
    
    // Improve resize handles with visual indicator
    enhanceResizeHandles();
}

function enhanceResizeHandles() {
    const resizeHandles = document.querySelectorAll('.resize-handle');
    
    resizeHandles.forEach(handle => {
        // Add visual indicator (triangle shape) using pseudo-element (via CSS)
        // Removed: handle.style.position = 'relative';
        
        // Add an inner-triangle element
        const triangle = document.createElement('div');
        triangle.className = 'resize-triangle';
        triangle.style.position = 'absolute';
        triangle.style.bottom = '0';
        triangle.style.right = '0';
        triangle.style.width = '0';
        triangle.style.height = '0';
        triangle.style.borderStyle = 'solid';
        triangle.style.borderWidth = '0 0 10px 10px';
        triangle.style.borderColor = 'transparent transparent rgba(0,0,0,0.2) transparent';
        
        handle.appendChild(triangle);
    });
}

// Initialize the system info in the About section of settings
function updateSystemInfo() {
    // Browser info
    const browserInfoElement = document.getElementById('browser-info');
    if (browserInfoElement) {
        const userAgent = navigator.userAgent;
        let browserName = "Unknown Browser";
        
        if (userAgent.indexOf("Firefox") > -1) {
            browserName = "Mozilla Firefox";
        } else if (userAgent.indexOf("SamsungBrowser") > -1) {
            browserName = "Samsung Browser";
        } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
            browserName = "Opera";
        } else if (userAgent.indexOf("Edge") > -1) {
            browserName = "Microsoft Edge";
        } else if (userAgent.indexOf("Chrome") > -1) {
            browserName = "Google Chrome";
        } else if (userAgent.indexOf("Safari") > -1) {
            browserName = "Apple Safari";
        }
        
        browserInfoElement.textContent = browserName;
    }
    
    // Screen resolution
    const resolutionInfoElement = document.getElementById('resolution-info');
    if (resolutionInfoElement) {
        resolutionInfoElement.textContent = `${window.screen.width} × ${window.screen.height}`;
    }
} 