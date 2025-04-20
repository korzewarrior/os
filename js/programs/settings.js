// Settings application
import { createWindowManager } from '../window-manager.js';
import { Program, ProgramManager } from '../program.js';

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
    // Return the list generated by the terminal command
    return ["gradient.jpg","field.jpg","bliss.jpg","fuji.png","cloud.png"];
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

// --- SettingsProgram Class --- 
class SettingsProgram extends Program {
    static BASE_ID = 'settings';
    static DEFAULT_TITLE = 'System Preferences';

    constructor(instanceId, options = {}) {
        super(instanceId, SettingsProgram.DEFAULT_TITLE, SettingsProgram.BASE_ID, 700, 500);
        this.initialized = false;
        // No specific controller needed, logic is within methods
    }

    // Override createWindowElement to add settings structure
    createWindowElement() {
        const windowElement = super.createWindowElement();
        const contentArea = windowElement.querySelector('.window-content');
        if (!contentArea) return windowElement;

        // Add settings specific class and structure
        contentArea.classList.add('settings-content'); 
        contentArea.innerHTML = `
             <div class="settings-sidebar">
                <div class="settings-category active" data-panel="appearance-panel">
                    <svg><!-- Appearance Icon --></svg><span>Appearance</span>
                </div>
                <div class="settings-category" data-panel="desktop-panel">
                     <svg><!-- Desktop Icon --></svg><span>Desktop</span>
                </div>
                 <div class="settings-category" data-panel="about-panel">
                     <svg><!-- About Icon --></svg><span>About</span>
                 </div>
             </div>
             <div class="settings-panels">
                 <!-- Appearance Panel -->
                 <div id="appearance-panel" class="settings-panel active">
                    <h2>Appearance</h2>
                    <div class="settings-group">
                        <h3>Theme</h3>
                        <div class="setting-item">
                            <label for="theme-toggle-${this.instanceId}" class="toggle-label">
                                 <span>[Dark | Light]</span>
                                 <div class="toggle-switch">
                                     <input type="checkbox" id="theme-toggle-${this.instanceId}">
                                     <span class="toggle-slider"></span>
                                 </div>
                            </label>
                        </div>
                    </div>
                     <div class="settings-group">
                         <h3>Font Size</h3>
                         <div class="setting-item">
                             <label for="font-size-slider-${this.instanceId}">UI Font Size</label>
                             <input type="range" id="font-size-slider-${this.instanceId}" min="12" max="18" value="13">
                             <span id="font-size-value-${this.instanceId}">13px</span>
                         </div>
                     </div>
                 </div>
                 <!-- Desktop Panel -->
                 <div id="desktop-panel" class="settings-panel">
                    <h2>Desktop</h2>
                    <div class="settings-group">
                        <h3>Background</h3>
                        <div class="background-options"></div>
                    </div>
                 </div>
                 <!-- About Panel -->
                 <div id="about-panel" class="settings-panel">
                     <div class="about-content">
                        <div class="about-logo">
                             <svg><!-- Logo --></svg>
                         </div>
                         <h2>korzeOS</h2>
                         <p class="version">Version 1.0</p>
                         <p>...</p>
                         <div class="system-info">
                             <h3>System Information</h3>
                             <div class="info-row"><span class="info-label">Browser:</span><span class="info-value" id="browser-info-${this.instanceId}">-</span></div>
                             <div class="info-row"><span class="info-label">Resolution:</span><span class="info-value" id="resolution-info-${this.instanceId}">-</span></div>
                             </div>
                     </div>
                 </div>
             </div>
        `;
        // Add base styles for settings content
        contentArea.style.display = 'flex';

        // Add SVGs back (omitted for brevity)
        this.addSvgsToElements(windowElement);

        return windowElement;
    }
    
     addSvgsToElements(windowElement) {
         // Add SVGs here using querySelector within windowElement
         // e.g., windowElement.querySelector('[data-panel="appearance-panel"] svg').innerHTML = '<path ...>';
     }

    async init() {
        if (this.initialized) return;
        await super.init();
        console.log(`[SettingsProgram ${this.instanceId}] Initializing...`);
        
        // Add listeners specific to this instance's elements
        this.setupInstanceUI();
        
        this.initialized = true;
        console.log(`[SettingsProgram ${this.instanceId}] Initialization complete.`);
    }
    
    // Setup UI interactions scoped to this window instance
    setupInstanceUI() {
        const categories = this.windowElement.querySelectorAll('.settings-category');
        const panels = this.windowElement.querySelectorAll('.settings-panel');

        categories.forEach(category => {
            category.addEventListener('click', () => {
                categories.forEach(c => c.classList.remove('active'));
                category.classList.add('active');
                const targetPanelId = category.getAttribute('data-panel');
                panels.forEach(panel => {
                    panel.classList.toggle('active', panel.id === targetPanelId);
                });
            });
        });

        this.setupThemeToggleInstance();
        this.setupFontSizeSliderInstance();
        this.loadAndSetupWallpapersInstance();
        this.populateAboutPanelInfoInstance();
    }

    setupThemeToggleInstance() {
        const themeToggle = this.windowElement.querySelector(`#theme-toggle-${this.instanceId}`);
        if (!themeToggle) return;
        
        const savedTheme = localStorage.getItem('theme') || 'light';
        themeToggle.checked = savedTheme === 'light';
        // Initial apply is handled globally on load
        
        themeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-theme', !this.checked);
            localStorage.setItem('theme', this.checked ? 'light' : 'dark');
            console.log(`Theme changed to: ${this.checked ? 'light' : 'dark'}`);
        });
    }

    setupFontSizeSliderInstance() {
        const slider = this.windowElement.querySelector(`#font-size-slider-${this.instanceId}`);
        const valueDisplay = this.windowElement.querySelector(`#font-size-value-${this.instanceId}`);
        if (!slider || !valueDisplay) return;

        const savedSize = localStorage.getItem('font-size') || '13';
        slider.value = savedSize;
        valueDisplay.textContent = `${savedSize}px`;
        // Initial apply is handled globally
        
        slider.addEventListener('input', function() {
            const newSize = this.value;
            valueDisplay.textContent = `${newSize}px`;
            applyFontSize(newSize); // Use helper function
            localStorage.setItem('font-size', newSize);
        });
    }

    async loadAndSetupWallpapersInstance() {
        const wallpaperContainer = this.windowElement.querySelector('.background-options');
        if (!wallpaperContainer) return;
        wallpaperContainer.innerHTML = ''; 
        try {
            const wallpapers = await getAvailableWallpapers();
            const defaultWallpaper = 'img/wallpapers/gradient.jpg'; 
            const savedBg = localStorage.getItem('background') || defaultWallpaper;

            wallpapers.forEach(wallpaper => {
                const wallpaperPath = `img/wallpapers/${wallpaper}`;
                const isSelected = savedBg === wallpaperPath;
                const option = document.createElement('div');
                option.className = `background-option${isSelected ? ' selected' : ''}`;
                option.dataset.bg = wallpaperPath;
                
                const name = wallpaper.substring(0, wallpaper.lastIndexOf('.') || wallpaper.length);
                // Use the full wallpaper path for the image source directly
                option.innerHTML = `<img src="${wallpaperPath}" alt="${name}"><span>${name.charAt(0).toUpperCase() + name.slice(1)}</span>`;
                
                option.addEventListener('click', () => {
                    applyWallpaper(wallpaperPath);
                    localStorage.setItem('background', wallpaperPath);
                    this.windowElement.querySelectorAll('.background-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                });
                wallpaperContainer.appendChild(option);
            });
            
            // Ensure default is selected if saved one isn't found
             if (!wallpaperContainer.querySelector('.background-option.selected')) {
                 const defaultOption = wallpaperContainer.querySelector(`.background-option[data-bg="${defaultWallpaper}"]`);
                 if (defaultOption) defaultOption.classList.add('selected');
             }
        } catch (error) { console.error('Error loading wallpapers:', error); }
    }
    
    populateAboutPanelInfoInstance() {
        // Find elements using instance ID
        const browserInfo = this.windowElement.querySelector(`#browser-info-${this.instanceId}`);
        const resolutionInfo = this.windowElement.querySelector(`#resolution-info-${this.instanceId}`);
        const userAgentInfo = this.windowElement.querySelector(`#user-agent-info-${this.instanceId}`); 
        const dateTimeInfo = this.windowElement.querySelector(`#date-time-info-${this.instanceId}`);
        
        // Browser Name Logic (copied from previous version)
        if (browserInfo) {
            const userAgent = navigator.userAgent;
            let browserName = "Unknown Browser";
            if (userAgent.indexOf("Firefox") > -1) browserName = "Mozilla Firefox";
            else if (userAgent.indexOf("Edg") > -1) browserName = "Microsoft Edge"; // Updated check for Edge
            else if (userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Safari") > -1) browserName = "Google Chrome";
            else if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) browserName = "Apple Safari";
            else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) browserName = "Opera";
            browserInfo.textContent = browserName;
         }
         
        if (resolutionInfo) resolutionInfo.textContent = `${window.screen.width} × ${window.screen.height}`;
        
        // User Agent
        if (userAgentInfo) {
             userAgentInfo.textContent = navigator.userAgent || 'N/A';
        }
        
        // Date & Time
        if (dateTimeInfo) {
            dateTimeInfo.textContent = new Date().toLocaleString();
        }
        
        console.log(`[SettingsProgram ${this.instanceId}] Populated About panel info.`);
    }
}

// Register the Settings Program
ProgramManager.register(SettingsProgram);

// REMOVE old compatibility export
// export function showSettings() { ... } 