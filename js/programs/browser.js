// Browser implementation
import { createWindowManager } from '../window-manager.js';

// Global reference to browser window manager
let browserWindow;

// Export the initialization function instead of using DOMContentLoaded
export function initializeBrowser(windowElement) {
    console.log(`Browser logic initializing for window: ${windowElement.id}`);
    
    // Find elements *within the specific window element*
    const urlInput = windowElement.querySelector('#url-input'); // Use querySelector within element
    const browserDisplayArea = windowElement.querySelector('#browser-display');
    const backButton = windowElement.querySelector('.back-button');
    const forwardButton = windowElement.querySelector('.forward-button');
    const refreshButton = windowElement.querySelector('.refresh-button');
    const homeButton = windowElement.querySelector('.home-button');
    const homePageElement = browserDisplayArea?.querySelector('.browser-home'); // Use optional chaining
    
    // Check if elements were found (important for robustness)
    if (!urlInput || !browserDisplayArea || !backButton || !forwardButton || !refreshButton || !homeButton || !homePageElement) {
        console.error(`[initializeBrowser ${windowElement.id}] Could not find all required browser elements.`);
        // Maybe throw an error or return null to indicate failure?
        return null; 
    }

    let iframe = null; 
    const HOME_URL = 'about:home';
    let history = [HOME_URL];
    let currentHistoryIndex = 0;
    let isNavigatingHistory = false;

    // --- Inner Function Definitions (getOrCreateIframe, showHomePage, showErrorPage, navigateTo, updateNavigationButtons) ---
    // These functions will now correctly close over the element references found above (urlInput, etc.)
    // specific to this browser instance.
    
    function getOrCreateIframe() {
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.className = 'browser-iframe';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation";
            iframe.referrerpolicy = "strict-origin-when-cross-origin";

            iframe.onload = () => {
                console.log(`Iframe loaded in ${windowElement.id}:`, iframe.src);
                let finalUrlRead = null;
                if (iframe.contentWindow) {
                     try {
                        finalUrlRead = iframe.contentWindow.location.href;
                        if (finalUrlRead && finalUrlRead !== 'about:blank') {
                            console.log(`Successfully read final location in ${windowElement.id}:`, finalUrlRead);
                            if (urlInput.value !== finalUrlRead) urlInput.value = finalUrlRead;
                        } else {
                            console.log(`Iframe location is about:blank in ${windowElement.id}.`);
                            urlInput.value = history[currentHistoryIndex] === HOME_URL ? '' : history[currentHistoryIndex];
                        }
                    } catch (e) {
                         console.warn(`Cross-origin read failed in ${windowElement.id}.`);
                         urlInput.value = history[currentHistoryIndex] === HOME_URL ? '' : history[currentHistoryIndex];
                    }
                } else {
                     console.warn(`Cannot access contentWindow in ${windowElement.id}.`);
                     urlInput.value = history[currentHistoryIndex] === HOME_URL ? '' : history[currentHistoryIndex];
                }
                updateNavigationButtons();
            };
            iframe.onerror = (e) => {
                console.error(`Iframe loading error in ${windowElement.id}:`, e);
                showErrorPage(`Failed to load page. The website might block embedding or be unavailable.`, history[currentHistoryIndex]);
            };
        }
        return iframe;
    }

    function showHomePage() {
        console.log(`Showing home page in ${windowElement.id}`);
        const existingIframe = browserDisplayArea.querySelector('.browser-iframe');
        if (existingIframe) browserDisplayArea.removeChild(existingIframe);
        iframe = null;
        isNavigatingHistory = true;
        if (homePageElement) homePageElement.style.display = 'block';
        const errorMsg = browserDisplayArea.querySelector('.browser-error');
        if (errorMsg) browserDisplayArea.removeChild(errorMsg);
        urlInput.value = '';
        if (history[currentHistoryIndex] !== HOME_URL) {
            if (currentHistoryIndex < history.length - 1) history.splice(currentHistoryIndex + 1);
            history.push(HOME_URL);
            currentHistoryIndex = history.length - 1;
        }
        updateNavigationButtons();
        isNavigatingHistory = false;
    }

    function showErrorPage(message, urlWithError = null) {
        console.error(`Browser Error in ${windowElement.id}:`, message);
        const existingIframe = browserDisplayArea.querySelector('.browser-iframe');
        if (existingIframe) browserDisplayArea.removeChild(existingIframe);
        iframe = null;
        if (homePageElement) homePageElement.style.display = 'none';
        const existingError = browserDisplayArea.querySelector('.browser-error');
        if (existingError) browserDisplayArea.removeChild(existingError);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'browser-error'; 
        
        let displayMessage = message;
        // Check if it looks like a security block message
        if (message.includes('block embedding') || message.includes('X-Frame-Options') || message.includes('frame-ancestors')) {
             displayMessage = `This page could not be loaded because <strong>${new URL(urlWithError || '/').hostname}</strong> does not allow itself to be embedded in other pages for security reasons.`;
        }
        
        // Add "Open in New Tab" button if we have a valid URL that failed
        let openExternallyButton = '';
        if (urlWithError && urlWithError !== 'about:error' && urlWithError !== HOME_URL) {
            openExternallyButton = `<button class="open-external-button" data-url="${urlWithError}">Open in New Tab</button>`;
        }

        errorDiv.innerHTML = `
            <h2>Cannot Display Page</h2>
            <p>${displayMessage}</p>
            <div style="margin-top: 20px;">
                 <button class="go-home-button">Go Home</button>
                 ${openExternallyButton}
            </div>
        `;
        errorDiv.querySelector('.go-home-button').addEventListener('click', showHomePage);
        
        // Add listener for the new button if it exists
        const externalButton = errorDiv.querySelector('.open-external-button');
        if (externalButton) {
             externalButton.addEventListener('click', (e) => {
                 const urlToOpen = e.currentTarget.dataset.url;
                 window.open(urlToOpen, '_blank'); // Open in a real new tab
             });
        }
        
        browserDisplayArea.appendChild(errorDiv);
        // Update URL bar to show the URL that failed, or 'about:error'
        urlInput.value = urlWithError || 'about:error'; 
        updateNavigationButtons();
    }

    function navigateTo(url, fromHistory = false) {
        console.log(`Navigate in ${windowElement.id} to: ${url}, From History: ${fromHistory}`);
        if (!fromHistory) {
            isNavigatingHistory = true;
            if (currentHistoryIndex < history.length - 1) history.splice(currentHistoryIndex + 1);
            if (history[currentHistoryIndex] !== url) {
                history.push(url);
                currentHistoryIndex = history.length - 1;
            }
            isNavigatingHistory = false;
        }
        if (!url || url === HOME_URL) {
            showHomePage();
            return;
        }
        const existingIframe = browserDisplayArea.querySelector('.browser-iframe');
        if (existingIframe) browserDisplayArea.removeChild(existingIframe);
        iframe = null;
        let targetUrl = url;
        if (!targetUrl.match(/^https?:\/\//i) && !targetUrl.startsWith('http://localhost') && !targetUrl.startsWith('file://')) {
            if (targetUrl.includes('.') || targetUrl.startsWith('localhost')) targetUrl = 'https://' + targetUrl;
            else targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
        }
        let currentUrl = targetUrl; // Keep track of intended URL
        urlInput.value = targetUrl;
        const newIframe = getOrCreateIframe();
        if (homePageElement) homePageElement.style.display = 'none';
        const errorMsg = browserDisplayArea.querySelector('.browser-error');
        if (errorMsg) browserDisplayArea.removeChild(errorMsg);
        browserDisplayArea.appendChild(newIframe);
        console.log(`Setting iframe src in ${windowElement.id}:`, targetUrl);
        try {
            if (newIframe.src !== targetUrl) newIframe.src = targetUrl;
            else updateNavigationButtons();
        } catch (error) {
             console.error(`Error setting iframe src in ${windowElement.id}:`, error);
             // Pass the targetUrl that failed
             showErrorPage(`Could not load the requested URL.`, targetUrl); 
        }
        updateNavigationButtons();
    }

    function updateNavigationButtons() {
        console.log(`Updating nav buttons for ${windowElement.id}. Index: ${currentHistoryIndex}, History:`, history);
        backButton.disabled = currentHistoryIndex <= 0;
        forwardButton.disabled = currentHistoryIndex >= history.length - 1;
        refreshButton.disabled = history.length === 1 && currentHistoryIndex === 0 && history[0] === HOME_URL;
    }
    
    // --- Add Event Listeners to elements specific to this instance --- 
    backButton.addEventListener('click', () => {
        if (currentHistoryIndex > 0) {
            isNavigatingHistory = true;
            currentHistoryIndex--;
            navigateTo(history[currentHistoryIndex], true);
            isNavigatingHistory = false;
        }
    });
    forwardButton.addEventListener('click', () => {
        if (currentHistoryIndex < history.length - 1) {
            isNavigatingHistory = true;
            currentHistoryIndex++;
            navigateTo(history[currentHistoryIndex], true);
            isNavigatingHistory = false;
        }
    });
    refreshButton.addEventListener('click', () => {
        const currentHistoryUrl = history[currentHistoryIndex];
        if (iframe && currentHistoryUrl !== HOME_URL) {
            try { iframe.src = currentHistoryUrl; } 
            catch (e) { showErrorPage('Could not reload the page.'); }
        }
    });
    homeButton.addEventListener('click', showHomePage);
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && urlInput.value.trim() !== '') navigateTo(urlInput.value.trim());
    });
    browserDisplayArea.addEventListener('click', (e) => {
        const bookmark = e.target.closest('.bookmark');
        if (bookmark?.dataset.url) navigateTo(bookmark.dataset.url);
    });

    // --- Initial State --- 
    showHomePage(); 
    console.log(`Browser logic initialized for ${windowElement.id}.`);
    return { navigateTo }; // Return the controller API for this instance
}

// Register the browser program with ProgramManager
// We need a class structure similar to other programs for ProgramManager to handle it.
import { Program, ProgramManager } from '../program.js';

class BrowserProgram extends Program {
    static BASE_ID = 'browser';
    static DEFAULT_TITLE = 'Browser'; // For menu bar

    constructor(instanceId, options = {}) {
        super(instanceId, BrowserProgram.DEFAULT_TITLE, BrowserProgram.BASE_ID, 900, 600); 
        this.browserController = null;
        this.initialized = false; 
        this.initialUrl = options.url || null;
    }

    // Override createWindowElement to add browser-specific structure
    createWindowElement() {
        // 1. Get the basic window structure from the parent class
        const windowElement = super.createWindowElement();

        // 2. Find the generic content area created by the parent
        const contentArea = windowElement.querySelector('.window-content');
        if (!contentArea) {
             console.error('Base Program class did not create .window-content area');
             return windowElement; // Return incomplete element
        }
        
        // 3. Define the browser-specific inner HTML
        contentArea.innerHTML = `
            <div class="browser-toolbar">
                <div class="browser-navigation">
                    <button class="nav-button back-button" title="Back" disabled>←</button>
                    <button class="nav-button forward-button" title="Forward" disabled>→</button>
                    <button class="nav-button refresh-button" title="Refresh">↻</button>
                    <button class="nav-button home-button" title="Home">⌂</button> 
                </div>
                <div class="address-bar">
                    <input type="text" id="url-input" placeholder="Enter URL or search query">
                </div>
            </div>
            <div id="browser-display" class="browser-display-area">
                 <div class="browser-home">
                    <h2>Browser Home</h2>
                    <p>Enter a URL or choose a link:</p>
                    <div class="bookmarks">
                        <div class="bookmark" data-url="https://korze.org">korze.org</div>
                        <div class="bookmark" data-url="https://leviathan.korze.org">Leviathan Game</div>
                    </div>
                    <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
                        Note: Loading external sites may be blocked by the target website.
                    </p>
                </div>
            </div>
        `;
        
        // We also need to make sure the .window-content class itself has flex properties
        // Add this directly or ensure it's in the CSS
        contentArea.style.display = 'flex';
        contentArea.style.flexDirection = 'column';
        contentArea.style.height = '100%'; // Ensure it fills the space below header
        contentArea.style.padding = '0';

        // 4. Return the complete window element
        return windowElement;
    }

    async init() {
        if (this.initialized) return;
        // init now calls the overridden createWindowElement via super.init()
        await super.init(); 
        console.log(`[BrowserProgram ${this.instanceId}] Initializing...`);
        
        // Pass the specific window element (this.windowElement created by super.init)
        this.browserController = initializeBrowser(this.windowElement); 
        if (!this.browserController) {
             console.error(`[BrowserProgram ${this.instanceId}] Failed to initialize browser controller.`);
             this.close(); 
             throw new Error('Browser controller initialization failed');
        }
        this.initialized = true; 
        console.log(`[BrowserProgram ${this.instanceId}] Initialization complete.`);
        if (this.initialUrl) {
             this.navigateTo(this.initialUrl);
        }
    }
    
    navigateTo(url) {
        if (!this.initialized || !this.browserController?.navigateTo) {
             console.warn(`[BrowserProgram ${this.instanceId}] Attempted navigate before init or controller missing. Queueing...`);
             this.init().then(() => {
                 if(this.browserController?.navigateTo){
                      console.log('[BrowserProgram] Late init completed, now navigating...');
                      this.browserController.navigateTo(url);
                      this.show(); 
                 } else {
                     console.error('[BrowserProgram] Late initialization still failed.');
                 }
             }).catch(err => console.error('Error during late init for navigateTo:', err));
            return; 
        }
        console.log(`[BrowserProgram ${this.instanceId}] Calling controller navigateTo: ${url}`);
        this.browserController.navigateTo(url);
        this.show(); 
    }

    // Override show to ensure initialization happens before showing - REMOVED as base class now handles init await
    // async show() {
    //     if (!this.initialized) {
    //          console.log(`[BrowserProgram ${this.instanceId}] First show: running init...`);
    //          try { await this.init(); }
    //          catch (err) {
    //              console.error(`[BrowserProgram ${this.instanceId}] Init failed during show:`, err);
    //              return; 
    //          }
    //     }
    //     super.show(); 
    // }
    
    // Add destroy method to clean up listeners if necessary
    destroy() {
        console.log(`[BrowserProgram ${this.instanceId}] Destroying...`);
        // TODO: Add cleanup if initializeBrowser added global listeners
        super.destroy();
    }
}

ProgramManager.register(BrowserProgram);

// Keep the old export for direct initialization if still used anywhere,
// but prefer using ProgramManager.launch('browser')
// export { initializeBrowser }; 
// Let's remove the direct export to encourage using ProgramManager

// Removed setupBrowserResizeObserver function definition
// Removed initial calls to setupBrowserResizeObserver outside the main function 