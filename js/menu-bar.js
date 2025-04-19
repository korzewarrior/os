// Menu Bar management system
// Handles menu interactions and status updates
import { showSettings } from './programs/settings.js';
import { Program, ProgramManager } from './program.js';
import { AboutProgram } from './programs/about.js';

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
    },
    'text-editor': {
        file: [
            { label: 'New', action: 'new-text-file' },
            { label: 'Save', action: 'save-text-file' },
            { separator: true },
            { label: 'Close', action: 'close-text-editor' }
        ],
        edit: [
            { label: 'Cut', action: 'cut-text' },
            { label: 'Copy', action: 'copy-text' },
            { label: 'Paste', action: 'paste-text' },
            { separator: true },
            { label: 'Select All', action: 'select-all-text' }
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
        { label: 'File Viewer', action: 'show-fileviewer' },
        { label: 'Text Editor', action: 'show-text-editor' }
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
    // Setup dock icon clicks - using WindowManager instances when available
    const dockIcons = document.querySelectorAll('.dock-item');
    dockIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const appId = this.id.replace('-dock-icon', '');
            
            // Check if there's a WindowManager instance for this app
            if (window.windowManagers && window.windowManagers[appId]) {
                // Use the WindowManager's show method
                window.windowManagers[appId].show();
            } else {
                // Fallback to the simple approach
                showApplication(appId);
            }
        });
    });
    
    // Setup window header clicks for focus
    document.querySelectorAll('.window-header').forEach(header => {
        header.addEventListener('mousedown', function() {
            const window = this.closest('.window-container');
            if (window && !window.classList.contains('minimized')) {
                const appId = window.id;
                
                // Use WindowManager if available
                if (window.windowManagers && window.windowManagers[appId]) {
                    window.windowManagers[appId].bringToFront();
                } else {
                    // Fallback to the simple approach
                    // Bring to front
                    document.querySelectorAll('.window-container').forEach(win => {
                        win.style.zIndex = '100';
                    });
                    window.style.zIndex = '101';
                    
                    // Set as active
                    setActiveWindow(appId);
                }
            }
        });
    });
    
    // Setup window controls (red button for minimize)
    document.querySelectorAll('.control.red').forEach(button => {
        button.addEventListener('click', function() {
            const window = this.closest('.window-container');
            if (window) {
                const appId = window.id;
                
                // Use WindowManager if available
                if (window.windowManagers && window.windowManagers[appId]) {
                    window.windowManagers[appId].minimize();
                } else {
                    // Fallback to the simple approach
                    window.classList.add('minimized');
                    
                    // Update dock icon
                    const dockIcon = document.getElementById(`${appId}-dock-icon`);
                    if (dockIcon) {
                        dockIcon.classList.remove('active');
                    }
                    
                    // Set desktop as active
                    setActiveWindow(DEFAULT_APP);
                }
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
    dropdown.style.width = '220px'; // Set explicit width
    dropdown.style.left = '0';
    dropdown.style.position = 'absolute';
    dropdown.style.top = '24px';
    dropdown.style.zIndex = '9999'; // Very high z-index
    dropdown.style.display = 'none'; // Initially hidden
    dropdown.style.backgroundColor = 'var(--menu-bar-bg)';
    dropdown.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    dropdown.style.backdropFilter = 'blur(10px)';
    dropdown.style.borderRadius = '0 0 5px 5px';
    
    // Add items to dropdown
    logoMenu.forEach(menuItem => {
        if (menuItem.separator) {
            const separator = document.createElement('div');
            separator.className = 'dropdown-separator';
            separator.style.height = '1px';
            separator.style.backgroundColor = 'rgba(255,255,255,0.2)';
            separator.style.margin = '5px 0';
            dropdown.appendChild(separator);
        } else {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = menuItem.label;
            item.dataset.action = menuItem.action;
            item.style.padding = '8px 15px';
            item.style.color = 'var(--menu-text)';
            item.style.cursor = 'pointer';
            item.style.whiteSpace = 'nowrap';
            
            // Add hover effect
            item.addEventListener('mouseover', function() {
                this.style.backgroundColor = 'var(--menu-hover)';
            });
            
            item.addEventListener('mouseout', function() {
                this.style.backgroundColor = '';
            });
            
            // Direct click handler to perform action immediately
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log(`Executing action: ${menuItem.action}`);
                handleMenuAction(menuItem.action);
                hideAllMenus(); // Hide menus after clicking
            });
            
            dropdown.appendChild(item);
        }
    });
    
    // Append dropdown to logo element
    newLogoElement.appendChild(dropdown);
    
    // Setup click handler for logo
    newLogoElement.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleLogoMenu();
    });
    
    // Setup all application menu dropdowns
    setupAppMenus();
    
    // Click outside to close menus
    document.addEventListener('click', function() {
        hideAllMenus();
    });
}

/**
 * Toggle the logo menu dropdown visibility
 */
function toggleLogoMenu() {
    const dropdown = document.querySelector('.menu-bar-logo .menu-dropdown');
    if (!dropdown) return;
    
    const isVisible = dropdown.style.display === 'block';
    
    // Hide all menus first
    hideAllMenus();
    
    // If it wasn't visible, show it
    if (!isVisible) {
        dropdown.style.display = 'block';
        document.querySelector('.menu-bar-logo').classList.add('active');
    }
}

/**
 * Setup all application menu dropdowns
 */
function setupAppMenus() {
    // Get all menu items
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        // Skip the app name item
        if (item.classList.contains('app-name')) return;
        
        // Clone to remove existing listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Create dropdown for this menu item
        const dropdown = document.createElement('div');
        dropdown.className = 'menu-dropdown';
        dropdown.style.width = 'auto';
        dropdown.style.minWidth = '180px';
        dropdown.style.position = 'absolute';
        dropdown.style.top = '24px';
        dropdown.style.left = '0';
        dropdown.style.zIndex = '9999';
        dropdown.style.display = 'none';
        dropdown.style.backgroundColor = 'var(--menu-bar-bg)';
        dropdown.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        dropdown.style.backdropFilter = 'blur(10px)';
        dropdown.style.borderRadius = '0 0 5px 5px';
        
        // Store the menu name
        const menuName = newItem.textContent.toLowerCase();
        
        // Add the dropdown to the menu item
        newItem.appendChild(dropdown);
        
        // Add click handler
        newItem.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleAppMenu(this);
        });
    });
    
    // Initially populate menus
    updateMenus();
}

/**
 * Toggle an application menu dropdown
 */
function toggleAppMenu(menuItem) {
    const dropdown = menuItem.querySelector('.menu-dropdown');
    if (!dropdown) return;
    
    const isVisible = dropdown.style.display === 'block';
    
    // Hide all menus first
    hideAllMenus();
    
    // If it wasn't visible, show it
    if (!isVisible) {
        dropdown.style.display = 'block';
        menuItem.classList.add('active');
    }
}

/**
 * Hide all menu dropdowns
 */
function hideAllMenus() {
    // Hide all dropdown menus
    document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
        dropdown.style.display = 'none';
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item, .menu-bar-logo').forEach(item => {
        item.classList.remove('active');
    });
}

/**
 * Set the active window and update the UI accordingly
 * @param {string} windowId - ID of the window to set as active
 */
export function setActiveWindow(windowId) {
    // If same window is already active, no need to change
    if (activeWindow === windowId) return;
    
    console.log(`Setting active window to: ${windowId}`);
    
    // Update active window state
    activeWindow = windowId;
    
    // Update app name in menu bar
    updateAppName();
    
    // Update active window indicators in DOM
    document.querySelectorAll('.window-container').forEach(window => {
        // Remove focused class from all windows
        window.classList.remove('window-focused');
        
        // Add focused class to active window
        if (window.id === windowId) {
            window.classList.add('window-focused');
        }
    });
    
    // Update the dock icons
    document.querySelectorAll('.dock-item').forEach(icon => {
        const appId = icon.id.replace('-dock-icon', '');
        
        // Remove active state from all dock icons
        icon.classList.remove('active');
        
        // Add active state to dock icon for active window
        if (appId === windowId && windowId !== DEFAULT_APP) {
            icon.classList.add('active');
        }
    });
    
    // Update menus for this application
    updateMenus();
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
        case 'text-editor':
            appName = "Text Editor";
            break;
    }
    
    appNameElement.textContent = appName;
}

/**
 * Update menus based on active window
 */
function updateMenus() {
    // Get all menu items
    const menuItems = document.querySelectorAll('.menu-item:not(.app-name)');
    
    // For each menu item, update its dropdown
    menuItems.forEach(item => {
        const menuName = item.textContent.toLowerCase();
        const dropdown = item.querySelector('.menu-dropdown');
        
        if (!dropdown) return;
        
        // Clear the dropdown
        dropdown.innerHTML = '';
        
        // Get menu items based on active window
        const menuItems = getMenuItemsForMenu(menuName);
        
        // Create menu items
        if (menuItems && menuItems.length > 0) {
            menuItems.forEach(menuItem => {
                if (menuItem.separator) {
                    const separator = document.createElement('div');
                    separator.className = 'dropdown-separator';
                    separator.style.height = '1px';
                    separator.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    separator.style.margin = '5px 0';
                    dropdown.appendChild(separator);
                } else {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'dropdown-item';
                    itemElement.textContent = menuItem.label;
                    itemElement.dataset.action = menuItem.action;
                    itemElement.style.padding = '8px 15px';
                    itemElement.style.color = 'var(--menu-text)';
                    itemElement.style.cursor = 'pointer';
                    itemElement.style.whiteSpace = 'nowrap';
                    
                    // Add hover effect
                    itemElement.addEventListener('mouseover', function() {
                        this.style.backgroundColor = 'var(--menu-hover)';
                    });
                    
                    itemElement.addEventListener('mouseout', function() {
                        this.style.backgroundColor = '';
                    });
                    
                    // Add click handler
                    itemElement.addEventListener('click', function(e) {
                        e.stopPropagation();
                        console.log(`Executing action: ${menuItem.action}`);
                        handleMenuAction(menuItem.action);
                        hideAllMenus();
                    });
                    
                    dropdown.appendChild(itemElement);
                }
            });
        } else {
            // If no items, add a disabled placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'dropdown-item disabled';
            placeholder.textContent = 'No actions available';
            placeholder.style.padding = '8px 15px';
            placeholder.style.color = 'var(--text-muted)';
            placeholder.style.opacity = '0.7';
            placeholder.style.pointerEvents = 'none';
            dropdown.appendChild(placeholder);
        }
    });
}

/**
 * Get menu items for a specific menu based on active window
 * @param {string} menuName - Name of the menu (file, edit, etc.)
 * @returns {Array} Array of menu items
 */
function getMenuItemsForMenu(menuName) {
    // Standard menus that are the same for all apps
    if (menuName === 'window') {
        return standardMenus.window;
    }
    
    // App-specific menus
    if (activeWindow && appMenus[activeWindow] && appMenus[activeWindow][menuName]) {
        return appMenus[activeWindow][menuName];
    }
    
    // Default app menus
    if (appMenus[DEFAULT_APP] && appMenus[DEFAULT_APP][menuName]) {
        return appMenus[DEFAULT_APP][menuName];
    }
    
    // Return empty array if no menu items found
    return [];
}

/**
 * Handle menu action
 * @param {string} action - The action to perform
 */
function handleMenuAction(action) {
    console.log(`Handling menu action: ${action}`);
    
    // Handle action based on the active window
    if (activeWindow === 'terminal') {
        handleTerminalAction(action);
    } else if (activeWindow === 'browser') {
        handleBrowserAction(action);
    } else if (activeWindow === 'mail') {
        handleMailAction(action);
    } else if (activeWindow === 'pdf-viewer') {
        handlePdfViewerAction(action);
    } else if (activeWindow === 'text-editor') {
        handleTextEditorAction(action);
    } else {
        // Common actions or desktop-specific actions
        switch (action) {
            case 'about':
                showAboutDialog();
                break;
            case 'settings':
                showSettings();
                break;
            case 'show-terminal':
                showApplication('terminal');
                break;
            case 'show-browser':
                showApplication('browser');
                break;
            case 'show-mail':
                showApplication('mail');
                break;
            case 'show-fileviewer':
                showApplication('pdf-viewer');
                break;
            case 'show-text-editor':
                showApplication('text-editor');
                break;
            case 'minimize-window':
                minimizeActiveWindow();
                break;
            case 'maximize-window':
                maximizeActiveWindow();
                break;
            default:
                console.log(`No handler for action: ${action}`);
                break;
        }
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
 * Handle text editor actions
 * @param {string} action - The action to perform
 */
function handleTextEditorAction(action) {
    console.log(`Handling text editor action: ${action}`);
    
    const textEditor = document.getElementById('text-editor');
    if (!textEditor) {
        console.error('Text editor not found');
        return;
    }
    
    switch (action) {
        case 'new-text-file':
            // Dispatch a custom event that our text editor can listen for
            textEditor.dispatchEvent(new CustomEvent('new-file'));
            break;
        case 'save-text-file':
            // Dispatch a custom event that our text editor can listen for
            textEditor.dispatchEvent(new CustomEvent('save-file'));
            break;
        case 'close-text-editor':
            textEditor.classList.add('minimized');
            break;
        case 'cut-text':
            document.execCommand('cut');
            break;
        case 'copy-text':
            document.execCommand('copy');
            break;
        case 'paste-text':
            document.execCommand('paste');
            break;
        case 'select-all-text':
            // Find the text editor textarea and select all text
            const textarea = textEditor.querySelector('textarea');
            if (textarea) {
                textarea.select();
            }
            break;
        default:
            console.log(`Unhandled text editor action: ${action}`);
            break;
    }
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
 * Show a specific application
 * @param {string} appId - ID of the application to show
 */
function showApplication(appId) {
    console.log(`Showing application: ${appId}`);
    
    // Check if a WindowManager instance exists for this app
    if (window.windowManagers && window.windowManagers[appId]) {
        // Use the WindowManager instance to show the window
        window.windowManagers[appId].show();
        return;
    }
    
    // Fallback to direct DOM manipulation if no WindowManager is available
    const element = document.getElementById(appId);
    if (!element) {
        console.error(`Application element not found: ${appId}`);
        return;
    }
    
    // Show the application window
    element.classList.remove('minimized');
    
    // Set it as the active window
    setActiveWindow(appId);
    
    // Update dock icon if it exists
    const dockIcon = document.getElementById(`${appId}-dock-icon`);
    if (dockIcon) {
        dockIcon.classList.add('active');
    }
    
    // Special handling for certain apps
    if (appId === 'text-editor') {
        // For text editor, if no file is open, create a new one
        const textEditorContent = element.querySelector('.text-editor-content');
        if (textEditorContent && !textEditorContent.textContent.trim()) {
            // This will be handled by the text editor's internal logic
            element.dispatchEvent(new CustomEvent('new-file'));
        }
    }
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
 * Force refresh the entire UI
 * This is useful for fixing visual state issues
 */
export function refreshUserInterface() {
    console.log('Forcing UI refresh...');
    
    // Hide all menus
    hideAllMenus();
    
    // Restore saved theme
    const savedTheme = localStorage.getItem('theme');
    const themeToApply = savedTheme === 'dark' ? 'dark' : 'light';
    document.body.classList.toggle('dark-theme', themeToApply === 'dark');
    
    // Restore saved font size
    const savedFontSize = localStorage.getItem('font-size') || '13';
    document.documentElement.style.setProperty('--base-font-size', `${savedFontSize}px`);
    
    // Restore saved wallpaper
    const defaultWallpaper = 'img/wallpapers/gradient.jpg';
    const savedWallpaper = localStorage.getItem('background') || defaultWallpaper;
    document.body.style.backgroundImage = `url('${savedWallpaper}')`;
    document.body.style.setProperty('background-image', `url('${savedWallpaper}')`, 'important');
    
    // Ensure all dock icons are clickable
    document.querySelectorAll('.dock-item').forEach(icon => {
        icon.style.pointerEvents = 'auto';
        icon.style.cursor = 'pointer';
        icon.style.position = 'relative';
        icon.style.zIndex = '9999';
        
        // Make sure images inside don't block clicks
        const img = icon.querySelector('img');
        if (img) {
            img.style.pointerEvents = 'none';
        }
    });
    
    // Ensure menu bar items are clickable
    document.querySelectorAll('.menu-item, .menu-bar-logo').forEach(item => {
        item.style.pointerEvents = 'auto';
        item.style.cursor = 'pointer';
    });
    
    // Ensure windows have proper z-index
    document.querySelectorAll('.window-container').forEach(win => {
        if (!win.classList.contains('minimized')) {
            win.style.zIndex = win.classList.contains('window-focused') ? '201' : '200';
        }
    });
    
    // Re-update the active window state
    updateMenus();
    
    console.log('UI refresh complete!');
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