// PDF Viewer implementation (Formerly File Viewer)
import { Program, ProgramManager } from '../program.js';
// Need to import TerminalProgram to access its static commands
import { TerminalProgram } from './terminal.js';

// Global reference to pdf viewer window manager
// let fileViewerWindow; // No longer needed as we fetch from global registry

/**
 * Initialize the PDF viewer application
 */
export function initializePdfViewer() {
    console.log('PDF Viewer initializing...');
    
    // Window manager is initialized globally in script.js
    // Initialization logic specific to PDF viewer can go here if needed in the future.

    return {
        showPdfViewer,
        hidePdfViewer,
        openPdfFile,
        openTextFile // Keep for now, though consider moving text handling
    };
}

/**
 * Show the PDF viewer application
 */
export function showPdfViewer() {
    console.warn('showPdfViewer() called directly. Use ProgramManager.launch("pdf-viewer").show() instead.');
    const instance = ProgramManager.launch('pdf-viewer');
    instance?.show();
}

/**
 * Hide the PDF viewer application
 */
export function hidePdfViewer() {
    const pdfViewerWindow = window.windowManagers ? window.windowManagers['pdf-viewer'] : null;
    if (pdfViewerWindow) {
        pdfViewerWindow.minimize();
    } else {
        console.error('PDF Viewer window not initialized - cannot hide');
    }
}

/**
 * Open a PDF file in the viewer
 * @param {string} filePath - Path to the PDF file to open
 */
export function openPdfFile(filePath) {
    console.warn('openPdfFile() called directly. Use ProgramManager.launch("pdf-viewer", {filePath}).show() instead.');
    const instance = ProgramManager.launch('pdf-viewer', { filePath: filePath });
    instance?.show(); // Launch or get existing, then show
}

/**
 * Open a text file in the viewer
 * @param {string} filePath - Path to the text file to open
 */
export function openTextFile(filePath) {
    console.warn('openTextFile() called directly. Use ProgramManager.launch("pdf-viewer", {filePath}).show() instead.');
    const instance = ProgramManager.launch('pdf-viewer', { filePath: filePath });
    instance?.show(); 
}

// PDF Viewer logic (will be encapsulated)

class PdfViewerProgram extends Program {
    static BASE_ID = 'pdf-viewer';
    static DEFAULT_TITLE = 'PDF Viewer';

    constructor(instanceId, options = {}) {
        super(instanceId, PdfViewerProgram.DEFAULT_TITLE, PdfViewerProgram.BASE_ID, 800, 600);
        this.initialized = false;
        // Options might include initial file to open, e.g., options.filePath
        this.initialFilePath = options.filePath || null;
    }

    // Override createWindowElement to add basic viewer structure
    createWindowElement() {
        const windowElement = super.createWindowElement();
        const contentArea = windowElement.querySelector('.window-content');
        if (!contentArea) return windowElement;
        
        // No specific complex structure needed for the content area by default
        // The openFile method will populate it.
        contentArea.innerHTML = `<p style="padding: 20px;">PDF Viewer Ready. Open a file.</p>`; 
        contentArea.style.padding = '0'; // Remove base padding if content adds its own
        contentArea.style.overflow = 'auto'; // Ensure content scrolls

        return windowElement;
    }

    async init() {
        if (this.initialized) return;
        await super.init();
        console.log(`[PdfViewerProgram ${this.instanceId}] Initializing...`);
        
        // No complex listeners needed for basic viewer
        this.initialized = true;
        console.log(`[PdfViewerProgram ${this.instanceId}] Initialization complete.`);
        
        // Open initial file if provided
        if (this.initialFilePath) {
             this.openFile(this.initialFilePath);
        }
    }

    // Method to open and display a file (handles PDF/Text distinction)
    openFile(filePath) {
         if (!this.initialized || !this.windowContent || !this.windowElement) {
             console.error('PDF Viewer not ready to open file.');
             // Attempt late init?
             this.init().then(() => this.displayFileContent(filePath))
                       .catch(err => console.error('Late init failed for PDF Viewer', err));
             return;
         }
         this.displayFileContent(filePath);
    }
    
    displayFileContent(filePath) {
         const fileName = filePath.substring(filePath.lastIndexOf('/') + 1) || filePath;
         console.log(`[PdfViewerProgram ${this.instanceId}] Displaying: ${fileName}`);
         
         this.setTitle(fileName); // Update window title
         this.windowContent.innerHTML = ''; // Clear previous content

         if (fileName.toLowerCase().endsWith('.pdf')) {
             this.displayPdfContent(fileName);
         } else if (fileName.toLowerCase().endsWith('.txt')) {
             this.displayTextContent(fileName); 
         } else {
             this.windowContent.innerHTML = `<p class="pdf-placeholder">Cannot display file type: ${fileName}</p>`;
         }
         this.show(); // Make sure window is visible
    }
    
    displayPdfContent(fileName) {
         let htmlContent = '';
         // Special handling for known PDFs
         if (fileName === 'resume.pdf') {
             // Paste resume HTML
             htmlContent = `
                <div class="resume-header">
                    <h1>Jane Smith</h1>
                    <div class="contact-info">
                        <p>jane.smith@example.com | (987) 654-3210 | San Francisco, CA</p>
                    </div>
                </div>
                <div class="resume-section"><h2>Education</h2>...</div> 
                <div class="resume-section"><h2>Experience</h2>...</div>
                <div class="resume-section"><h2>Skills</h2>...</div>
                `; // (Ensure full resume HTML is included here)
         } else if (fileName === 'commands.pdf') {
              // Dynamically generate commands list
              let commandListHtml = '';
              const commands = TerminalProgram.COMMANDS || {}; // Get commands from Terminal class
              const sortedCommands = Object.keys(commands).sort();
              
              sortedCommands.forEach(cmd => {
                 commandListHtml += `<li><strong>${cmd}</strong>: ${commands[cmd]}</li>`;
              });

              htmlContent = `
                <h1>Terminal Commands Reference</h1>
                <p>Available commands:</p>
                <ul>
                    ${commandListHtml} 
                </ul>
                <p><em>Tip: Use Arrow Keys for command history.</em></p>
                `;
         } else {
             htmlContent = `<div class="pdf-placeholder">Simulated view of ${fileName}</div>`;
         }
         const pdfDiv = document.createElement('div');
         pdfDiv.className = 'simulated-pdf-content'; 
         pdfDiv.innerHTML = htmlContent;
         this.windowContent.appendChild(pdfDiv);
    }
    
    displayTextContent(fileName) {
        let text = `Placeholder for ${fileName}`; // Default
        // Load actual content if possible - requires FileSystem access
        // For now, using placeholder based on name
        if (fileName === 'notes.txt') { 
             text = "My personal notes...\n- Item 1\n- Item 2";
        }
        const pre = document.createElement('pre');
        pre.className = 'text-file-content'; 
        pre.style.fontFamily = 'var(--font-monospace)';
        pre.style.color = 'var(--text-primary)';
        pre.style.backgroundColor = 'var(--window-bg-alt)';
        pre.style.padding = '20px';
        pre.style.whiteSpace = 'pre-wrap'; // Allow text wrapping
        pre.textContent = text;
        this.windowContent.appendChild(pre);
    }
}

// Register the Program
ProgramManager.register(PdfViewerProgram);

// Remove ALL old compatibility exports
// export function showPdfViewer() { ... }
// export function openPdfFile(filePath) { ... }
// export function openTextFile(filePath) { ... } 
// export function initializePdfViewer() { ... } 