/**
 * Debug Utilities
 * Provides tools for debugging the UI
 */

// Debug mode flag
let debugMode = true;

/**
 * Log message to console with debug prefix
 * @param {string} message - Message to log
 */
export function debugLog(message) {
    if (!debugMode) return;
    console.log(`[DEBUG] ${message}`);
}

/**
 * Show debug overlay with useful information
 */
export function showDebugOverlay() {
    if (!debugMode) return;
    
    // Check if overlay already exists
    let overlay = document.getElementById('debug-overlay');
    
    if (!overlay) {
        // Create overlay
        overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '10px';
        overlay.style.right = '10px';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.color = '#00ff00';
        overlay.style.padding = '10px';
        overlay.style.borderRadius = '5px';
        overlay.style.fontFamily = 'monospace';
        overlay.style.fontSize = '12px';
        overlay.style.zIndex = '9999';
        overlay.style.maxWidth = '400px';
        
        document.body.appendChild(overlay);
    }
    
    // Update information
    const programInfo = getRegisteredProgramsInfo();
    const eventInfo = getEventListenerInfo();
    
    overlay.innerHTML = `
        <h3 style="margin-top: 0;">Debug Info</h3>
        <button id="debug-refresh" style="margin-bottom: 10px;">Refresh</button>
        <div>
            <h4>Registered Programs:</h4>
            <pre>${programInfo}</pre>
        </div>
        <div>
            <h4>UI Elements:</h4>
            <pre>${eventInfo}</pre>
        </div>
    `;
    
    // Add refresh button handler
    document.getElementById('debug-refresh').addEventListener('click', showDebugOverlay);
}

/**
 * Get information about registered programs
 * @returns {string} Formatted program information
 */
function getRegisteredProgramsInfo() {
    if (typeof window.ProgramManager === 'undefined') {
        return 'ProgramManager not found!';
    }
    
    const programs = window.ProgramManager.programs || {};
    const programNames = Object.keys(programs);
    
    if (programNames.length === 0) {
        return 'No programs registered';
    }
    
    return programNames.map(name => `- ${name}`).join('\n');
}

/**
 * Get information about key UI elements and their event listeners
 * @returns {string} Formatted UI element information
 */
function getEventListenerInfo() {
    const elements = [
        { selector: '.menu-bar-logo', name: 'OS Logo' },
        { selector: '.dock-item', name: 'Dock Icons' },
        { selector: '.menu-item', name: 'Menu Items' },
        { selector: '.window-controls .red', name: 'Close Buttons' }
    ];
    
    let info = [];
    
    elements.forEach(el => {
        const elements = document.querySelectorAll(el.selector);
        info.push(`${el.name}: ${elements.length} found`);
    });
    
    return info.join('\n');
}

/**
 * Fix common UI issues automatically
 */
export function autoRepair() {
    debugLog('Running auto-repair...');
    
    // Removed dock icon repair code that was causing issues
    
    // Fix for menu
    const osLogo = document.querySelector('.menu-bar-logo');
    if (osLogo) {
        debugLog('Fixing OS logo menu');
        const newLogo = osLogo.cloneNode(true);
        osLogo.parentNode.replaceChild(newLogo, osLogo);
        
        newLogo.addEventListener('click', () => {
            debugLog('OS logo menu clicked');
            const dropdown = newLogo.querySelector('.menu-dropdown');
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
    }
    
    debugLog('Auto-repair complete');
}

/**
 * Initialize debug tools
 */
export function initializeDebug() {
    if (!debugMode) return;
    
    // Add keyboard shortcut for debug overlay (Ctrl+Shift+D)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            showDebugOverlay();
        }
    });
    
    // Add keyboard shortcut for auto-repair (Ctrl+Shift+R)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            autoRepair();
        }
    });
    
    debugLog('Debug tools initialized');
} 