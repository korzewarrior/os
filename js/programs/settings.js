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
    settingsWindow = createWindowManager('settings', {
        initialWidth: '700px',
        initialHeight: '500px',
        minimized: true,
        onMinimize: () => console.log('Settings minimized'),
        onMaximize: () => console.log('Settings maximized'),
        onRestore: () => console.log('Settings restored')
    });
    
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
    
    // Setup theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('light-theme', themeToggle.checked);
            localStorage.setItem('theme', themeToggle.checked ? 'light' : 'dark');
        });
        
        // Initialize theme from localStorage if available
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            const isLightTheme = savedTheme === 'light';
            themeToggle.checked = isLightTheme;
            document.body.classList.toggle('light-theme', isLightTheme);
        }
    }
    
    // Setup dynamic wallpaper loader
    loadAndSetupWallpapers();
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
 * Show the settings application
 */
export function showSettings() {
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
    if (settingsWindow) {
        const settingsElement = document.getElementById('settings');
        if (settingsElement) {
            settingsElement.classList.add('minimized');
        }
    }
} 