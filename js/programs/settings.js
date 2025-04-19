// Settings application
import { createWindowManager } from '../window-manager.js';

// Global reference to settings window manager
let settingsWindow;

/**
 * Initialize the settings application
 */
export function initializeSettings() {
    console.log('Settings app initializing...');
    
    // Initialize the settings window manager
    // REMOVED: settingsWindow = createWindowManager('settings', { ... });
    // The window manager is already created globally in script.js

    // Setup settings UI interactions
    setupSettingsUI();
    
    return {
        showSettings,
        hideSettings
    };
}

/**
 * Setup the settings UI interactions
 */
function setupSettingsUI() {
    const settingsContainer = document.getElementById('settings');
    if (!settingsContainer) return;
    
    // Setup category navigation
    const categories = settingsContainer.querySelectorAll('.settings-category');
    const panels = settingsContainer.querySelectorAll('.settings-panel');
    
    categories.forEach(category => {
        category.addEventListener('click', () => {
            // Remove active class from all categories
            categories.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked category
            category.classList.add('active');
            
            // Show the corresponding panel
            const targetPanel = category.getAttribute('data-panel');
            panels.forEach(panel => {
                if (panel.id === targetPanel) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            });
        });
    });
    
    // Setup theme toggle - FIXED IMPLEMENTATION
    setupThemeToggle();
    
    // Setup font size slider - FIXED IMPLEMENTATION
    setupFontSizeSlider();
    
    // Setup dynamic wallpaper loader
    loadAndSetupWallpapers();

    // Populate the About panel info
    populateAboutPanelInfo();
}

/**
 * Setup theme toggle with proper event handling
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) {
        console.error('Theme toggle not found in DOM');
        return;
    }
    
    // REMOVED: Remove any existing listeners to avoid duplicates
    // const newThemeToggle = themeToggle.cloneNode(true);
    // themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);
    
    // Add proper event listener directly to the original element
    themeToggle.addEventListener('change', function() {
        // Toggle the dark-theme class based on toggle state
        // When checked, it's LIGHT mode (no dark-theme class)
        // When unchecked, it's DARK mode (has dark-theme class)
        document.body.classList.toggle('dark-theme', !this.checked);
        
        // Save preference in localStorage
        localStorage.setItem('theme', this.checked ? 'light' : 'dark');
        
        // Log the theme change
        console.log(`Theme changed to: ${this.checked ? 'light' : 'dark'}`);
    });
    
    // Initialize theme from localStorage if available
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        const isLightTheme = savedTheme === 'light';
        themeToggle.checked = isLightTheme; // Use original element
        document.body.classList.toggle('dark-theme', !isLightTheme);
    } else {
        // Default to light theme if nothing is saved
        themeToggle.checked = true; // Use original element
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    }
}

/**
 * Setup font size slider with proper event handling
 */
function setupFontSizeSlider() {
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeValue = document.getElementById('font-size-value');
    
    if (!fontSizeSlider || !fontSizeValue) {
        console.error('Font size slider or value display not found in DOM');
        return;
    }
    
    // REMOVED: Remove any existing listeners to avoid duplicates
    // const newFontSizeSlider = fontSizeSlider.cloneNode(true);
    // fontSizeSlider.parentNode.replaceChild(newFontSizeSlider, fontSizeSlider);
    
    // Apply saved font size if available
    const savedFontSize = localStorage.getItem('font-size') || '13';
    
    // Update the slider and display value
    fontSizeSlider.value = savedFontSize; // Use original element
    fontSizeValue.textContent = `${savedFontSize}px`;
    
    // Apply the font size
    applyFontSize(savedFontSize);
    
    // Add event listener for slider changes directly to the original element
    fontSizeSlider.addEventListener('input', function() {
        const newSize = this.value;
        fontSizeValue.textContent = `${newSize}px`;
        applyFontSize(newSize);
        localStorage.setItem('font-size', newSize);
    });
}

/**
 * Apply font size to the entire application
 * @param {string|number} size - Font size in pixels
 */
function applyFontSize(size) {
    // Ensure size is a number
    const fontSize = parseInt(size, 10);
    
    // Set the CSS variable for the root element
    document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);
    
    // Log the change
    console.log(`Font size changed to: ${fontSize}px`);
}

/**
 * Dynamically load wallpapers from the server and set up the UI
 */
async function loadAndSetupWallpapers() {
    try {
        const wallpaperContainer = document.querySelector('.background-options');
        if (!wallpaperContainer) {
            console.error('Background options container not found');
            return;
        }
        
        // Clear any existing wallpaper options
        wallpaperContainer.innerHTML = '';
        
        // Fetch available wallpapers
        const wallpapers = await getAvailableWallpapers();
        console.log('Found wallpapers:', wallpapers);
        
        if (wallpapers.length === 0) {
            wallpaperContainer.innerHTML = '<p>No wallpapers available</p>';
            return;
        }
        
        // Default wallpaper path
        const defaultWallpaper = 'img/wallpapers/gradient.jpg';
        
        // Get the saved background or use default
        const savedBg = localStorage.getItem('background') || defaultWallpaper;
        
        // Apply the current background
        applyWallpaper(savedBg);
        
        // Create wallpaper options
        wallpapers.forEach(wallpaper => {
            const wallpaperPath = `img/wallpapers/${wallpaper}`;
            const isSelected = savedBg === wallpaperPath;
            
            const option = document.createElement('div');
            option.className = `background-option${isSelected ? ' selected' : ''}`;
            option.setAttribute('data-bg', wallpaperPath);
            
            const img = document.createElement('img');
            img.src = wallpaperPath;
            img.alt = wallpaper.replace(/\.[^/.]+$/, ""); // Remove file extension for alt text
            
            const span = document.createElement('span');
            span.textContent = wallpaper.replace(/\.[^/.]+$/, "").charAt(0).toUpperCase() + 
                               wallpaper.replace(/\.[^/.]+$/, "").slice(1); // Capitalize first letter
            
            option.appendChild(img);
            option.appendChild(span);
            
            // Add click handler
            option.addEventListener('click', () => {
                console.log(`Setting wallpaper to: ${wallpaperPath}`);
                applyWallpaper(wallpaperPath);
                localStorage.setItem('background', wallpaperPath);
                
                // Update selection
                document.querySelectorAll('.background-option').forEach(o => {
                    o.classList.remove('selected');
                });
                option.classList.add('selected');
            });
            
            wallpaperContainer.appendChild(option);
        });
        
        // If there was no saved background or it wasn't found in the available wallpapers,
        // select the default (gradient.jpg) as selected
        if (!document.querySelector('.background-option.selected')) {
            const defaultOption = document.querySelector(`.background-option[data-bg="${defaultWallpaper}"]`);
            if (defaultOption) {
                defaultOption.classList.add('selected');
                applyWallpaper(defaultWallpaper);
                localStorage.setItem('background', defaultWallpaper);
            }
        }
        console.log('Wallpaper setup complete.');
    } catch (error) {
        console.error('Error loading wallpapers:', error);
    }
}

/**
 * Apply wallpaper to the body background
 * @param {string} wallpaperPath - Path to the wallpaper image
 */
function applyWallpaper(wallpaperPath) {
    console.log(`Applying wallpaper: ${wallpaperPath}`);
    
    // Use both methods to ensure compatibility
    document.body.style.backgroundImage = `url('${wallpaperPath}')`;
    document.body.style.setProperty('background-image', `url('${wallpaperPath}')`, 'important');
    
    // Also update CSS variable if needed for components that might use it
    document.documentElement.style.setProperty('--current-wallpaper', `url('${wallpaperPath}')`);
}

/**
 * Get available wallpapers from the server
 * @returns {Promise<string[]>} Array of wallpaper filenames
 */
async function getAvailableWallpapers() {
    try {
        // In a real application, this would fetch from the server
        // For this implementation, we'll use a hardcoded list of the ones we know exist
        const wallpapers = ["gradient.jpg", "field.jpg", "fuji.png", "bliss.jpg"];
        
        // Simulate a delay like a real server request would have
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return wallpapers;
    } catch (error) {
        console.error('Error fetching wallpapers:', error);
        return [];
    }
}

/**
 * Populates the About panel with relevant system/browser info.
 */
function populateAboutPanelInfo() {
    console.log('Populating About panel info...');
    // Get elements within the #about-panel
    const aboutPanel = document.getElementById('about-panel');
    if (!aboutPanel) {
        console.error('About panel not found in DOM');
        return;
    }

    const browserInfoEl = aboutPanel.querySelector('#browser-info');
    const resolutionInfoEl = aboutPanel.querySelector('#resolution-info');
    const userAgentInfoEl = aboutPanel.querySelector('#user-agent-info'); // Assuming an ID exists or we add it
    const dateTimeEl = aboutPanel.querySelector('#date-time-info');       // Assuming an ID exists or we add it

    // Browser info
    if (browserInfoEl) {
        const userAgent = navigator.userAgent;
        let browserName = "Unknown Browser";
        if (userAgent.indexOf("Firefox") > -1) browserName = "Mozilla Firefox";
        else if (userAgent.indexOf("Edg") > -1) browserName = "Microsoft Edge";
        else if (userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Safari") > -1) browserName = "Google Chrome";
        else if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) browserName = "Apple Safari";
        else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) browserName = "Opera";
        browserInfoEl.textContent = browserName;
    }
    
    // Screen resolution
    if (resolutionInfoEl) {
        resolutionInfoEl.textContent = `${window.screen.width} × ${window.screen.height}`;
    }

    // User Agent
    if (userAgentInfoEl) {
        userAgentInfoEl.textContent = navigator.userAgent || 'N/A';
    }

    // Date & Time
    if (dateTimeEl) {
        dateTimeEl.textContent = new Date().toLocaleString();
    }
}

/**
 * Show the settings application
 */
export function showSettings() {
    const settingsWindow = window.windowManagers ? window.windowManagers['settings'] : null;
    if (settingsWindow) {
        settingsWindow.show();
    } else {
        console.error('Settings window not initialized');
    }
}

/**
 * Hide the settings application
 */
export function hideSettings() {
    const settingsWindow = window.windowManagers ? window.windowManagers['settings'] : null;
    if (settingsWindow) {
        const settingsElement = document.getElementById('settings');
        if (settingsElement) {
            settingsElement.classList.add('minimized');
        }
    }
} 