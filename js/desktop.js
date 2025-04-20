// Desktop management system
// Responsible for initializing desktop, adding file icons, and handling file interactions
import { createWindowManager } from './window-manager.js';
import { openPdfFile, showPdfViewer } from './programs/pdf-viewer.js';
import { FileSystem } from './filesystem.js'; // Corrected import path
import { Program, ProgramManager } from './program.js'; // Corrected import path for ProgramManager

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

     // Add web links using a consistent icon
     // Use the browser icon as the placeholder for web links
     const linkIconPath = 'img/icons/browser-icon.png'; 
     const links = [
        { name: 'korze.org', type: 'weblink', icon: linkIconPath, url: 'https://korze.org' },
        { name: 'Leviathan', type: 'weblink', icon: linkIconPath, url: 'https://leviathan.korze.org' },
        { name: 'better.game', type: 'weblink', icon: linkIconPath, url: 'https://korzewarrior.github.io/better.game/' }
     ];

     const desktopContainer = document.getElementById('desktop-files');

     // Add default files (like PDFs)
     defaults.forEach(file => {
         const uiExists = desktopContainer.querySelector(`.desktop-file[data-filename="${file.name}"]`);
         if (!uiExists) { 
             console.log(`Adding default file to desktop UI: ${file.name}`);
             // Pass null for URL for regular files
             addDesktopFileToUI(file.name, file.type, file.icon, desktopContainer, null);
             // Note: FileSystem logic for defaults removed as it wasn't fully implemented
         }
     });
     
     // Add web link icons
     links.forEach(link => {
          const uiExists = desktopContainer.querySelector(`.desktop-file[data-filename="${link.name}"]`);
         if (!uiExists) { 
             console.log(`Adding web link icon to desktop UI: ${link.name}`);
             addDesktopFileToUI(link.name, link.type, link.icon, desktopContainer, link.url);
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
function addDesktopFileToUI(fileName, fileType, iconUrl, container, url = null) {
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
    if (url) {
        fileElement.dataset.url = url; // Store URL for weblinks
    }
    
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
        openDesktopFile(fileName, fileType, url); // Pass URL along
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
 * Open a file or link from the desktop.
 * @param {string} fileName - Name of the file/link icon
 * @param {string} fileType - Inferred type ('application/pdf', 'weblink', etc.)
 * @param {string|null} url - The URL if it's a weblink
 */
export function openDesktopFile(fileName, fileType, url = null) {
    console.log(`[Desktop] Opening ${fileName} (Type: ${fileType}, URL: ${url})`);
    
    const actualFileType = fileType === 'unknown' || !fileType ? 
        (fileName.endsWith('.pdf') ? 'application/pdf' : (url ? 'weblink' : 'unknown')) 
        : fileType;
    console.log(`[Desktop] Determined actual file type: ${actualFileType}`);

    switch (actualFileType) {
        case 'application/pdf':
            console.log(`[Desktop] Launching PDF Viewer for: ${fileName}`);
            // Use ProgramManager directly to launch/show the viewer
            const pdfViewerProgram = ProgramManager.launch('pdf-viewer', { filePath: fileName });
             if (pdfViewerProgram) {
                 // REMOVED: pdfViewerProgram.show(); 
                 // The show logic should be handled internally by the program 
                 // after it has loaded the content in its init/openFile method.
             } else {
                 console.error('Could not launch PDF Viewer program.');
                 alert('Error: Could not open PDF Viewer.');
             }
            break;
        case 'weblink':
            if (url) {
                console.log(`[Desktop] Opening weblink: ${url}`);
                // Get the browser program instance (launch if needed)
                const browserProgram = ProgramManager.launch('browser'); 
                if (browserProgram && typeof browserProgram.navigateTo === 'function') {
                    browserProgram.navigateTo(url);
                    // navigateTo should handle showing the window
                } else {
                     console.error('Could not get browser program instance or navigateTo method.');
                     alert('Error: Could not open link in browser.');
                }
            } else {
                 console.error(`[Desktop] Weblink icon "${fileName}" is missing URL data.`);
                 alert('Error: Link is broken (missing URL).');
            }
            break;
        default:
            console.warn(`[Desktop] Unsupported file type: ${actualFileType} for file ${fileName}`);
            alert(`Cannot open item: ${fileName}\nUnsupported type.`);
            break;
    }
} 