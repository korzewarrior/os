// Menu Bar management system
// Handles menu interactions and status updates
import { showSettings } from './programs/settings.js';
import { Program, ProgramManager } from './program.js';

// Track the currently active application window
let activeWindow = null;
const DEFAULT_APP = 'desktop';

// Store menu configurations for different applications
const appMenus = {
    desktop: {
        file: [
            { label: 'New File', action: 'new-file' },
            { label: 'New Folder', action: 'new-folder' },
            { separator: true },
            { label: 'Open Terminal', action: 'show-terminal' }
        ]
    },
    terminal: {
        file: [
            { label: 'New Terminal', action: 'new-terminal' },
            { separator: true },
            { label: 'Close Terminal', action: 'close-terminal' }
        ],
        edit: [
            { label: 'Copy', action: 'copy' },
            { label: 'Paste', action: 'paste' },
            { separator: true },
            { label: 'Clear Buffer', action: 'clear-terminal' }
        ]
    },
    browser: {
        file: [
            { label: 'New Tab', action: 'new-tab' }
        ],
        view: [
            { label: 'Reload Page', action: 'reload-page' }
        ]
    },
    mail: {
        file: [
            { label: 'New Message', action: 'new-email' },
            { separator: true },
            { label: 'Send', action: 'send-email' }
        ]
    },
    'pdf-viewer': {
        file: [
            { label: 'Open File...', action: 'open-pdf' }
        ]
    }
};

// Standard menus that appear for all applications
const standardMenus = {
    window: [
        { label: 'Minimize', action: 'minimize-window' },
        { label: 'Maximize', action: 'maximize-window' },
        { separator: true },
        { label: 'Terminal', action: 'show-terminal' },
        { label: 'Browser', action: 'show-browser' },
        { label: 'Mail', action: 'show-mail' },
        { label: 'File Viewer', action: 'show-fileviewer' }
    ]
};

// OS logo dropdown menu
const logoMenu = [
    { label: 'About This System', action: 'about' },
    { separator: true },
    { label: 'System Preferences...', action: 'preferences' },
    { separator: true },
    { label: 'Terminal', action: 'show-terminal' },
    { label: 'Browser', action: 'show-browser' },
    { label: 'Mail', action: 'show-mail' },
    { label: 'File Viewer', action: 'show-fileviewer' },
    { separator: true },
    { label: 'Force Refresh UI', action: 'refresh-ui' }
];

// Track if we've already initialized event listeners
let initialized = false;

/**
 * Initialize the menu bar
 */
export function initializeMenuBar() {
    console.log('Initializing menu bar...');
    
    // Only initialize once
    if (initialized) return;
    initialized = true;
    
    // Update clock
    updateClock();
    setInterval(updateClock, 60000); // Update every minute
    
    // Setup simple window focus listeners
    setupSimpleWindowListeners();
    
    // Initialize OS logo menu
    setupLogoMenu();
    
    // Ensure the logo menu works by adding direct event listener
    ensureLogoMenuWorks();
    
    // Test menu functionality
    testLogoMenu();
    
    // Set desktop as initially active
    setActiveWindow(DEFAULT_APP);
}

/**
 * Setup simple window tracking with minimal overhead
 */
function setupSimpleWindowListeners() {
    // Setup dock icon clicks - simple version without cloning nodes
    const dockIcons = document.querySelectorAll('.dock-item');
    dockIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const appId = this.id.replace('-dock-icon', '');
            const app = document.getElementById(appId);
            
            if (app) {
                // Remove minimized class
                app.classList.remove('minimized');
                
                // Update z-index to bring to front (simple approach)
                document.querySelectorAll('.window-container').forEach(win => {
                    win.style.zIndex = '100';
                });
                app.style.zIndex = '101';
                
                // Set as active window
                setActiveWindow(appId);
            }
        });
    });
    
    // Setup window header clicks for focus
    document.querySelectorAll('.window-header').forEach(header => {
        header.addEventListener('mousedown', function() {
            const window = this.closest('.window-container');
            if (window && !window.classList.contains('minimized')) {
                const appId = window.id;
                
                // Bring to front
                document.querySelectorAll('.window-container').forEach(win => {
                    win.style.zIndex = '100';
                });
                window.style.zIndex = '101';
                
                // Set as active
                setActiveWindow(appId);
            }
        });
    });
    
    // Setup window controls (red button for minimize)
    document.querySelectorAll('.control.red').forEach(button => {
        button.addEventListener('click', function() {
            const window = this.closest('.window-container');
            if (window) {
                window.classList.add('minimized');
                
                // Update dock icon
                const appId = window.id;
                const dockIcon = document.getElementById(`${appId}-dock-icon`);
                if (dockIcon) {
                    dockIcon.classList.remove('active');
                }
                
                // Set desktop as active
                setActiveWindow(DEFAULT_APP);
            }
        });
    });
    
    // Simple desktop click handler
    document.addEventListener('click', function(e) {
        // Check if clicked outside any window and dock
        if (!e.target.closest('.window-container') && 
            !e.target.closest('.dock-item') && 
            !e.target.closest('.menu-bar')) {
            setActiveWindow(DEFAULT_APP);
        }
    });
}

/**
 * Setup the OS logo menu
 */
function setupLogoMenu() {
    // Clear any previous menu setup
    const logoElement = document.querySelector('.menu-bar-logo');
    if (!logoElement) return;
    
    // Remove any existing dropdown
    const existingDropdown = logoElement.querySelector('.menu-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    // Clear all event listeners by cloning and replacing
    const newLogoElement = logoElement.cloneNode(true);
    logoElement.parentNode.replaceChild(newLogoElement, logoElement);
    
    // Create dropdown menu for logo
    const dropdown = document.createElement('div');
    dropdown.className = 'menu-dropdown';
    dropdown.style.left = '0';
    dropdown.style.position = 'absolute';
    dropdown.style.top = '24px';
    dropdown.style.zIndex = '2000';
    
    // Add items to dropdown
    logoMenu.forEach(menuItem => {
        if (menuItem.separator) {
            const separator = document.createElement('div');
            separator.className = 'dropdown-separator';
            dropdown.appendChild(separator);
        } else {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = menuItem.label;
            item.dataset.action = menuItem.action;
            
            // Direct click handler to perform action immediately
            item.addEventListener('click', function() {
                handleMenuAction(menuItem.action);
                hideAllMenus(); // Hide menus after action
            });
            
            dropdown.appendChild(item);
        }
    });
    
    // Add dropdown to document body for more reliable positioning
    newLogoElement.appendChild(dropdown);
    
    // Ensure logo looks clickable
    newLogoElement.style.cursor = 'pointer';
    
    // Direct toggle function for the menu
    function toggleMenu(e) {
        e.stopPropagation();
        e.preventDefault();
        
        const isActive = newLogoElement.classList.contains('active');
        
        // Hide all menus first
        hideAllMenus();
        
        // If menu wasn't active, show it
        if (!isActive) {
            newLogoElement.classList.add('active');
            dropdown.style.display = 'block';
            console.log('OS logo menu opened');
        }
        
        return false;
    }
    
    // Hide all menus
    function hideAllMenus() {
        document.querySelectorAll('.menu-item.active, .menu-bar-logo.active').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
    
    // Add direct click handler to toggle menu
    newLogoElement.addEventListener('click', toggleMenu);
    
    // Add global click handler to close menu when clicking elsewhere
    document.addEventListener('click', hideAllMenus);
    
    // Handle escape key to close menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllMenus();
        }
    });
    
    console.log('OS logo menu setup complete');
}

/**
 * Set the active window and update menus
 * @param {string} windowId - ID of the window to set as active
 */
function setActiveWindow(windowId) {
    // Avoid unnecessary updates
    if (activeWindow === windowId) return;
    
    activeWindow = windowId;
    
    // Update application name
    updateAppName();
    
    // Update menus
    updateMenus();
    
    // Update visual focus indicators
    document.querySelectorAll('.window-container').forEach(win => {
        if (win.id === windowId) {
            win.classList.add('window-focused');
        } else {
            win.classList.remove('window-focused');
        }
    });
}

/**
 * Update the application name displayed in the menu bar
 */
function updateAppName() {
    const appNameElement = document.querySelector('.menu-item.app-name');
    if (!appNameElement) return;
    
    let appName = "korzeOS";
    
    switch (activeWindow) {
        case 'terminal':
            appName = "Terminal";
            break;
        case 'browser':
            appName = "Browser";
            break;
        case 'mail':
            appName = "Mail";
            break;
        case 'pdf-viewer':
            appName = "File Viewer";
            break;
    }
    
    appNameElement.textContent = appName;
}

/**
 * Update menus based on the active window
 */
function updateMenus() {
    // Clear existing dropdown menus
    document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
        if (!dropdown.closest('.menu-bar-logo')) { // Don't remove logo dropdown
            dropdown.remove();
        }
    });
    
    // Remove existing click handlers from menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.classList.contains('app-name') || item.closest('.menu-bar-logo')) return;
        item.replaceWith(item.cloneNode(true));
    });
    
    // Create the application menus
    createAppMenus();
}

/**
 * Create menu dropdowns for the active application
 */
function createAppMenus() {
    // Get app-specific menus
    const appMenuConfig = appMenus[activeWindow] || appMenus[DEFAULT_APP];
    
    // Get fresh references to menu items after cloning
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Show/hide menu items based on available content
    menuItems.forEach(item => {
        if (item.classList.contains('app-name') || item.closest('.menu-bar-logo')) return; // Skip app name and logo
        
        const menuType = item.textContent.toLowerCase();
        
        // Check if this menu type has content
        const hasContent = (menuType === 'file' || menuType === 'edit' || menuType === 'view') && 
                          appMenuConfig[menuType] && 
                          appMenuConfig[menuType].length > 0;
        
        const isStandardMenu = (menuType === 'window') && 
                              standardMenus[menuType] && 
                              standardMenus[menuType].length > 0;
        
        // Show/hide menu item based on content availability
        if (hasContent || isStandardMenu) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
        
        // Get menu content
        let menuContent = [];
        if (menuType === 'file' || menuType === 'edit' || menuType === 'view') {
            menuContent = appMenuConfig[menuType] || [];
        } else if (menuType === 'window') {
            menuContent = standardMenus[menuType] || [];
        }
        
        // Skip if no content
        if (menuContent.length === 0) return;
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'menu-dropdown';
        
        // Add items to dropdown
        menuContent.forEach(menuItem => {
            if (menuItem.separator) {
                const separator = document.createElement('div');
                separator.className = 'dropdown-separator';
                dropdown.appendChild(separator);
            } else {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.textContent = menuItem.label;
                item.dataset.action = menuItem.action;
                
                // Add click handler directly
                item.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    // Close all menus
                    document.querySelectorAll('.menu-item').forEach(mi => {
                        mi.classList.remove('active');
                    });
                    
                    // Handle the action
                    handleMenuAction(menuItem.action);
                });
                
                dropdown.appendChild(item);
            }
        });
        
        // Add dropdown to menu item
        item.appendChild(dropdown);
        
        // Add click handler to menu item
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close other menus
            menuItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            document.querySelector('.menu-bar-logo')?.classList.remove('active');
            
            // Toggle this menu
            item.classList.toggle('active');
        });
    });
    
    // Add global click handler to close menus
    document.addEventListener('click', function() {
        menuItems.forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector('.menu-bar-logo')?.classList.remove('active');
    });
}

/**
 * Handle menu action based on active window
 * @param {string} action - The action to perform
 */
function handleMenuAction(action) {
    // Window navigation actions
    if (action === 'show-terminal') {
        showApplication('terminal');
        return;
    } else if (action === 'show-browser') {
        showApplication('browser');
        return;
    } else if (action === 'show-mail') {
        showApplication('mail');
        return;
    } else if (action === 'show-fileviewer') {
        showApplication('pdf-viewer');
        return;
    } else if (action === 'about') {
        // Use ProgramManager to launch the About program
        if (ProgramManager.programs && ProgramManager.programs.about) {
            ProgramManager.launch('about');
        } else {
            console.error('About program not registered. Trying direct instantiation...');
            // As a fallback, try to directly import and instantiate
            import('./programs/about.js').then(module => {
                if (module.AboutProgram) {
                    const aboutProgram = new module.AboutProgram();
                    aboutProgram.init();
                } else {
                    console.error('AboutProgram not found in module');
                }
            }).catch(err => {
                console.error('Failed to import About program:', err);
                alert('Failed to open About dialog. See console for details.');
            });
        }
        return;
    } else if (action === 'preferences') {
        showSettings();
        return;
    } else if (action === 'refresh-ui') {
        refreshUserInterface();
        return;
    }
    
    // Window control actions
    if (action === 'minimize-window') {
        minimizeActiveWindow();
        return;
    } else if (action === 'maximize-window') {
        maximizeActiveWindow();
        return;
    }
    
    // Application-specific actions
    switch (activeWindow) {
        case 'terminal':
            handleTerminalAction(action);
            break;
        case 'browser':
            handleBrowserAction(action);
            break;
        case 'mail':
            handleMailAction(action);
            break;
        case 'pdf-viewer':
            handlePdfViewerAction(action);
            break;
        default:
            console.log(`Action '${action}' not implemented for ${activeWindow}`);
            break;
    }
}

/**
 * Handle Terminal-specific actions
 * @param {string} action - The action to perform
 */
function handleTerminalAction(action) {
    const terminal = document.getElementById('terminal');
    if (!terminal) return;
    
    switch (action) {
        case 'clear-terminal':
            const output = terminal.querySelector('#output');
            if (output) output.innerHTML = '';
            break;
        case 'copy':
            document.execCommand('copy');
            break;
        case 'paste':
            const commandInput = terminal.querySelector('#command-input');
            if (commandInput) commandInput.focus();
            break;
        case 'close-terminal':
            terminal.classList.add('minimized');
            const dockIcon = document.getElementById('terminal-dock-icon');
            if (dockIcon) dockIcon.classList.remove('active');
            setActiveWindow(DEFAULT_APP);
            break;
    }
}

/**
 * Handle Browser-specific actions
 * @param {string} action - The action to perform
 */
function handleBrowserAction(action) {
    const browser = document.getElementById('browser');
    if (!browser) return;
    
    switch (action) {
        case 'reload-page':
            const refreshButton = browser.querySelector('.refresh-button');
            if (refreshButton) refreshButton.click();
            break;
    }
}

/**
 * Handle Mail-specific actions
 * @param {string} action - The action to perform
 */
function handleMailAction(action) {
    const mail = document.getElementById('mail');
    if (!mail) return;
    
    switch (action) {
        case 'new-email':
            const form = mail.querySelector('#compose-form');
            if (form) form.reset();
            break;
        case 'send-email':
            const sendButton = mail.querySelector('#send-email');
            if (sendButton) sendButton.click();
            break;
    }
}

/**
 * Handle PDF Viewer-specific actions
 */
function handlePdfViewerAction(action) {
    console.log(`PDF Viewer action: ${action}`);
}

/**
 * Minimize the active window
 */
function minimizeActiveWindow() {
    if (!activeWindow || activeWindow === DEFAULT_APP) return;
    
    const window = document.getElementById(activeWindow);
    if (window) {
        window.classList.add('minimized');
        
        // Update dock icon
        const dockIcon = document.getElementById(`${activeWindow}-dock-icon`);
        if (dockIcon) dockIcon.classList.remove('active');
        
        // Set desktop as active
        setActiveWindow(DEFAULT_APP);
    }
}

/**
 * Maximize/restore the active window
 */
function maximizeActiveWindow() {
    if (!activeWindow || activeWindow === DEFAULT_APP) return;
    
    const window = document.getElementById(activeWindow);
    if (window) {
        window.classList.toggle('fullscreen');
    }
}

/**
 * Show an application window
 * @param {string} appId - The ID of the application window to show
 */
function showApplication(appId) {
    const app = document.getElementById(appId);
    if (!app) return;
    
    // Show the window
    app.classList.remove('minimized');
    
    // Update dock icon
    const dockIcon = document.getElementById(`${appId}-dock-icon`);
    if (dockIcon) {
        dockIcon.classList.add('active');
    }
    
    // Bring to front with simple z-index
    document.querySelectorAll('.window-container').forEach(win => {
        win.style.zIndex = '100';
    });
    app.style.zIndex = '101';
    
    // Set as active window
    setActiveWindow(appId);
}

/**
 * Show the About dialog
 * @deprecated - Now handled by AboutProgram class
 */
function showAboutDialog() {
    const aboutProgram = new AboutProgram();
    aboutProgram.init();
}

/**
 * Update the clock in the menu bar
 */
function updateClock() {
    const timeElement = document.getElementById('current-time');
    if (!timeElement) return;
    
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    timeElement.textContent = `${formattedHours}:${formattedMinutes} ${ampm}`;
}

/**
 * Fallback function to ensure the OS logo menu works
 */
function ensureLogoMenuWorks() {
    const logoElement = document.querySelector('.menu-bar-logo');
    if (!logoElement) {
        console.error('Logo element not found, cannot setup menu');
        return;
    }
    
    // Check if the dropdown exists
    const dropdown = logoElement.querySelector('.menu-dropdown');
    if (!dropdown) {
        console.warn('Logo dropdown not found, recreating menu...');
        // Try to rebuild the menu without replacing handlers
        setupLogoMenu();
        return;
    }
    
    console.log('Logo menu setup verified');
}

/**
 * Force refresh the user interface
 */
function refreshUserInterface() {
    console.log('Force refreshing UI...');
    
    // Reset menu bar
    initialized = false;
    
    // Remove existing dropdowns
    document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
        dropdown.remove();
    });
    
    // Reinitialize menu bar
    initializeMenuBar();
    
    // Update menus for active window
    updateMenus();
    
    // Alert user
    alert('UI has been refreshed!');
}

/**
 * Test if the OS logo menu can be opened and closed
 */
function testLogoMenu() {
    console.log('[TEST] Testing OS logo menu functionality...');
    
    setTimeout(() => {
        const logoElement = document.querySelector('.menu-bar-logo');
        if (!logoElement) {
            console.error('[TEST] Logo element not found!');
            return;
        }
        
        // Add a temporary special click handler to test the menu
        window.openOSMenu = function() {
            console.log('[TEST] Manually opening OS menu');
            logoElement.click();
            
            // Check if menu is visible
            const dropdown = logoElement.querySelector('.menu-dropdown');
            const isVisible = dropdown && 
                  (dropdown.style.display === 'block' || 
                   logoElement.classList.contains('active'));
            
            console.log('[TEST] OS menu visible:', isVisible);
            
            return "OS Menu clicked, visible: " + isVisible;
        };
        
        console.log('[TEST] Test function added. Call window.openOSMenu() to test.');
    }, 1000);
} 