// Main script file - Entry point
import { initializeTerminal } from './programs/terminal.js';
import { initializeBrowser } from './programs/browser.js';
import { initializeMail, showMailApp } from './programs/mail.js';
import { initializeFileViewer, showFileViewer } from './programs/file-viewer.js';
import { initializeSettings, showSettings } from './programs/settings.js';
import { createWindowManager } from './window-manager.js';
import { initializeDesktop } from './desktop.js';
import { initializeMenuBar } from './menu-bar.js';
import { Program, ProgramManager } from './program.js';
import { initializeDebug, autoRepair } from './debug.js';

// Make Program and ProgramManager globally available
window.Program = Program;
window.ProgramManager = ProgramManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing OS...');
    
    // Apply saved wallpaper if available
    applyInitialWallpaper();
    
    // Initialize all applications with the unified window manager
    function initializeApplications() {
        // Create window managers for all windows
        // Note: These window managers are created here for initialization,
        // but each app also maintains its own reference to its window manager
        // for internal use.
        const terminalWindow = createWindowManager('terminal', {
            initialWidth: '800px',
            initialHeight: '500px',
            minimized: true,
            onMinimize: () => console.log('Terminal minimized'),
            onMaximize: () => console.log('Terminal maximized'),
            onRestore: () => console.log('Terminal restored')
        });
        
        const browserWindow = createWindowManager('browser', {
            initialWidth: '900px',
            initialHeight: '600px',
            minimized: true,
            onMinimize: () => console.log('Browser minimized'),
            onMaximize: () => console.log('Browser maximized'),
            onRestore: () => console.log('Browser restored')
        });
        
        const settingsWindow = createWindowManager('settings', {
            initialWidth: '700px',
            initialHeight: '500px',
            minimized: true,
            onMinimize: () => console.log('Settings minimized'),
            onMaximize: () => console.log('Settings maximized'),
            onRestore: () => console.log('Settings restored')
        });
        
        // Initialize applications
        initializeTerminal();
        initializeBrowser();
        initializeMail();
        initializeFileViewer();
        initializeSettings();
        initializeDesktop();
        initializeMenuBar();
        
        // Setup dock icon click handlers
        setupDockIcons();
        
        // Setup triangle visualization for resize handles
        enhanceResizeHandles();
        
        // Initialize system info in settings
        updateSystemInfo();
        
        // Initialize debug tools
        initializeDebug();
        
        // Show the terminal briefly then hide it to ensure proper initialization
        setTimeout(() => {
            const terminal = document.getElementById('terminal');
            if (terminal) {
                terminal.classList.remove('minimized');
                setTimeout(() => {
                    terminal.classList.add('minimized');
                }, 50);
            }
        }, 100);
    }
    
    // Apply the saved wallpaper or default on initial load
    function applyInitialWallpaper() {
        // Default wallpaper path
        const defaultWallpaper = 'img/wallpapers/gradient.jpg';
        
        // Get saved background or use default
        const savedBg = localStorage.getItem('background') || defaultWallpaper;
        
        console.log('Applying initial wallpaper:', savedBg);
        
        // Set background directly to ensure it applies before components are initialized
        document.body.style.backgroundImage = `url('${savedBg}')`;
        document.body.style.setProperty('background-image', `url('${savedBg}')`, 'important');
    }
    
    // Setup dock icon click handlers
    function setupDockIcons() {
        // Terminal dock icon
        const terminalDockIcon = document.getElementById('terminal-dock-icon');
        const terminal = document.getElementById('terminal');
        if (terminalDockIcon && terminal) {
            terminalDockIcon.addEventListener('click', () => {
                terminal.classList.remove('minimized');
                terminalDockIcon.classList.add('active');
            });
            
            // Add event listener to update active state when window is minimized
            terminal.addEventListener('click', (e) => {
                if (e.target.classList.contains('red') || e.target.classList.contains('yellow')) {
                    terminalDockIcon.classList.remove('active');
                }
            });
        }
        
        // Browser dock icon
        const browserDockIcon = document.getElementById('browser-dock-icon');
        const browser = document.getElementById('browser');
        if (browserDockIcon && browser) {
            browserDockIcon.addEventListener('click', () => {
                browser.classList.remove('minimized');
                browserDockIcon.classList.add('active');
            });
            
            // Add event listener to update active state when window is minimized
            browser.addEventListener('click', (e) => {
                if (e.target.classList.contains('red') || e.target.classList.contains('yellow')) {
                    browserDockIcon.classList.remove('active');
                }
            });
        }
        
        // Mail dock icon
        const mailDockIcon = document.getElementById('mail-dock-icon');
        const mail = document.getElementById('mail');
        if (mailDockIcon && mail) {
            mailDockIcon.addEventListener('click', () => {
                showMailApp();
                mailDockIcon.classList.add('active');
            });
            
            // Add event listener to update active state when window is minimized
            mail.addEventListener('click', (e) => {
                if (e.target.classList.contains('red') || e.target.classList.contains('yellow')) {
                    mailDockIcon.classList.remove('active');
                }
            });
        }
        
        // PDF Viewer dock icon
        const pdfViewerDockIcon = document.getElementById('pdf-viewer-dock-icon');
        const pdfViewer = document.getElementById('pdf-viewer');
        if (pdfViewerDockIcon && pdfViewer) {
            pdfViewerDockIcon.addEventListener('click', () => {
                showFileViewer();
                pdfViewerDockIcon.classList.add('active');
            });
            
            // Add event listener to update active state when window is minimized
            pdfViewer.addEventListener('click', (e) => {
                if (e.target.classList.contains('red') || e.target.classList.contains('yellow')) {
                    pdfViewerDockIcon.classList.remove('active');
                }
            });
        }
        
        // Settings dock icon
        const settingsDockIcon = document.getElementById('settings-dock-icon');
        const settings = document.getElementById('settings');
        if (settingsDockIcon && settings) {
            settingsDockIcon.addEventListener('click', () => {
                showSettings();
                settingsDockIcon.classList.add('active');
            });
            
            // Add event listener to update active state when window is minimized
            settings.addEventListener('click', (e) => {
                if (e.target.classList.contains('red') || e.target.classList.contains('yellow')) {
                    settingsDockIcon.classList.remove('active');
                }
            });
        }
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
    
    // Initialize the OS
    initializeApplications();
}); 