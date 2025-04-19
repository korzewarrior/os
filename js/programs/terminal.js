// Terminal implementation
import { createWindowManager } from '../window-manager.js';
import showWhoami from '../commands/whoami.js';
import showShowcase from '../commands/showcase.js';
import showPing from '../commands/ping.js';
import showMore from '../commands/more.js';
import showHelp from '../commands/help.js';
import { showMailApp } from './mail.js';

// Global reference to terminal window manager
let terminalWindow;

// Export the initialization function instead of using DOMContentLoaded
export function initializeTerminal() {
    console.log('Terminal module initializing...');
    
    const terminal = document.getElementById('terminal');
    const output = document.getElementById('output');
    const commandInput = document.getElementById('command-input');
    
    if (!terminal || !output || !commandInput) {
        console.error('Critical terminal elements not found!', { terminal, output, commandInput });
        return;
    }
    
    // Initialize window manager for terminal
    terminalWindow = createWindowManager('terminal', {
        initialWidth: '800px',
        initialHeight: '500px',
        minimized: true,
        onMinimize: () => console.log('[terminal] Window minimized'),
        onMaximize: () => console.log('[terminal] Window maximized'),
        onRestore: () => console.log('[terminal] Window restored')
    });
    
    // File system and terminal state
    let currentDirectory = '/home/user';
    let commandHistory = [];
    let historyIndex = -1;
    
    // Basic utility functions
    function clearTerminal() {
        if (output) output.innerHTML = '';
    }
    
    function appendToTerminal(html) {
        if (output) {
            output.innerHTML += html;
            // Scroll to bottom
            const terminalContent = terminal.querySelector('.terminal-content');
            if (terminalContent) {
                terminalContent.scrollTop = terminalContent.scrollHeight;
            }
        }
    }
    
    function updatePrompt() {
        const promptEl = document.querySelector('.prompt-symbol');
        if (promptEl) promptEl.textContent = `${currentDirectory} $`;
    }
    
    function resetTerminal() {
        clearTerminal();
        appendToTerminal(`
            <p>Type <strong>help</strong> to see available commands</p>
            <p>Use <strong>ctrl+c</strong> to reset the terminal</p>
            <br>
            
            <p>Quick command reference:</p>
            <ul>
                <li><strong>ls</strong><br>List files in current directory</li>
                <li><strong>cd [dir]</strong><br>Change directory</li>
                <li><strong>pwd</strong><br>Show current directory path</li>
                <li><strong>cat [file]</strong><br>Display file contents</li>
                <li><strong>whoami</strong><br>About user info</li>
                <li><strong>clear</strong><br>Clear terminal screen</li>
                <li><strong>help</strong><br>Show all commands and details</li>
                <li><strong>browser</strong><br>Open the web browser</li>
            </ul>
        `);
        
        updatePrompt();
    }
    
    // File system implementation
    let fileSystem = {
        '/': {
            type: 'directory',
            contents: {
                'home': {
                    type: 'directory',
                    contents: {
                        'user': {
                            type: 'directory',
                            contents: {
                                'projects': {
                                    type: 'directory',
                                    contents: {
                                        'website.html': { type: 'file', content: 'Terminal Website Project' },
                                        'app.js': { type: 'file', content: 'Main application code' },
                                        'README.md': { type: 'file', content: 'Project documentation' }
                                    }
                                },
                                'documents': {
                                    type: 'directory',
                                    contents: {
                                        'resume.pdf': { type: 'file', content: 'Resume document' },
                                        'notes.txt': { type: 'file', content: 'Personal notes' }
                                    }
                                },
                                'about.txt': { type: 'file', content: 'Information about the user' }
                            }
                        }
                    }
                },
                'bin': {
                    type: 'directory',
                    contents: {
                        'whoami': { type: 'file', executable: true },
                        'showcase': { type: 'file', executable: true },
                        'ping': { type: 'file', executable: true },
                        'more': { type: 'file', executable: true }
                    }
                }
            }
        }
    };
    
    // Get directory object from path
    function getDirectoryFromPath(path) {
        // Handle absolute and relative paths
        let targetPath = path;
        if (!path.startsWith('/')) {
            // Relative path - combine with current directory
            targetPath = currentDirectory + '/' + path;
        }
        
        // Normalize the path (handle ../ and ./)
        const parts = targetPath.split('/').filter(p => p !== '');
        const normalized = [];
        for (const part of parts) {
            if (part === '..') {
                normalized.pop();
            } else if (part !== '.') {
                normalized.push(part);
            }
        }
        
        targetPath = '/' + normalized.join('/');
        
        // Navigate to the path
        let current = fileSystem['/'];
        if (targetPath === '/') return current;
        
        const pathParts = targetPath.split('/').filter(p => p !== '');
        
        for (const part of pathParts) {
            if (!current.contents || !current.contents[part]) {
                return null; // Path doesn't exist
            }
            current = current.contents[part];
        }
        
        return current;
    }
    
    // Command implementations
    function listDirectory(path) {
        const dirObj = getDirectoryFromPath(path);
        
        if (!dirObj || dirObj.type !== 'directory') {
            appendToTerminal(`<p>ls: cannot access '${path}': No such directory</p>`);
            return;
        }
        
        const contents = dirObj.contents || {};
        const keys = Object.keys(contents);
        
        if (keys.length === 0) {
            appendToTerminal(`<p><i>Directory is empty</i></p>`);
            return;
        }
        
        let output = '<div class="ls-output">';
        
        keys.sort().forEach(name => {
            const item = contents[name];
            let className = 'file-item';
            
            if (item.type === 'directory') {
                className += ' directory';
            } else if (item.executable) {
                className += ' executable';
            }
            
            output += `<span class="${className}">${name}</span>`;
        });
        
        output += '</div>';
        appendToTerminal(output);
    }
    
    function changeDirectory(path) {
        if (!path || path === '/home/user') {
            currentDirectory = '/home/user';
        }
        
        // Handle special case of '..'
        if (path === '..') {
            const parts = currentDirectory.split('/').filter(p => p !== '');
            if (parts.length > 0) {
                parts.pop();
                currentDirectory = '/' + parts.join('/');
                updatePrompt();
            }
            return;
        }
        
        // Handle absolute path vs relative path
        let newPath = path.startsWith('/') ? path : `${currentDirectory}/${path}`;
        
        // Normalize the path
        const parts = newPath.split('/').filter(p => p !== '');
        const normalized = [];
        for (const part of parts) {
            if (part === '..') {
                if (normalized.length > 0) normalized.pop();
            } else if (part !== '.') {
                normalized.push(part);
            }
        }
        
        newPath = '/' + normalized.join('/');
        
        const dirObj = getDirectoryFromPath(newPath);
        
        if (!dirObj || dirObj.type !== 'directory') {
            appendToTerminal(`<p>cd: cannot access '${path}': No such directory</p>`);
            return;
        }
        
        currentDirectory = newPath;
        updatePrompt();
    }
    
    function printWorkingDirectory() {
        appendToTerminal(`<p>${currentDirectory}</p>`);
    }
    
    function catFile(path) {
        let filePath = path;
        if (!path.startsWith('/')) {
            filePath = `${currentDirectory}/${path}`;
        }
        
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        
        const dirObj = getDirectoryFromPath(dirPath);
        
        if (!dirObj || !dirObj.contents || !dirObj.contents[fileName]) {
            appendToTerminal(`<p>cat: ${path}: No such file</p>`);
            return;
        }
        
        const file = dirObj.contents[fileName];
        
        if (file.type !== 'file') {
            appendToTerminal(`<p>cat: ${path}: Is a directory</p>`);
            return;
        }
        
        appendToTerminal(`<p class="file-content">${file.content || ''}</p>`);
    }
    
    // Command execution handler
    function executeCommand(command) {
        const args = command.trim().split(/\s+/);
        const cmd = args[0].toLowerCase();
        
        switch(cmd) {
            case 'ls':
                listDirectory(args[1] || currentDirectory);
                break;
            case 'cd':
                // If cd with no arguments, reset the terminal
                if (!args[1]) {
                    console.log('CD with no args - resetting terminal');
                    // Reset to home directory
                    currentDirectory = '/home/user';
                    updatePrompt();
                    // Fully reset terminal content
                    resetTerminal();
                } else {
                    // Normal cd with path argument
                    changeDirectory(args[1]);
                }
                break;
            case 'pwd':
                printWorkingDirectory();
                break;
            case 'cat':
                if (args.length < 2) {
                    appendToTerminal(`<p>Usage: cat &lt;filename&gt;</p>`);
                } else {
                    catFile(args[1]);
                }
                break;
            case 'whoami':
                showWhoami(terminal, clearTerminal, appendToTerminal);
                break;
            case 'showcase':
                showShowcase(terminal, clearTerminal, appendToTerminal);
                break;
            case 'ping':
                showPing(terminal, clearTerminal, appendToTerminal);
                break;
            case 'more':
                showMore(terminal, clearTerminal, appendToTerminal);
                break;
            case 'help':
                showHelp(terminal, clearTerminal, appendToTerminal);
                break;
            case 'clear':
                clearTerminal();
                break;
            case 'browser':
                appendToTerminal(`<p>Opening browser...</p>`);
                const browser = document.getElementById('browser');
                if (browser) browser.classList.remove('minimized');
                break;
            case 'mail':
                appendToTerminal(`<p>Opening mail app...</p>`);
                showMailApp();
                break;
            case '':
                // Do nothing for empty command
                break;
            default:
                appendToTerminal(`<p>Command not found: ${cmd}. Type <strong>help</strong> to see available commands.</p>`);
                break;
        }
    }
    
    // Event listeners
    commandInput.addEventListener('keydown', (e) => {
        // Debugging
        console.log(`Key pressed: ${e.key}, Command: ${commandInput.value}`);
        
        if (e.key === 'Enter') {
            // Always prevent default Enter behavior first
            e.preventDefault();
            
            const command = commandInput.value.trim().toLowerCase();
            console.log(`Processing command: ${command}`);
            
            // Echo the command with the current directory
            appendToTerminal(`<p><span class="prompt-symbol">${currentDirectory} $</span> ${command}</p>`);
            
            // Immediately clear the input to prevent issues
            // Store value in a variable first so we don't lose it
            const commandToExecute = command;
            
            // Clear using multiple approaches
            commandInput.value = '';
            
            // Execute the command after clearing input
            executeCommand(commandToExecute);
            
            // Add to history if not empty
            if (commandToExecute) {
                commandHistory.push(commandToExecute);
                historyIndex = commandHistory.length;
            }
            
            // Additional force-clearing with timeout
            setTimeout(() => {
                commandInput.value = '';
                // Force focus and blur to reset any browser state
                commandInput.blur();
                commandInput.focus();
            }, 0);
            
            // Handle "back" command specially (previously in a separate event listener)
            if (commandToExecute === 'back') {
                resetTerminal();
            }
            
            return false; // Extra prevention of event propagation
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                commandInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                commandInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                commandInput.value = '';
            }
        } else if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            resetTerminal();
        }
    });
    
    // Ensure input gets focus when clicking in terminal
    terminal.addEventListener('click', (e) => {
        if (!e.target.classList.contains('control') && 
            !e.target.classList.contains('resize-handle')) {
            commandInput.focus();
        }
    });
    
    // Initialize the terminal
    console.log('Terminal resetting...');
    resetTerminal();
    console.log('Terminal ready.');
    
    // Return the terminal controller for possible external use
    return {
        clearTerminal,
        appendToTerminal,
        resetTerminal,
        executeCommand
    };
}

// Export a file system object (simplified for brevity)
export const fileSystem = {
    '/': {
        type: 'directory',
        contents: {
            'home': {
                type: 'directory',
                contents: {
                    'user': {
                        type: 'directory',
                        contents: {
                            'projects': {
                                type: 'directory',
                                contents: {
                                    'website.html': { type: 'file', content: 'Terminal Website Project' },
                                    'app.js': { type: 'file', content: 'Main application code' },
                                    'README.md': { type: 'file', content: 'Project documentation' }
                                }
                            },
                            'documents': {
                                type: 'directory',
                                contents: {
                                    'resume.pdf': { type: 'file', content: 'Resume document' },
                                    'notes.txt': { type: 'file', content: 'Personal notes' }
                                }
                            },
                            'about.txt': { type: 'file', content: 'Information about the user' }
                        }
                    }
                }
            },
            'bin': {
                type: 'directory',
                contents: {
                    'whoami': { type: 'file', executable: true },
                    'showcase': { type: 'file', executable: true },
                    'ping': { type: 'file', executable: true },
                    'more': { type: 'file', executable: true }
                }
            }
        }
    }
};

// Get directory object from path function
export function getDirectoryFromPath(path, currentDir = '/home/user') {
    // Handle absolute and relative paths
    let targetPath = path;
    if (!path.startsWith('/')) {
        // Relative path - combine with current directory
        targetPath = currentDir + '/' + path;
    }
    
    // Normalize the path (handle ../ and ./)
    const parts = targetPath.split('/').filter(p => p !== '');
    const normalized = [];
    for (const part of parts) {
        if (part === '..') {
            normalized.pop();
        } else if (part !== '.') {
            normalized.push(part);
        }
    }
    
    targetPath = '/' + normalized.join('/');
    
    // Navigate to the path
    let current = fileSystem['/'];
    if (targetPath === '/') return current;
    
    const pathParts = targetPath.split('/').filter(p => p !== '');
    
    for (const part of pathParts) {
        if (!current.contents || !current.contents[part]) {
            return null; // Path doesn't exist
        }
        current = current.contents[part];
    }
    
    return current;
} 