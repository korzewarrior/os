// Desktop management system
// Responsible for initializing desktop, adding file icons, and handling file interactions
import { createWindowManager } from './window-manager.js';
import { openPdfFile, showPdfViewer } from './programs/pdf-viewer.js';
import { FileSystem } from './filesystem.js'; // Corrected import path

// Track which files are on the desktop (Consider if this array is still needed or if querying DOM is better)
let desktopFiles = [];

/**
 * Initialize the desktop environment
 */
export function initializeDesktop() {
    console.log('Initializing desktop...');
    
    // Create desktop files container if it doesn't exist
    const desktopContainer = document.getElementById('desktop-files') || createDesktopContainer();
    
    // Initial setup - potentially load existing files from FileSystem?
    // For now, just add defaults if they don't exist in FileSystem
    initializeDefaultFiles();

    // Listen for files saved by any application (e.g., Text Editor)
    document.addEventListener('file-saved', (event) => {
        const { fileName, fileType } = event.detail; // Use fileType from event if provided
        console.log(`Desktop received file-saved event for: ${fileName}, Type: ${fileType}`);

        // Determine icon based on file type (simple mapping for now)
        const iconUrl = getIconForFileType(fileType, fileName);

        // Check if the file icon already exists on the desktop
        const existingFileElement = desktopContainer.querySelector(`.desktop-file[data-filename="${fileName}"]`);
        
        if (!existingFileElement) {
            console.log(`File icon for ${fileName} not found on desktop, creating it.`);
            // Add the file icon to the desktop UI
            addDesktopFileToUI(fileName, fileType || 'unknown', iconUrl, desktopContainer);
        } else {
            console.log(`File icon for ${fileName} already exists on desktop.`);
            // Optional: Update icon if fileType changed? For now, do nothing.
        }
    });
}

/**
 * Create the desktop container element if it doesn't exist.
 */
function createDesktopContainer() {
     if (!document.getElementById('desktop-files')) {
        const desktopContainer = document.createElement('div');
        desktopContainer.id = 'desktop-files';
        document.body.appendChild(desktopContainer);
        return desktopContainer;
    }
    return document.getElementById('desktop-files');
}

/**
 * Add default files if they aren't already in the virtual file system.
 */
function initializeDefaultFiles() {
     const defaults = [
        { name: 'resume.pdf', type: 'application/pdf', icon: 'img/icons/pdf-icon.svg' },
        { name: 'commands.pdf', type: 'application/pdf', icon: 'img/icons/pdf-icon.svg' }
     ];

     const desktopContainer = document.getElementById('desktop-files');

     defaults.forEach(file => {
         // Check if file exists in FileSystem AND on desktop UI
         const fsExists = FileSystem.readFile(file.name) !== null;
         const uiExists = desktopContainer.querySelector(`.desktop-file[data-filename="${file.name}"]`);
         
         if (!uiExists) { // Only add if not already on UI
             console.log(`Adding default file to desktop UI: ${file.name}`);
             addDesktopFileToUI(file.name, file.type, file.icon, desktopContainer);
             // Optional: If it doesn't exist in FileSystem either, write it
             if (!fsExists && file.content) {
                 FileSystem.writeFile(file.name, file.content);
             }
         }
     });
}

/**
 * Determines the icon URL based on file type or name.
 */
function getIconForFileType(fileType, fileName) {
    if (fileType === 'application/pdf' || fileName?.endsWith('.pdf')) {
        return 'img/icons/pdf-icon.svg';
    }
    // Add more types as needed
    return 'img/icons/unknown-icon.svg'; // Default/unknown icon
}

/**
 * Adds a single file icon element to the desktop DOM.
 * Separated from the main export function for clarity.
 */
function addDesktopFileToUI(fileName, fileType, iconUrl, container) {
    if (!container) {
        console.error('Desktop container not found for adding file UI');
        return null;
    }

    // Check if element already exists to prevent duplicates
     if (container.querySelector(`.desktop-file[data-filename="${fileName}"]`)) {
         console.warn(`Icon for ${fileName} already exists in UI. Skipping add.`);
         return container.querySelector(`.desktop-file[data-filename="${fileName}"]`);
     }

    const fileElement = document.createElement('div');
    fileElement.className = 'desktop-file';
    fileElement.dataset.filename = fileName;
    fileElement.dataset.filetype = fileType;
    
    const iconElement = document.createElement('img');
    iconElement.src = iconUrl;
    iconElement.alt = fileName;
    iconElement.className = 'desktop-file-icon';
    
    const labelElement = document.createElement('div');
    labelElement.className = 'desktop-file-label';
    labelElement.textContent = fileName;
    
    fileElement.appendChild(iconElement);
    fileElement.appendChild(labelElement);
    
    // Single click: Select
    fileElement.addEventListener('click', (event) => {
        document.querySelectorAll('#desktop-files .desktop-file').forEach(file => {
            file.classList.remove('desktop-file-selected');
        });
        fileElement.classList.add('desktop-file-selected');
        event.stopPropagation();
    });
    
    // Double click: Open
    fileElement.addEventListener('dblclick', () => {
        // Use the updated openDesktopFile function
        openDesktopFile(fileName, fileType); 
    });
    
    container.appendChild(fileElement);
    return fileElement;
}

/**
 * Add a file to the desktop (Exported function, might be less used now)
 * @param {string} fileName - Name of the file
 * @param {string} fileType - MIME type of the file
 * @param {string} iconUrl - URL to the icon image
 */
export function addDesktopFile(fileName, fileType, iconUrl) {
     console.warn('addDesktopFile function is potentially deprecated. Use FileSystem.writeFile and rely on file-saved event.');
     const desktopContainer = document.getElementById('desktop-files');
     // Add to UI
     const fileElement = addDesktopFileToUI(fileName, fileType, iconUrl, desktopContainer);
     // Optional: Add to FileSystem if not already there? Assume content is empty or needs to be provided.
     if (FileSystem.readFile(fileName) === null) {
         FileSystem.writeFile(fileName, ''); // Write empty file if adding manually
     }
     // Update local tracking array (if still used)
     if (fileElement && !desktopFiles.some(f => f.name === fileName)) {
         desktopFiles.push({ name: fileName, type: fileType, element: fileElement });
     }
}


/**
 * Open a file from the desktop using FileSystem for text files.
 * @param {string} fileName - Name of the file to open
 * @param {string} fileType - MIME type or inferred type of the file
 */
export function openDesktopFile(fileName, fileType) {
    console.log(`[Desktop] Attempting to open ${fileName} (Detected Type: ${fileType})`);
    
    // Infer type if needed (e.g., from extension)
    const actualFileType = fileType === 'unknown' || !fileType ? 
        (fileName.endsWith('.pdf') ? 'application/pdf' : (fileName.endsWith('.txt') ? 'text/plain' : 'unknown')) 
        : fileType;
    console.log(`[Desktop] Determined actual file type: ${actualFileType}`);

    switch (actualFileType) {
        case 'application/pdf':
            if (fileName === 'commands.pdf') {
                openCommandsReferencePdf();
            } else {
                console.warn(`Opening generic PDF "${fileName}". Content loading might be needed.`);
                openPdfFile(fileName);
            }
            break;
        default:
            console.warn(`[Desktop] Unsupported file type: ${actualFileType} for file ${fileName}`);
            alert(`Cannot open file: ${fileName}\nUnsupported file type.`);
            break;
    }
}

/**
 * Opens a simulated PDF showing available terminal commands.
 * (Keep this function as is for the specific commands.pdf)
 */
function openCommandsReferencePdf() {
    const fileName = 'commands.pdf';
    console.log(`PDF Viewer: Opening ${fileName}`);
    const title = document.querySelector('.pdf-viewer-title');
    const content = document.querySelector('.pdf-viewer-content');
    
    if (!title || !content) {
        console.error('PDF Viewer elements not found');
        return;
    }

    // Update the title
    title.textContent = fileName;

    // Commands list (from terminal.js reset function initially)
    const commandsHtml = `
        <h1>Terminal Commands Reference</h1>
        <p>Here are the available commands:</p>
        <ul>
            <li><strong>ls</strong>: List files in current directory</li>
            <li><strong>cd [dir]</strong>: Change directory (e.g., <code>cd projects</code>, <code>cd ..</code>)</li>
            <li><strong>pwd</strong>: Show current directory path</li>
            <li><strong>cat [file]</strong>: Display file contents (e.g., <code>cat about.txt</code>)</li>
            <li><strong>whoami</strong>: Display user information</li>
            <li><strong>showcase</strong>: Show component showcase</li>
            <li><strong>ping [host]</strong>: Simulate network ping</li>
            <li><strong>more</strong>: Display text page by page (example)</li>
            <li><strong>clear</strong>: Clear terminal screen</li>
            <li><strong>help</strong>: Show detailed help for all commands</li>
            <li><strong>browser</strong>: Open the web browser app</li>
            <li><strong>mail</strong>: Open the mail app</li>
        </ul>
        <p><em>Tip: Use Ctrl+C to clear the current input or reset certain command states.</em></p>
    `;

    // Create a simulated PDF view
    const pdfContent = document.createElement('div');
    pdfContent.className = 'simulated-pdf-content'; // Use existing style
    pdfContent.innerHTML = commandsHtml;
    
    content.innerHTML = ''; // Clear previous content
    content.appendChild(pdfContent);
    
    // Ensure PDF viewer is shown
    showPdfViewer(); // Make sure to import this function
} 