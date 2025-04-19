// PDF Viewer implementation (Formerly File Viewer)
import { createWindowManager } from '../window-manager.js';

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
    const pdfViewerWindow = window.windowManagers ? window.windowManagers['pdf-viewer'] : null;
    if (pdfViewerWindow) {
        pdfViewerWindow.show();
    } else {
        console.error('PDF Viewer window not initialized');
    }
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
 * @param {string} fileName - Name of the PDF file to open
 */
export function openPdfFile(fileName) {
    console.log(`PDF Viewer: Opening PDF ${fileName}`);
    const title = document.querySelector('.pdf-viewer-title');
    const content = document.querySelector('.pdf-viewer-content');
    
    if (!title || !content) {
        console.error('PDF Viewer elements not found');
        return;
    }
    
    // Update the title
    title.textContent = fileName;
    
    // Clear existing content
    content.innerHTML = '';
    
    // For resume.pdf, create a simulated resume view
    if (fileName === 'resume.pdf') {
        // Create a simulated PDF view for the resume
        const resumeContent = document.createElement('div');
        resumeContent.className = 'simulated-pdf-content';
        
        // Add resume content
        resumeContent.innerHTML = `
            <div class="resume-header">
                <h1>Jane Smith</h1>
                <div class="contact-info">
                    <p>jane.smith@example.com | (987) 654-3210 | San Francisco, CA</p>
                </div>
            </div>
            
            <div class="resume-section">
                <h2>Education</h2>
                <div class="resume-item">
                    <h3>Computer Science, M.S.</h3>
                    <p>Stanford University, 1995-1997</p>
                </div>
                <div class="resume-item">
                    <h3>Computer Science, B.S.</h3>
                    <p>Massachusetts Institute of Technology, 1991-1995</p>
                </div>
            </div>
            
            <div class="resume-section">
                <h2>Experience</h2>
                <div class="resume-item">
                    <h3>Chief Technology Officer</h3>
                    <p>Global Tech Solutions, 2015-Present</p>
                    <ul>
                        <li>Leading a team of 200+ engineers in developing cutting-edge technology solutions</li>
                        <li>Overseeing the company's technology strategy and innovation roadmap</li>
                        <li>Implemented a cloud-based infrastructure that reduced costs by 40%</li>
                    </ul>
                </div>
                <div class="resume-item">
                    <h3>Senior Network Architect</h3>
                    <p>Innovative Networks Inc., 2005-2015</p>
                    <ul>
                        <li>Designed and implemented scalable network solutions for Fortune 500 companies</li>
                        <li>Managed a team of network engineers to ensure optimal performance and security</li>
                        <li>Developed a proprietary network monitoring tool that increased uptime by 25%</li>
                    </ul>
                </div>
                <div class="resume-item">
                    <h3>Software Engineer</h3>
                    <p>Tech Pioneers, 1997-2005</p>
                    <ul>
                        <li>Developed enterprise-level software applications in Java and C++</li>
                        <li>Collaborated with cross-functional teams to deliver high-quality software products</li>
                        <li>Optimized algorithms to improve processing speed by 50%</li>
                    </ul>
                </div>
            </div>
            
            <div class="resume-section">
                <h2>Skills</h2>
                <div class="skills-list">
                    <span class="skill-item">Java</span>
                    <span class="skill-item">C++</span>
                    <span class="skill-item">Cloud Computing</span>
                    <span class="skill-item">Network Architecture</span>
                    <span class="skill-item">Cybersecurity</span>
                    <span class="skill-item">Project Management</span>
                </div>
            </div>
        `;
        
        content.appendChild(resumeContent);
    } else {
        // Generic PDF message for other files
        content.innerHTML = `<div class="pdf-placeholder">This is a placeholder for ${fileName}</div>`;
    }
    
    // Show the file viewer
    showPdfViewer();
}

/**
 * Open a text file in the viewer
 * @param {string} fileName - Name of the text file to open
 */
export function openTextFile(fileName) {
    console.log(`PDF Viewer: Opening Text ${fileName}`); // Log clarifies it's currently in PDF viewer
    const title = document.querySelector('.pdf-viewer-title');
    const content = document.querySelector('.pdf-viewer-content');
    
    if (!title || !content) {
        console.error('PDF Viewer elements not found');
        return;
    }
    
    // Update the title
    title.textContent = fileName;
    
    // Clear existing content
    content.innerHTML = '';
    
    // Create a simulated text view
    const textContent = document.createElement('div');
    textContent.className = 'text-file-content';
    
    // Add text content based on filename
    if (fileName === 'document.txt') {
        textContent.innerHTML = `
            <pre class="text-content">
# Project Notes

This is a simple text document that demonstrates
the text viewing capabilities of our OS.

## Features to implement:

- [x] Create desktop interface
- [x] Add file icons
- [x] Implement PDF viewer
- [x] Add text file support
- [ ] Implement file creation
- [ ] Add drag and drop support
- [ ] Create file context menu

Feel free to add more desktop files as needed.
            </pre>
        `;
    } else {
        textContent.innerHTML = `<pre class="text-content">Contents of ${fileName}</pre>`;
    }
    
    content.appendChild(textContent);
    
    // Show the viewer
    showPdfViewer();
} 