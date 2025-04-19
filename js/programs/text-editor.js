/**
 * Text Editor Program
 * Provides functionality to edit and save text files
 */
import { Program, ProgramManager } from '../program.js';

export class TextEditorProgram extends Program {
    constructor(options = {}) {
        super('text-editor', 'Text Editor', 700, 500);
        this.loadStylesheet('styles/programs/text-editor.css');
        this.icon = 'fa-file-alt';
        this.currentFile = options.file || null;
        this.content = options.content || '';
        this.isModified = false;
    }

    async init() {
        await super.init();
        this.render();
        
        if (this.currentFile) {
            this.setTitle(`${this.currentFile} - Text Editor`);
            this.loadContent(this.content);
        }
        
        // Add event listeners for menu actions
        this.setupMenuListeners();
    }
    
    setupMenuListeners() {
        const windowElement = document.getElementById(this.id);
        if (windowElement) {
            // Listen for new file event
            windowElement.addEventListener('new-file', () => {
                this.newFile();
            });
            
            // Listen for save file event
            windowElement.addEventListener('save-file', () => {
                this.saveFile();
            });
        }
    }
    
    render() {
        // Create a simple text editor with just a textarea
        const textArea = document.createElement('textarea');
        textArea.className = 'text-editor-textarea';
        textArea.id = 'editor-textarea';
        textArea.placeholder = 'Type your text here...';
        textArea.addEventListener('input', () => {
            this.isModified = true;
            this.updateTitle();
        });
        
        this.windowContent.appendChild(textArea);
    }
    
    /**
     * Load content into the editor
     * @param {string} content - The text content to load
     */
    loadContent(content) {
        const textarea = document.getElementById('editor-textarea');
        if (textarea) {
            textarea.value = content;
            this.isModified = false;
            this.updateTitle();
        }
    }
    
    /**
     * Save the current file
     */
    saveFile() {
        const textarea = document.getElementById('editor-textarea');
        if (textarea) {
            this.content = textarea.value;
            this.isModified = false;
            this.updateTitle();
            
            // In a real application, we would save to a file system
            // For this simulation, we just update our content property
            console.log(`Saved file: ${this.currentFile}`);
            console.log(`Content: ${this.content.substring(0, 50)}...`);
            
            // Dispatch a custom event that could be listened to by other parts of the application
            const saveEvent = new CustomEvent('file-saved', {
                detail: {
                    fileName: this.currentFile,
                    content: this.content
                }
            });
            document.dispatchEvent(saveEvent);
        }
    }
    
    /**
     * Create a new file
     */
    newFile() {
        if (this.isModified) {
            if (confirm('You have unsaved changes. Do you want to discard them?')) {
                this.resetEditor();
            }
        } else {
            this.resetEditor();
        }
    }
    
    /**
     * Reset the editor to a blank state
     */
    resetEditor() {
        this.currentFile = 'untitled.txt';
        this.content = '';
        this.isModified = false;
        
        const textarea = document.getElementById('editor-textarea');
        if (textarea) {
            textarea.value = '';
        }
        
        this.updateTitle();
    }
    
    /**
     * Update the window title to reflect the current state
     */
    updateTitle() {
        const modifiedIndicator = this.isModified ? '*' : '';
        this.setTitle(`${this.currentFile}${modifiedIndicator} - Text Editor`);
    }
    
    /**
     * Set the window title
     * @param {string} title - The new title
     */
    setTitle(title) {
        const titleElement = document.querySelector(`.${this.id}-title`);
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    /**
     * Open a file in the editor
     * @param {string} fileName - Name of the file to open
     * @param {string} content - Content of the file
     */
    openFile(fileName, content) {
        this.currentFile = fileName;
        this.content = content;
        this.loadContent(content);
    }
}

// Register the Text Editor program
ProgramManager.register(TextEditorProgram);

// Export a function to show the text editor with a specific file
export function openTextEditor(fileName = null, content = '') {
    const textEditor = ProgramManager.launch('text-editor', {
        file: fileName,
        content: content
    });
    return textEditor;
}