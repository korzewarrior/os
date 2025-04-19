// Browser implementation
import { createWindowManager } from '../window-manager.js';

// Global reference to browser window manager
let browserWindow;

// Export the initialization function instead of using DOMContentLoaded
export function initializeBrowser() {
    console.log('Browser module initializing...');
    
    const urlInput = document.getElementById('url-input');
    const browserDisplay = document.getElementById('browser-display');
    const backButton = document.querySelector('.back-button');
    const forwardButton = document.querySelector('.forward-button');
    const refreshButton = document.querySelector('.refresh-button');
    
    // Initialize window manager for browser
    // REMOVED: browserWindow = createWindowManager('browser', { ... });
    // The window manager is already created globally in script.js
    
    // Browser history
    const history = [];
    let currentHistoryIndex = -1;
    
    // Navigate to a URL
    function navigateTo(url) {
        // Normalize URL (add https if missing)
        if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
        }
        
        try {
            // In a real implementation, we would load the URL in an iframe
            // For this demo, we'll simulate browser behavior
            
            // Add to history
            if (currentHistoryIndex < history.length - 1) {
                // If we navigated back and now navigating to a new URL, truncate history
                history.splice(currentHistoryIndex + 1);
            }
            
            history.push(url);
            currentHistoryIndex = history.length - 1;
            
            // Update URL in address bar
            urlInput.value = url;
            
            // Update browser content
            simulateBrowserContent(url);
            
            // Update navigation buttons
            updateNavigationButtons();
        } catch (error) {
            console.error('Navigation error:', error);
            browserDisplay.innerHTML = `
                <div class="browser-error">
                    <h2>Unable to load URL</h2>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    // Simulate browser content
    function simulateBrowserContent(url) {
        // For demonstration purposes, create a simulated page based on URL
        let content = '';
        
        // Extract domain for display
        const domain = url.replace(/^https?:\/\//i, '').split('/')[0];
        
        if (url.includes('github.com')) {
            content = `
                <div class="simulated-page github">
                    <div class="browser-header-bar">
                        <img src="https://github.githubassets.com/favicons/favicon.svg" class="site-icon">
                        <span>${domain}</span>
                    </div>
                    <div class="browser-page-content">
                        <h1>GitHub</h1>
                        <p>Welcome to GitHub - where the world builds software.</p>
                        <div class="repo-list">
                            <div class="repo">
                                <h3>example/repo1</h3>
                                <p>A sample repository</p>
                            </div>
                            <div class="repo">
                                <h3>example/repo2</h3>
                                <p>Another sample repository</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (url.includes('google.com')) {
            content = `
                <div class="simulated-page google">
                    <div class="browser-header-bar">
                        <img src="https://www.google.com/favicon.ico" class="site-icon">
                        <span>${domain}</span>
                    </div>
                    <div class="browser-page-content">
                        <div class="google-logo">Google</div>
                        <div class="search-bar">
                            <input type="text" placeholder="Search Google">
                            <button>Search</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (url.includes('developer.mozilla.org')) {
            content = `
                <div class="simulated-page mdn">
                    <div class="browser-header-bar">
                        <img src="https://developer.mozilla.org/favicon-48x48.png" class="site-icon">
                        <span>${domain}</span>
                    </div>
                    <div class="browser-page-content">
                        <h1>MDN Web Docs</h1>
                        <p>Resources for developers, by developers.</p>
                        <div class="mdn-content">
                            <h2>Web Technologies</h2>
                            <ul>
                                <li>HTML</li>
                                <li>CSS</li>
                                <li>JavaScript</li>
                                <li>Web APIs</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content = `
                <div class="simulated-page generic">
                    <div class="browser-header-bar">
                        <span>${domain}</span>
                    </div>
                    <div class="browser-page-content">
                        <h1>${domain}</h1>
                        <p>This is a simulated view of ${url}</p>
                        <div class="sample-content">
                            <h2>Sample Page Content</h2>
                            <p>In a real browser, this would display the actual webpage content.</p>
                            <p>For this demo, we're showing a placeholder for ${url}.</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        browserDisplay.innerHTML = content;
    }
    
    // Update navigation buttons state
    function updateNavigationButtons() {
        backButton.disabled = currentHistoryIndex <= 0;
        forwardButton.disabled = currentHistoryIndex >= history.length - 1;
    }
    
    // Navigation button event handlers
    backButton.addEventListener('click', () => {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            urlInput.value = history[currentHistoryIndex];
            simulateBrowserContent(history[currentHistoryIndex]);
            updateNavigationButtons();
        }
    });
    
    forwardButton.addEventListener('click', () => {
        if (currentHistoryIndex < history.length - 1) {
            currentHistoryIndex++;
            urlInput.value = history[currentHistoryIndex];
            simulateBrowserContent(history[currentHistoryIndex]);
            updateNavigationButtons();
        }
    });
    
    refreshButton.addEventListener('click', () => {
        if (history.length > 0) {
            simulateBrowserContent(history[currentHistoryIndex]);
        }
    });
    
    // URL input event handler
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            navigateTo(urlInput.value);
        }
    });
    
    // Set up bookmark clicks
    document.querySelectorAll('.bookmark').forEach(bookmark => {
        bookmark.addEventListener('click', () => {
            navigateTo(bookmark.dataset.url);
        });
    });
    
    // Handle browser resizing
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            // Adjust any internal elements that need to respond to browser resizing
            const browserContent = entry.target.querySelector('.browser-content');
            if (browserContent) {
                // Adjust height to fill available space
                const headerHeight = entry.target.querySelector('.browser-header').offsetHeight;
                const toolbarHeight = entry.target.querySelector('.browser-toolbar').offsetHeight;
                browserContent.style.height = `calc(100% - ${headerHeight + toolbarHeight}px)`;
            }
        }
    });

    // Start observing the browser container
    const browserContainer = document.getElementById('browser');
    if (browserContainer) {
        resizeObserver.observe(browserContainer);
    }
    
    // Return browser controller for possible external use
    return {
        navigateTo
    };
} 