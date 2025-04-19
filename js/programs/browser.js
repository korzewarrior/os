// Browser implementation
import { createWindowManager } from '../window-manager.js';

// Global reference to browser window manager
let browserWindow;

// Export the initialization function instead of using DOMContentLoaded
export function initializeBrowser() {
    console.log('Browser module initializing...');
    
    const browserContainer = document.getElementById('browser');
    const urlInput = document.getElementById('url-input');
    const browserDisplayArea = document.getElementById('browser-display'); // Area holding home or iframe
    const backButton = browserContainer.querySelector('.back-button');
    const forwardButton = browserContainer.querySelector('.forward-button');
    const refreshButton = browserContainer.querySelector('.refresh-button');
    const homeButton = browserContainer.querySelector('.home-button'); // Get home button
    const homePageElement = browserDisplayArea.querySelector('.browser-home'); // Get reference to home page div
    
    let iframe = null; // Reference to the iframe element
    let currentUrl = 'about:home'; // Special internal URL for home
    const HOME_URL = 'about:home';

    // --- Browser History --- 
    let history = [HOME_URL]; // Start with home page in history
    let currentHistoryIndex = 0;
    let isNavigatingHistory = false; // Flag to prevent history loops

    // Function to create or get the iframe
    function getOrCreateIframe() {
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.className = 'browser-iframe'; // Assign class for potential styling
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            // Consider security implications - sandboxing is important
            iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation";
            iframe.referrerpolicy = "strict-origin-when-cross-origin";

            iframe.onload = () => {
                console.log('Iframe loaded. Attempting to read final location from src:', iframe.src);
                let finalUrl = null;
                if (iframe.contentWindow) {
                    try {
                        // Try reading the final location after load/redirects
                        finalUrl = iframe.contentWindow.location.href;
                        if (finalUrl !== 'about:blank') {
                            console.log('Successfully read iframe location:', finalUrl);
                            currentUrl = finalUrl; // Update our tracked URL
                            urlInput.value = currentUrl; // Update the bar
                        } else {
                            console.log('Iframe location is about:blank, keeping requested URL.');
                            urlInput.value = currentUrl; // Keep the URL we set
                            finalUrl = currentUrl; // Consider the requested URL as final for history
                        }
                    } catch (e) {
                        console.warn('Could not access iframe location (cross-origin?). Displaying requested URL.');
                        // Fallback: Keep the URL bar showing the URL we initially requested
                        urlInput.value = currentUrl; 
                        finalUrl = currentUrl; // Use the requested URL for history state
                    }
                } else {
                    console.warn('Cannot access iframe contentWindow after load.');
                    urlInput.value = currentUrl; // Fallback
                    finalUrl = currentUrl;
                }
                
                // Potentially update history if the final URL differs from the last entry?
                // This is complex due to redirects. Let's keep history based on user actions for now.
                // if (finalUrl && history[currentHistoryIndex] !== finalUrl) { ... }
                
                updateNavigationButtons(); // Update buttons based on history index
            };
            iframe.onerror = (e) => {
                console.error('Iframe loading error:', e);
                showErrorPage(`Failed to load ${currentUrl}. The website might block embedding.`);
            };
        }
        return iframe;
    }

    // Function to show the home page content
    function showHomePage() {
        console.log('Showing home page');
        isNavigatingHistory = true; // Set flag when navigating internally
        if (iframe && iframe.parentNode) {
            browserDisplayArea.removeChild(iframe);
            iframe = null; 
        }
        if (homePageElement) homePageElement.style.display = 'block';
        const errorMsg = browserDisplayArea.querySelector('.browser-error');
        if (errorMsg) browserDisplayArea.removeChild(errorMsg);
        
        urlInput.value = ''; 
        // Check if home is already the current entry
        if (history[currentHistoryIndex] !== HOME_URL) {
             // If navigating home explicitly, treat it like a new navigation
            if (currentHistoryIndex < history.length - 1) {
                history.splice(currentHistoryIndex + 1); // Clear forward history
            }
            history.push(HOME_URL);
            currentHistoryIndex = history.length - 1;
        }
        updateNavigationButtons();
        isNavigatingHistory = false;
    }

    // Function to show an error message
    function showErrorPage(message) {
        console.error('Browser Error:', message);
        if (iframe && iframe.parentNode) {
            browserDisplayArea.removeChild(iframe);
            iframe = null;
        }
        if (homePageElement) homePageElement.style.display = 'none'; // Hide home content
        
        // Remove previous error
        const existingError = browserDisplayArea.querySelector('.browser-error');
        if (existingError) browserDisplayArea.removeChild(existingError);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'browser-error'; // Add class for styling
        errorDiv.innerHTML = `<h2>Navigation Error</h2><p>${message}</p><button class="go-home-button">Go Home</button>`;
        errorDiv.querySelector('.go-home-button').addEventListener('click', showHomePage);
        browserDisplayArea.appendChild(errorDiv);
        
        currentUrl = 'about:error';
        urlInput.value = '';
        updateNavigationButtons();
    }

    // Navigate to a URL, managing history
    function navigateTo(url, fromHistory = false) {
        console.log(`Navigate to: ${url}, From History: ${fromHistory}`);
        
        // If called directly (not from back/forward), update history
        if (!fromHistory) {
            isNavigatingHistory = true; 
            if (currentHistoryIndex < history.length - 1) {
                console.log('Clearing forward history');
                history.splice(currentHistoryIndex + 1);
            }
            if (history[currentHistoryIndex] !== url) {
                 history.push(url);
                 currentHistoryIndex = history.length - 1;
            }
             isNavigatingHistory = false; 
        }
        
        // Handle home URL separately
        if (!url || url === HOME_URL) {
            showHomePage(); 
            return;
        }

        // Prepare the final target URL (add https, handle search)
        let targetUrl = url;
        if (!targetUrl.match(/^https?:\/\//i) && !targetUrl.startsWith('http://localhost') && !targetUrl.startsWith('file://')) {
            if (targetUrl.includes('.') || targetUrl.startsWith('localhost')) { 
                targetUrl = 'https://' + targetUrl;
            } else {
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
            }
        }
        
        // --- Key Change: Update currentUrl *before* setting iframe.src --- 
        currentUrl = targetUrl; // Update our internal tracker to the intended URL
        // -----------------------------------------------------------------
        
        urlInput.value = targetUrl; // Update address bar immediately
        
        const currentIframe = getOrCreateIframe();
        
        // Ensure home page and any errors are hidden
        if (homePageElement) homePageElement.style.display = 'none';
        const errorMsg = browserDisplayArea.querySelector('.browser-error');
        if (errorMsg) browserDisplayArea.removeChild(errorMsg);
        if (!currentIframe.parentNode) {
            browserDisplayArea.appendChild(currentIframe);
        }

        console.log('Setting iframe src:', targetUrl);
        try {
             // Avoid unnecessary reloads if src is already correct
             // Note: This might prevent reloads if user types same URL again, handled by Refresh button.
             if (currentIframe.src !== targetUrl) { 
                  currentIframe.src = targetUrl;
             } else {
                 updateNavigationButtons(); // Already on page, just update buttons
             }
        } catch (error) {
             console.error('Error setting iframe src:', error);
             showErrorPage(`Could not load the requested URL.`);
        }
        
        // Update buttons based on OUR history stack immediately after initiating navigation
        updateNavigationButtons(); 
    }
    
    // Update navigation buttons based on our internal history
    function updateNavigationButtons() {
        console.log(`Updating nav buttons. Index: ${currentHistoryIndex}, History Length: ${history.length}`);
        backButton.disabled = currentHistoryIndex <= 0;
        forwardButton.disabled = currentHistoryIndex >= history.length - 1;
        // Disable refresh only if truly on the initial home state (index 0)
        refreshButton.disabled = history.length === 1 && currentHistoryIndex === 0 && history[0] === HOME_URL;
    }
    
    // --- Event Listeners --- 

    backButton.addEventListener('click', () => {
        if (currentHistoryIndex > 0) {
            isNavigatingHistory = true; // Set flag
            currentHistoryIndex--;
            console.log(`History Back: Navigating to index ${currentHistoryIndex}, URL: ${history[currentHistoryIndex]}`);
            navigateTo(history[currentHistoryIndex], true); // Navigate using internal history
            isNavigatingHistory = false; // Clear flag
        }
    });
    
    forwardButton.addEventListener('click', () => {
        if (currentHistoryIndex < history.length - 1) {
            isNavigatingHistory = true; // Set flag
            currentHistoryIndex++;
            console.log(`History Forward: Navigating to index ${currentHistoryIndex}, URL: ${history[currentHistoryIndex]}`);
            navigateTo(history[currentHistoryIndex], true); // Navigate using internal history
            isNavigatingHistory = false; // Clear flag
        }
    });
    
    refreshButton.addEventListener('click', () => {
        const currentHistoryUrl = history[currentHistoryIndex];
        console.log('Refresh clicked. Current history URL:', currentHistoryUrl);
        if (iframe && currentHistoryUrl !== HOME_URL) {
            try {
                // Force reload by setting src again, or use reload()
                // Setting src might be slightly more robust if reload() is blocked
                console.log('Reloading iframe src:', currentHistoryUrl);
                iframe.src = currentHistoryUrl; 
                // iframe.contentWindow.location.reload(); // Alternative
            } catch (e) { 
                console.error('Refresh navigation failed:', e);
                showErrorPage('Could not reload the page.');
            } 
        } else if (currentHistoryUrl === HOME_URL) {
             console.log('Ignoring refresh on home page view.');
        }
    });

    homeButton.addEventListener('click', showHomePage);
    
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && urlInput.value.trim() !== '') {
            navigateTo(urlInput.value.trim());
        }
    });
    
    // Set up bookmark clicks using event delegation on the display area
    browserDisplayArea.addEventListener('click', (e) => {
        const bookmark = e.target.closest('.bookmark');
        if (bookmark && bookmark.dataset.url) {
             e.preventDefault(); // Prevent default link behavior if it were an <a>
             navigateTo(bookmark.dataset.url);
        }
    });

    // --- Initial Setup ---    
    showHomePage(); // Ensure home page is shown initially
    console.log('Browser module initialized.');
}

// Removed setupBrowserResizeObserver function definition

// Removed initial calls to setupBrowserResizeObserver outside the main function 