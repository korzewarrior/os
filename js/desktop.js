// Desktop management system
// Responsible for initializing desktop, adding file icons, and handling file interactions
import { createWindowManager } from './window-manager.js';
import { openPdfFile, openTextFile } from './programs/pdf-viewer.js';
import { openTextEditor } from './programs/text-editor.js';

// Track which files are on the desktop
let desktopFiles = [];

/**
 * Initialize the desktop environment
 */
export function initializeDesktop() {
    console.log('Initializing desktop...');
    
    // Create desktop files container if it doesn't exist
    if (!document.getElementById('desktop-files')) {
        const desktopContainer = document.createElement('div');
        desktopContainer.id = 'desktop-files';
        document.body.appendChild(desktopContainer);
    }
    
    // Add a default resume.pdf file to the desktop
    addDesktopFile('resume.pdf', 'application/pdf', 'img/icons/pdf-icon.svg');
    
    // Add another example document
    addDesktopFile('document.txt', 'text/plain', 'img/icons/document-icon.svg');
}

/**
 * Add a file to the desktop
 * @param {string} fileName - Name of the file
 * @param {string} fileType - MIME type of the file
 * @param {string} iconUrl - URL to the icon image
 */
export function addDesktopFile(fileName, fileType, iconUrl) {
    const desktopContainer = document.getElementById('desktop-files');
    
    if (!desktopContainer) {
        console.error('Desktop container not found');
        return;
    }
    
    // Create file element
    const fileElement = document.createElement('div');
    fileElement.className = 'desktop-file';
    fileElement.dataset.filename = fileName;
    fileElement.dataset.filetype = fileType;
    
    // Create icon
    const iconElement = document.createElement('img');
    iconElement.src = iconUrl;
    iconElement.alt = fileName;
    iconElement.className = 'desktop-file-icon';
    
    // Create label
    const labelElement = document.createElement('div');
    labelElement.className = 'desktop-file-label';
    labelElement.textContent = fileName;
    
    // Append to file element
    fileElement.appendChild(iconElement);
    fileElement.appendChild(labelElement);
    
    // Add click event for selecting the file
    fileElement.addEventListener('click', (event) => {
        // Remove selected class from all files
        document.querySelectorAll('.desktop-file').forEach(file => {
            file.classList.remove('desktop-file-selected');
        });
        
        // Add selected class to this file
        fileElement.classList.add('desktop-file-selected');
        
        // Prevent immediate opening on single click
        if (event.detail === 1) {
            event.stopPropagation();
        }
    });
    
    // Add double-click event to open the file
    fileElement.addEventListener('dblclick', () => {
        openDesktopFile(fileName, fileType);
    });
    
    // Add to desktop
    desktopContainer.appendChild(fileElement);
    
    // Track the file
    desktopFiles.push({
        name: fileName,
        type: fileType,
        element: fileElement
    });
    
    console.log(`Added ${fileName} to desktop`);
}

/**
 * Open a file from the desktop
 * @param {string} fileName - Name of the file to open
 * @param {string} fileType - MIME type of the file
 */
export function openDesktopFile(fileName, fileType) {
    console.log(`Opening ${fileName} (${fileType})`);
    
    // Handle different file types
    switch (fileType) {
        case 'application/pdf':
            openPdfFile(fileName);
            break;
        case 'text/plain':
            // Use our new text editor for text files instead of the file viewer
            const sampleTextContent = 
`# Project Notes

This is a simple text document that demonstrates
the text editing capabilities of our OS.

## Features to implement:

- [x] Create desktop interface
- [x] Add file icons
- [x] Implement PDF viewer
- [x] Add text file support
- [x] Add text editor
- [ ] Implement file creation
- [ ] Add drag and drop support
- [ ] Create file context menu

Feel free to add more desktop files as needed.`;
            
            openTextEditor(fileName, sampleTextContent);
            break;
        default:
            console.warn(`Unsupported file type: ${fileType}`);
            alert(`Cannot open file: ${fileName}\nUnsupported file type: ${fileType}`);
            break;
    }
} 