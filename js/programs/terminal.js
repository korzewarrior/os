// Terminal implementation
// import { createWindowManager } from '../window-manager.js'; // No longer needed
import { Program, ProgramManager } from '../program.js'; // Import base classes
import showWhoami from '../commands/whoami.js';
import showShowcase from '../commands/showcase.js';
import showPing from '../commands/ping.js';
import showMore from '../commands/more.js';
import showHelp from '../commands/help.js';
// REMOVED import { showMailApp } from './mail.js'; 

// Wrap terminal logic in a Program class
export class TerminalProgram extends Program {
    static BASE_ID = 'terminal';
    static DEFAULT_TITLE = 'Terminal';

    // Define available commands and descriptions
    static COMMANDS = {
        'ls': 'List directory contents',
        'cd': 'Change directory',
        'pwd': 'Print working directory',
        'cat': 'Concatenate and display file content',
        'clear': 'Clear the terminal screen',
        'whoami': 'Display user information',
        'showcase': 'Show component showcase (dev tool)',
        'ping': 'Simulate network ping to a host',
        'more': 'Display text content page by page',
        'help': 'Show available commands and descriptions',
        'browser': 'Launch the web browser',
        'mail': 'Launch the mail application',
        'exit': 'Close the current terminal instance',
        'fetch': 'Fetch content from a URL',
        'neofetch': 'Display system information'
    };

    constructor(instanceId, options = {}) {
        super(instanceId, TerminalProgram.DEFAULT_TITLE, TerminalProgram.BASE_ID, 800, 500);
        this.outputElement = null;
        this.inputElement = null;
        this.promptElement = null;
        this.currentDirectory = '/home/korze'; // SET DEFAULT TO /home/korze
        this.commandHistory = [];
        this.historyIndex = -1;
        this.fileSystem = this.initializeFileSystem(); // Initialize FS per instance
    }

    // Override init to set up terminal specific elements and listeners
    async init() {
        if (this.isInitialized) return;
        await super.init(); // Creates window, DOM, WindowManager

        // Find elements within this instance's window element
        this.outputElement = this.windowElement.querySelector('.terminal-output'); // Use class selector
        this.inputElement = this.windowElement.querySelector('.terminal-input'); // Find by class
        this.promptElement = this.windowElement.querySelector('.prompt-symbol'); // Use class selector

        if (!this.outputElement || !this.inputElement || !this.promptElement) {
            console.error(`[TerminalProgram ${this.instanceId}] Failed to find terminal elements.`);
            this.close(); // Close if UI is broken
            throw new Error('Terminal UI elements not found');
        }
        
        // Set instance-specific ID if needed, mainly for labels, but selection uses class
        this.inputElement.id = `command-input-${this.instanceId}`;
        this.outputElement.id = `output-${this.instanceId}`;

        this.setupInputHandling();
        this.resetTerminal(); // Display initial welcome message & first prompt
        
        // Focus input when shown and ensure prompt is visible
        if (this.windowManager) {
             this.windowManager.addOnShowCallback(() => {
                 console.log(`[Terminal ${this.instanceId}] Show callback triggered.`);
                 // Ensure prompt is updated after window is definitely shown
                 this.updatePrompt(); 
                 // Focus input slightly after ensuring prompt is set
                 setTimeout(() => this.inputElement?.focus(), 50); 
             });
        }
        console.log(`[TerminalProgram ${this.instanceId}] Initialized.`);
    }

    // --- Terminal Logic Methods (Adapted to use this.) --- 
    
    initializeFileSystem() { 
        // Simple, non-shared FS for each instance
        // TODO: Consider a shared, potentially persistent FS module later
        return {
            '/': {
                type: 'directory',
                contents: {
                    'home': {
                        type: 'directory',
                        contents: {
                            'korze': {
                                type: 'directory',
                                contents: {
                                    'Desktop': {
                                        type: 'directory',
                                        contents: {
                                            'resume.pdf': { type: 'file', content: '[PDF Content]' },
                                            'commands.pdf': { type: 'file', content: '[PDF Content]' },
                                            'korze.org.url': { type: 'file', content: 'https://korze.org' },
                                            'Leviathan.url': { type: 'file', content: 'https://leviathan.korze.org' },
                                            'better.game.url': { type: 'file', content: 'https://korzewarrior.github.io/better.game/' }
                                        }
                                    },
                                    'projects': {
                                        type: 'directory',
                                        contents: { 'website.html': { type: 'file', content: '[Project Content]' } }
                                    },
                                    'documents': {
                                        type: 'directory',
                                        contents: { 'notes.txt': { type: 'file', content: 'My notes.' } }
                                    },
                                    'about.txt': { type: 'file', content: 'User: korze (simulated)' }
                                }
                            }
                        }
                    },
                    'bin': {
                        type: 'directory',
                        contents: {
                             'ls': { type: 'file', executable: true },
                             'cd': { type: 'file', executable: true },
                             'pwd': { type: 'file', executable: true },
                             'cat': { type: 'file', executable: true },
                             'clear': { type: 'file', executable: true },
                             'whoami': { type: 'file', executable: true },
                             'showcase': { type: 'file', executable: true },
                             'ping': { type: 'file', executable: true },
                             'more': { type: 'file', executable: true },
                             'help': { type: 'file', executable: true },
                             'browser': { type: 'file', executable: true },
                             'mail': { type: 'file', executable: true },
                             'exit': { type: 'file', executable: true },
                             'fetch': { type: 'file', executable: true },
                             'neofetch': { type: 'file', executable: true }
                        }
                    }
                }
            }
        }; 
    }

    // Override createWindowElement for terminal structure
    createWindowElement() {
        const windowElement = super.createWindowElement();
        const contentArea = windowElement.querySelector('.window-content');
        if (!contentArea) return windowElement;

        contentArea.innerHTML = `
            <div class="terminal-output"></div>
            <div class="terminal-prompt">
                <span class="prompt-symbol"></span>
                <input type="text" class="terminal-input" id="command-input" autocomplete="off" spellcheck="false">
            </div>
        `;
        // REMOVE hardcoded styles - rely on CSS variables defined in apps.css/base.css
        // contentArea.style.padding = '5px'; 
        // contentArea.style.fontFamily = 'var(--font-monospace)';
        // contentArea.style.fontSize = '13px';
        // contentArea.style.lineHeight = '1.4';
        // contentArea.style.backgroundColor = '#1e1e1e'; // REMOVED
        // contentArea.style.color = '#d4d4d4'; // REMOVED

        return windowElement;
    }

    clearTerminal() { if (this.outputElement) this.outputElement.innerHTML = ''; }

    appendToTerminal(html) {
        if (this.outputElement) {
            console.log(`[Terminal ${this.instanceId}] Appending HTML:`, html?.substring(0, 100)); // Log appending
            this.outputElement.innerHTML += html;
            const terminalContent = this.windowElement.querySelector('.terminal-content');
            if (terminalContent) terminalContent.scrollTop = terminalContent.scrollHeight;
        } else {
             console.error(`[Terminal ${this.instanceId}] Output element not found for appending.`);
        }
    }

    updatePrompt() { 
        if (this.promptElement) {
            this.promptElement.textContent = `${this.currentDirectory} $`; 
        } else {
            console.error(`[Terminal ${this.instanceId}] Prompt element not found for updating.`);
        }
    }

    resetTerminal() { 
        this.clearTerminal();
        this.displaySystemInfo(); // Display the info block
    }
    
    getGpuInfo() {
        // Attempt to get GPU info, but return a cleaner string or N/A
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    // Simple heuristic to shorten common long names
                    if (renderer.includes('ANGLE')) return 'GPU Renderer (ANGLE)';
                    if (renderer.includes('SwiftShader')) return 'GPU Renderer (SwiftShader)';
                    // Return a limited part if too long, or a generic name
                    return renderer.length > 50 ? 'GPU Renderer Info' : renderer; 
                }
            }
        } catch (e) {
             console.warn('Error getting GPU info:', e);
        }
        return 'N/A'; // Fallback
    }

    // Method to display system info (like neofetch)
    displaySystemInfo() {
        const gpuInfo = this.getGpuInfo() || 'Browser Renderer';
        const pkgCount = this.fileSystem['/']?.contents?.bin?.contents ? Object.keys(this.fileSystem['/'].contents.bin.contents).length : 0;
        const infoHtml = `
<pre class="ascii-art" style="color: #66c2cd;">
        _,met$$$$$gg.           korze<span style="color: var(--text-primary)">@${this.instanceId.substring(0,8)}</span>
     ,g$$$$$$$$$$$$$$$P.        --------------------
   ,g$$P""""Y$$""""""Y$$..      <span style="color: #f9a825">OS:</span> korzeOS 1.0 MultiInstance
  ,$$P'    "$$"     "$b$""$$.    <span style="color: #f9a825">Host:</span> Browser Environment
 ',$$P      Y$       "$P'$P$.   <span style="color: #f9a825">Kernel:</span> ${navigator.platform || 'Web API'}
 ',$$P      Y$       "$P'$P$.   <span style="color: #f9a825">Uptime:</span> ${Math.floor(performance.now() / 60000)} mins
 ",$$"      "$}       "$L$"$,   <span style="color: #f9a825">Packages:</span> ${pkgCount} (simulated)
   "$.       "$;        "$;$"   <span style="color: #f9a825">Shell:</span> web-sh 1.0
    "$.       "$$.     .$$P",    <span style="color: #f9a825">Resolution:</span> ${window.screen.width}x${window.screen.height}
      "$.       "Y$bggdP"Y$,     <span style="color: #f9a825">Terminal:</span> WebTerm (${this.instanceId})
       "Y$.        """Y$P""      <span style="color: #f9a825">CPU:</span> ${navigator.hardwareConcurrency || 'Virtual'} Cores
          "Y$.                <span style="color: #f9a825">GPU:</span> ${gpuInfo}
             "Y$.            <span style="color: #f9a825">Memory:</span> Simulated 8GiB
                "YP.
</pre><br>
        `; // Added line break
        this.appendToTerminal(infoHtml);
    }

    getDirectoryFromPath(path) {
        let targetPath = path.trim();
        console.log(`[getDirectoryFromPath] Input path: ${path}, Current Dir: ${this.currentDirectory}`);

        // 1. Resolve Absolute Path
        if (!targetPath.startsWith('/')) {
            const basePath = this.currentDirectory === '/' ? '/' : this.currentDirectory + '/';
            targetPath = basePath + targetPath;
        }
        console.log(`[getDirectoryFromPath] Resolved absolute path: ${targetPath}`);

        // 2. Normalize Path (handle //, /./, /../)
        const normalizedParts = [];
        const parts = targetPath.split('/');
        for (const part of parts) {
            if (part === '..') {
                if (normalizedParts.length > 0) {
                    normalizedParts.pop(); // Go up one level
                }
            } else if (part !== '.' && part !== '') {
                normalizedParts.push(part);
            }
        }
        const normalizedPath = '/' + normalizedParts.join('/');
        console.log(`[getDirectoryFromPath] Normalized path: ${normalizedPath}`);

        // 3. Traverse File System
        let current = this.fileSystem['/'];
        if (normalizedPath === '/') return current; // Return root if path is just root

        for (const part of normalizedParts) { // Use the normalized parts for traversal
            if (!current || typeof current.contents !== 'object' || !current.contents[part]) {
                console.error(`[getDirectoryFromPath] Part not found or invalid: ${part} in path ${normalizedPath}`);
                return null; // Path component not found or current level has no contents
            }
            current = current.contents[part];
        }
        
        // 4. Final check: Ensure the final destination exists and is a directory
        if (!current || current.type !== 'directory') {
             console.error(`[getDirectoryFromPath] Final path ${normalizedPath} is not a directory or doesn't exist.`);
             return null; 
        }

        console.log(`[getDirectoryFromPath] Successfully found directory object for: ${normalizedPath}`);
        return current;
    }
    
    listDirectory(path) {
        const targetDir = (path === '.' || !path) ? this.currentDirectory : path;
        console.log(`[Terminal ${this.instanceId}] Listing directory: ${targetDir}`);
        const dirObj = this.getDirectoryFromPath(targetDir);
        if (!dirObj || dirObj.type !== 'directory') {
            this.appendToTerminal(`<p>ls: cannot access '${targetDir}': No such directory</p>`);
            return;
        }
        const contents = dirObj.contents || {};
        const keys = Object.keys(contents).sort();
        if (keys.length === 0) return; // No need for empty message
        let output = '<div class="ls-output">';
        keys.forEach(name => {
            const item = contents[name];
            let className = item.type === 'directory' ? 'directory' : (item.executable ? 'executable' : 'file-item');
            output += `<span class="${className}">${name}${item.type === 'directory' ? '/' : ''}</span>`;
        });
        output += '</div>';
        this.appendToTerminal(output);
    }
    
    changeDirectory(path) {
        let targetPath = path.trim();
        let newDir;
        const homeDir = '/home/korze'; // Ensure homeDir is /home/korze

        if (targetPath === '..') {
            const parts = this.currentDirectory.split('/').filter(p => p);
            if (parts.length > 0) parts.pop();
            newDir = '/' + parts.join('/');
        } else if (!targetPath || targetPath === '~' || targetPath === '/home/korze') { // Check against /home/korze
            newDir = homeDir;
        } else {
             if (!targetPath.startsWith('/')) {
                 const basePath = this.currentDirectory === '/' ? '' : this.currentDirectory;
                 targetPath = `${basePath}/${targetPath}`;
             }
             const parts = [];
             targetPath.split('/').forEach(part => {
                 if (part === '..') { if (parts.length > 0) parts.pop(); }
                 else if (part !== '.' && part !== '') { parts.push(part); }
             });
             newDir = '/' + parts.join('/');
        }
        
        const dirObj = this.getDirectoryFromPath(newDir);
        if (!dirObj || dirObj.type !== 'directory') {
             this.appendToTerminal(`<p>cd: no such directory: ${path || newDir}</p>`);
        } else {
            this.currentDirectory = newDir;
            this.updatePrompt();
        }
    }
        
    printWorkingDirectory() { 
        console.log(`[Terminal ${this.instanceId}] pwd called. Current dir: ${this.currentDirectory}`);
        // Create a paragraph element, set its text, and append
        const p = document.createElement('p');
        p.textContent = this.currentDirectory;
        this.appendToTerminal(p.outerHTML); // Append the HTML string of the element
    }
    
    catFile(path) {
        let targetPath = path.trim();
         if (!targetPath.startsWith('/')) {
             targetPath = (this.currentDirectory === '/' ? '/' : this.currentDirectory + '/') + targetPath;
        }
        const dirPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
        const fileName = targetPath.substring(targetPath.lastIndexOf('/') + 1);
        const dirObj = this.getDirectoryFromPath(dirPath);
        if (!dirObj || !dirObj.contents || !dirObj.contents[fileName]) {
             this.appendToTerminal(`<p>cat: ${path}: No such file or directory</p>`); return;
        }
        const file = dirObj.contents[fileName];
        if (file.type !== 'file') {
             this.appendToTerminal(`<p>cat: ${path}: Is a directory</p>`); return;
        }
        // Escape HTML content before appending
        const escapedContent = file.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        this.appendToTerminal(`<pre class="file-content">${escapedContent || ''}</pre>`);
    }

    setupInputHandling() {
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent default form submission/newline
                const command = this.inputElement.value.trim();
                // Echo the command *first*
                this.appendToTerminal(`<p><span class="prompt-symbol">${this.currentDirectory} $</span> ${command}</p>`);
                // Clear input *immediately* after echoing
                this.inputElement.value = ''; 
                
                if (command) {
                    this.commandHistory.push(command);
                    this.historyIndex = this.commandHistory.length; 
                    this.executeCommand(command); // Execute after echo and clear
                } else {
                    // If no command entered, just show the next prompt line
                    this.updatePrompt(); // Ensure prompt updates even on empty enter
                }
                // No need to call updatePrompt here, executeCommand does it
            } else if (e.key === 'ArrowUp') {
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.inputElement.value = this.commandHistory[this.historyIndex];
                    e.preventDefault();
                }
            } else if (e.key === 'ArrowDown') {
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.inputElement.value = this.commandHistory[this.historyIndex];
                } else if (this.historyIndex === this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.inputElement.value = '';
                }
                e.preventDefault();
            }
        });
    }

    async fetchUrl(url) {
        if (!url) {
            this.appendToTerminal('<p>Usage: fetch &lt;url&gt;</p>');
            this.updatePrompt(); // Ensure prompt shows after error
            return;
        }

        // Basic URL validation/prep
        let targetUrl = url;
        if (!targetUrl.match(/^https?:\/\//i) && !targetUrl.startsWith('http://localhost')) {
            targetUrl = 'https://' + targetUrl;
        }

        this.appendToTerminal(`<p>Fetching ${targetUrl}...</p>`);

        try {
            const response = await fetch(targetUrl, {
                method: 'GET',
                mode: 'cors', // Important for cross-origin requests
                redirect: 'follow' // Follow redirects
            });

            let output = `<p>Status: ${response.status} ${response.statusText}</p>`;
            output += '<p>Headers:</p><ul style="list-style: none; padding-left: 10px;">';
            response.headers.forEach((value, name) => {
                output += `<li><strong>${name}:</strong> ${value}</li>`;
            });
            output += '</ul>';

            // Try to read body as text (limit length)
            try {
                 const bodyText = await response.text();
                 const snippet = bodyText.substring(0, 500).replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Limit and escape
                 output += '<p>Body Snippet:</p><pre style="white-space: pre-wrap; word-break: break-all; border: 1px solid var(--element-border); padding: 5px;">';
                 output += snippet;
                 if (bodyText.length > 500) output += '\n... (truncated)';
                 output += '</pre>';
            } catch (bodyError) {
                 output += '<p>Could not read response body as text.</p>';
                 console.error('Error reading fetch response body:', bodyError);
            }
            
            this.appendToTerminal(output);

        } catch (error) {
            console.error('Fetch command error:', error);
            this.appendToTerminal(`<p>Error fetching ${targetUrl}: ${error.message}</p>`);
        }
        this.updatePrompt(); // Show prompt after fetch completes/fails
    }

    executeCommand(command) {
        // --- Easter Egg Check --- 
        if (command.trim() === 'sudo rm -rf /') {
             console.warn('Triggering sudo rm -rf / easter egg!');
             // Make triggerSystemGlitch globally available or import it
             if (window.triggerSystemGlitch) {
                 window.triggerSystemGlitch();
             } else {
                  console.error('triggerSystemGlitch function not found!');
                  // Fallback: just clear terminal?
                  this.clearTerminal();
                  this.appendToTerminal('<p>*** KERNEL PANIC (SIMULATED) ***</p>');
             }
             // Don't proceed with normal command execution or prompt update
             return; 
        }
        // --- End Easter Egg Check ---
        
        const parts = command.split(' ').filter(p => p !== '');
        const cmd = parts[0];
        const args = parts.slice(1);

        switch (cmd) {
            case 'ls': this.listDirectory(args[0] || '.'); break;
            case 'cd': this.changeDirectory(args[0] || '/home/korze'); break;
            case 'pwd': this.printWorkingDirectory(); break;
            case 'cat': 
                 if (args.length === 0) this.appendToTerminal('<p>cat: missing operand</p>');
                 else this.catFile(args[0]); 
                 break;
            case 'clear': this.clearTerminal(); break;
            case 'whoami': showWhoami(this.appendToTerminal.bind(this)); break;
            case 'showcase': showShowcase(this.appendToTerminal.bind(this)); break;
            case 'ping': showPing(args, this.appendToTerminal.bind(this)); break;
            case 'more': showMore(args, this.appendToTerminal.bind(this)); break;
            case 'help': showHelp(this.appendToTerminal.bind(this)); break;
            case 'browser': ProgramManager.launch('browser', { url: args[0] })?.show(); break;
            case 'mail': 
                // Use ProgramManager to launch mail app
                ProgramManager.launch('mail')?.show(); 
                break; 
            case 'fetch':
                 this.fetchUrl(args[0]); 
                 return; 
            case 'neofetch':
                this.displaySystemInfo(); // Call the new method
                break;
            case 'exit': this.close(); break;
            default:
                this.appendToTerminal(`<p>${cmd}: command not found</p>`);
        }
        this.updatePrompt();
    }
    
    // Ensure destroy cleans up if needed
    // destroy() { super.destroy(); /* remove listeners */ }
}

// Register the class
ProgramManager.register(TerminalProgram);

// Remove the old export function
// export function initializeTerminal() { ... } 
// export function initializeTerminal() { ... } 