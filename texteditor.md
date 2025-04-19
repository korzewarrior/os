# Report: Text Editor Functionality Analysis

**1. Initialization and Window Management:**

*   **HTML Structure (`index.html`):** The text editor's window is defined by a `div` with the ID `text-editor` and class `window-container`. Inside, it has a standard `.window-header` (containing controls and title) and a `.text-editor-content.window-content` div intended to hold the editor's UI. A `.resize-handle` is also present.
*   **Initialization (`js/script.js`):**
    *   The `TextEditorProgram` class is imported from `js/programs/text-editor.js`.
    *   During system initialization (`startSystemInitialization`), the `initializeWindowManagement` function calls `createWindowManager('text-editor', {...})` to set up window management (dragging, resizing, minimizing, focus) for the `#text-editor` div via the `WindowManager` class (`js/window-manager.js`). It's initially set to `minimized: true`.
    *   The `initializeApplications` function creates an instance of the `TextEditorProgram`: `new TextEditorProgram()`.
*   **Program Base Class (`js/program.js`):**
    *   `TextEditorProgram` extends the base `Program` class.
    *   The `Program` constructor (`constructor(id, title, ...)` in `js/program.js`) is called by `TextEditorProgram` via `super('text-editor', 'Text Editor', 700, 500);`.
    *   The `Program.init()` method (called automatically when `new TextEditorProgram()` runs) retrieves the `WindowManager` instance created in `script.js` (`this.windowManager = window.windowManagers[this.id];`) and gets a reference to the `.window-content` div (`this.windowContent`).
*   **Showing/Focusing:**
    *   The editor window is shown when its dock icon (`#text-editor-dock-icon`) is clicked. This triggers `window.windowManagers['text-editor'].show()` (handled in `js/menu-bar.js`'s `setupSimpleWindowListeners` or `js/window-manager.js`'s `setupDockIcon`).
    *   The `TextEditorProgram`'s `init` method adds a callback (`this.windowManager.addOnShowCallback(...)`) via the `WindowManager`. When the window is shown, this callback attempts to focus the `<textarea>` element using `setTimeout(() => this.textAreaElement.focus(), 50);`.

**2. User Interface (UI):**

*   **Core Element (`js/programs/text-editor.js` - `render()`):** The primary UI element is dynamically created within the `render()` method (called by `init()`):
    ```javascript
    const textArea = document.createElement('textarea');
    textArea.className = 'text-editor-textarea';
    textArea.id = 'editor-textarea';
    textArea.placeholder = 'Type your text here...';
    // ... event listener ...
    this.textAreaElement = textArea; // Stores reference
    this.windowContent.appendChild(textArea); // Adds to window
    ```
    A single `<textarea>` element is created and appended to the `.text-editor-content` div.
*   **Styling (`styles/programs/text-editor.css`):** The `.text-editor-textarea` class styles the textarea:
    *   It's set to fill its container (`width: 100%; height: 100%;`).
    *   Uses a monospace font (`var(--font-monospace)`).
    *   Basic padding, no border, no resize handle (`resize: none;`).
    *   Crucially, it has `pointer-events: auto;` to ensure it can receive mouse clicks and keyboard focus (this was the fix added previously).

**3. Core Functionality (Editing):**

*   **Typing:** Standard browser behavior for the `<textarea>` element handles text input, deletion, selection, etc.
*   **Modification Tracking (`js/programs/text-editor.js`):**
    *   An `input` event listener is attached to the `<textarea>` in the `render()` method.
    *   When the content changes, this listener sets `this.isModified = true;` and calls `this.updateTitle()`.
    *   The `isModified` flag is reset to `false` only when content is loaded (`loadContent`) or a new file is created (`resetEditor`). Saving (`saveFile`) also resets it *after* successfully saving.
*   **Title Update (`js/programs/text-editor.js`):**
    *   The `updateTitle()` method changes the window title based on the current file name and modification status.
    *   It calls `this.setTitle()` which finds the title element (`.text-editor-title`) and sets its `textContent` to `"{filename}{*} - Text Editor"`, where `{filename}` is `this.currentFile` and `{*}` is an asterisk added only if `this.isModified` is `true`.

**4. Features (File / Edit Menus):**

*   **Menu Definition (`js/menu-bar.js`):** The `appMenus` object defines the menu structure for when the `text-editor` window is active:
    *   **File:** New, Open..., Save, Save As..., Close
    *   **Edit:** Cut, Copy, Paste, Select All
*   **Action Handling (`js/menu-bar.js` - `handleMenuAction` & `handleTextEditorAction`):**
    *   When a menu item is clicked, `handleMenuAction` checks if `activeWindow` is `'text-editor'`. If so, it calls `handleTextEditorAction(action)`.
    *   `handleTextEditorAction` uses a `switch` statement based on the `action` string defined in `appMenus`.
*   **Feature Implementation:**
    *   **New (`new-text-file`):**
        *   Dispatches a `new-file` custom event on the `#text-editor` element.
        *   **(`js/programs/text-editor.js` - `setupMenuListeners`):** An event listener catches `new-file` and calls `this.newFile()`.
        *   **(`js/programs/text-editor.js` - `newFile()`):** Checks `this.isModified`. If true, it asks the user for confirmation (`confirm(...)`) before proceeding. If confirmed or not modified, it calls `this.resetEditor()`.
        *   **(`js/programs/text-editor.js` - `resetEditor()`):** Sets `this.currentFile = 'untitled.txt'`, clears the content (`this.content = ''`, `textarea.value = ''`), sets `this.isModified = false`, and updates the title.
    *   **Open (`open-text-file`):**
        *   Programmatically clicks the hidden file input element (`#file-input-text` defined in `index.html`).
        *   **(`js/programs/text-editor.js` - `setupMenuListeners`):** A `change` event listener on `#file-input-text` reads the selected file using `FileReader`.
        *   On successful read (`reader.onload`), it calls `this.openFile(file.name, content)` and then `this.show()` to ensure the window is visible.
        *   **(`js/programs/text-editor.js` - `openFile()`):** Updates `this.currentFile` and `this.content`, then calls `this.loadContent()`.
        *   **(`js/programs/text-editor.js` - `loadContent()`):** Sets the `<textarea>` value, resets `this.isModified = false`, and updates the title.
        *   *(Desktop Integration)* Double-clicking a `.txt` file icon on the desktop (`js/desktop.js` - `openDesktopFile`) reads content from `localStorage` (key format: `desktop_file_{fileName}`) or uses sample content if not found, then calls `openTextEditor(fileName, fileContent)` which launches/shows the editor and passes the data.
    *   **Save (`save-text-file`):**
        *   Dispatches a `save-file` custom event on the `#text-editor` element.
        *   **(`js/programs/text-editor.js` - `setupMenuListeners`):** An event listener catches `save-file` and calls `this.saveFile()`.
        *   **(`js/programs/text-editor.js` - `saveFile()`):**
            *   Checks if `this.currentFile` is null or 'untitled.txt'. If so, it calls `this.saveFileAs()` instead.
            *   Otherwise, it reads the current `<textarea>` value into `this.content`.
            *   It saves the `this.content` to `localStorage` using the key `desktop_file_{this.currentFile}`.
            *   Resets `this.isModified = false` and updates the title.
            *   Dispatches a `file-saved` custom event with the `fileName` and `content`. This is caught by `js/desktop.js` to potentially create/update a desktop icon if one doesn't exist.
    *   **Save As (`save-as-text-file`):**
        *   Dispatches a `save-file-as` custom event on the `#text-editor` element.
        *   **(`js/programs/text-editor.js` - `setupMenuListeners`):** An event listener catches `save-file-as` and calls `this.saveFileAs()`.
        *   **(`js/programs/text-editor.js` - `saveFileAs()`):**
            *   Prompts the user for a new file name using `prompt()`, suggesting the current name or 'untitled.txt'.
            *   If a name is provided, it updates `this.currentFile` (adding `.txt` if missing) and then calls `this.saveFile()` to perform the actual saving logic with the new name.
    *   **Close (`close-text-editor`):** Minimizes the window using the `WindowManager`'s `minimize()` method. *Note: It does not currently check for unsaved changes before closing.*
    *   **Cut/Copy/Paste (`cut-text`, `copy-text`, `paste-text`):** Uses the deprecated `document.execCommand('cut'/'copy'/'paste')`. This relies on browser implementation and might not work reliably or consistently, especially with `<textarea>`. It doesn't interact directly with the `TextEditorProgram` instance.
    *   **Select All (`select-all-text`):** Finds the `<textarea>` within the text editor window and calls its `.select()` method.

**5. Summary of Design:**

*   The Text Editor is implemented as a class (`TextEditorProgram`) extending a base `Program` class, promoting code reuse for window creation basics.
*   It relies heavily on a separate `WindowManager` class for all window-level interactions (drag, resize, focus, minimize, show).
*   The core editor UI is a single, standard HTML `<textarea>`.
*   File content persistence is handled via `localStorage`, keyed by filename.
*   Menu actions initiated from the global `menu-bar.js` are communicated to the specific `TextEditorProgram` instance primarily through **Custom Events** dispatched on the text editor's main DOM element (`#text-editor`). The `TextEditorProgram` instance listens for these events.
*   Standard edit operations (Cut/Copy/Paste) use the basic `document.execCommand`.
*   Interaction with the desktop (creating icons for saved files, opening files from icons) is handled via another Custom Event (`file-saved`) dispatched by the editor and listened for by `desktop.js`. 

# Text Editor Implementation Plan

## 1. Goal

To implement a basic, functional text editor application within the korze.org.os web simulation. The editor should allow users to create new text files, open existing ones (stored within the simulation's virtual file system), edit content, and save their work using "Save" and "Save As" functionality.

## 2. Core Requirements

*   **Launch Behavior:** Clicking the Text Editor icon in the dock opens a new window with a blank, untitled document ready for immediate editing.
*   **File -> New:** Creates a new, blank, untitled document in the active editor window. Prompts the user to save if the current document has unsaved changes.
*   **File -> Open:** Allows the user to select a `.txt` file from their virtual desktop/storage. Opens the selected file's content in the editor, replacing any current content. Prompts the user to save if the current document has unsaved changes.
*   **File -> Save:** Saves the current content.
    *   If the document was opened from an existing file or previously saved, it overwrites the existing file content.
    *   If the document is new and untitled, it triggers the "Save As" behavior.
*   **File -> Save As:** Prompts the user for a filename (defaulting to the current name or "untitled.txt"). Saves the current content to the specified filename. The editor window title should update to reflect the new filename, and this file becomes the currently active file for subsequent "Save" operations.
*   **Unsaved Changes Indication:** The window title should clearly indicate when a file has unsaved modifications (e.g., with an asterisk `*`).
*   **Integration:** The editor must integrate seamlessly with the existing Window Manager, Dock, Menu Bar, and Desktop file system (using `localStorage`).

## 3. Current State Analysis

The project already includes:

*   `index.html`: Defines the HTML structure for the Text Editor window (`#text-editor`), its dock icon (`#text-editor-dock-icon`), and a hidden file input (`#file-input-text`).
*   `js/script.js`: Initializes the `WindowManager` for the Text Editor and instantiates `TextEditorProgram`.
*   `js/programs/text-editor.js`: Contains the `TextEditorProgram` class, which extends a base `Program`. It has partial implementations for:
    *   Rendering a `<textarea>`.
    *   Basic state management (`currentFile`, `content`, `isModified`).
    *   `saveFile` and `saveFileAs` logic using `localStorage` with a `desktop_file_` prefix.
    *   `newFile` logic (calling `resetEditor`).
    *   `openFile` logic (loading content).
    *   Listeners for custom events (`new-file`, `save-file`, `save-file-as`) supposedly dispatched by the menu bar.
    *   A listener for the hidden file input (`#file-input-text`) change event to read local files (using the *browser's* file system, not the virtual one).
    *   An exported `openTextEditor` function to launch/show the editor.

**Key Gaps:**

*   **Dock Launch:** The dock icon needs an event listener to actually launch/show the editor using `openTextEditor()`.
*   **Menu Bar Integration:** The `menu-bar.js` needs to be updated to:
    *   Detect when the Text Editor window is active.
    *   Enable/disable appropriate menu items ("New", "Open", "Save", "Save As").
    *   *Dispatch* the correct custom events (`new-file`, `save-file`, `save-file-as`) *to the active Text Editor window* when menu items are clicked.
    *   Trigger the "Open" functionality (likely by clicking the hidden file input).
*   **Virtual File System Interaction:**
    *   The current "Open" uses the browser's file input, not the virtual files stored in `localStorage`. It needs to be adapted to list and open files from the virtual desktop/`localStorage`.
    *   The `desktop.js` needs to handle double-clicking `.txt` file icons to open them in the editor by fetching content from `localStorage` and calling `openTextEditor(fileName, content)`.
    *   `desktop.js` must listen for the `file-saved` event from the editor to create/update desktop file icons.
*   **Unsaved Changes Prompts:** Prompts for unsaved changes need to be implemented reliably before opening a new file or creating a new one.

## 4. Implementation Strategy

### 4.1. Core Editor Logic (`js/programs/text-editor.js`)

1.  **Initialization (`constructor`, `init`):**
    *   Ensure the default state upon launch (when `options.file` is null) results in `this.currentFile = 'untitled.txt'`, `this.content = ''`, `this.isModified = false`.
    *   The `render` method should create the `textarea` immediately.
    *   The `updateTitle()` method should be called in `init` to set the initial title correctly (e.g., "untitled.txt - Text Editor").
2.  **Open File (`openFile` method modification):**
    *   **Add Unsaved Changes Check:** Before proceeding, check `this.isModified`. If true, show a `confirm()` dialog: "You have unsaved changes. Discard them and open the new file?". If the user cancels, abort the open operation.
    *   **Update State:** If proceeding, set `this.currentFile = fileName`, `this.content = content`, `this.isModified = false`.
    *   **Update UI:** Call `this.loadContent(content)` and `this.updateTitle()`.
3.  **New File (`newFile` method):**
    *   The existing check for `this.isModified` and the `confirm()` dialog is good. Keep it.
    *   Ensure `resetEditor` correctly sets the state (`currentFile = 'untitled.txt'`, `content = ''`, `isModified = false`) and updates the UI (`textarea.value = ''`, `this.updateTitle()`).
4.  **Save File (`saveFile`):**
    *   The current logic to check for `!this.currentFile || this.currentFile === 'untitled.txt'` and call `saveFileAs()` is correct.
    *   Ensure the `localStorage` key is consistently `desktop_file_${this.currentFile}`.
    *   Ensure the `file-saved` event is dispatched *after* successfully saving to `localStorage`. The event detail should include `{ fileName: this.currentFile, content: this.content }`.
    *   After saving, set `this.isModified = false` and call `this.updateTitle()`.
5.  **Save As (`saveFileAs`):**
    *   The logic to prompt for a name, add `.txt` if missing, update `this.currentFile`, and then call `this.saveFile()` is correct. Add basic validation to prevent saving with invalid characters if necessary (e.g., `/`).
6.  **Virtual Open Trigger:**
    *   The listener for `#file-input-text` needs to be repurposed or removed if we fully switch to a virtual file system dialog. For now, let's assume the "Open" menu item will trigger a *virtual* file picker (implemented in step 4.3). We'll need a new method like `openVirtualFile(fileName)` that fetches content from `localStorage` and then calls the updated `openFile(fileName, content)`.

### 4.2. Dock Integration (`js/script.js` or dedicated dock script)

1.  **Add Event Listener:** In the main initialization sequence (likely where other dock listeners are set up), add a click listener to `#text-editor-dock-icon`.
2.  **Launch Action:** The listener's callback should call `openTextEditor()` (the exported function from `text-editor.js`). This function should handle launching a new instance if none exists or bringing an existing instance to the front and ensuring it has a default "untitled" document if launched fresh.

```javascript
// Example in script.js or similar initialization file
document.getElementById('text-editor-dock-icon')?.addEventListener('click', () => {
    // Assuming openTextEditor handles launching/showing correctly
    openTextEditor(); 
});
```

### 4.3. Menu Bar Integration (`js/menu-bar.js`)

1.  **Active Window Tracking:** The Menu Bar logic needs access to the `WindowManager` to know which window (`Program` instance) is currently active. `WindowManager` should provide a method like `getActiveProgram()`.
2.  **Contextual Menu Updates:** Implement a function (e.g., `updateMenuBarForActiveProgram`) that runs whenever the active window changes.
    *   Inside this function, check if `WindowManager.getActiveProgram()` is an instance of `TextEditorProgram`.
    *   If yes, enable the "File" -> "New", "Open", "Save", "Save As" menu items. Add event listeners to these items.
    *   If no, disable or hide these Text Editor-specific items.
3.  **Dispatching Events:** The event listeners added above should *dispatch* the custom events *directly to the active Text Editor window element*.

```javascript
// Example within menu-bar.js logic

function updateMenuBarForActiveProgram(activeProgram) {
    const isTextEditor = activeProgram instanceof TextEditorProgram;
    
    // Get menu item elements (assuming they have IDs like 'menu-file-new', etc.)
    const newItem = document.getElementById('menu-file-new');
    const openItem = document.getElementById('menu-file-open');
    const saveItem = document.getElementById('menu-file-save');
    const saveAsItem = document.getElementById('menu-file-save-as');

    // Enable/disable items
    [newItem, openItem, saveItem, saveAsItem].forEach(item => {
        if (item) item.disabled = !isTextEditor;
    });

    if (isTextEditor && activeProgram.windowElement) {
        // Remove previous listeners to avoid duplication
        // (Need a robust way to manage listeners, perhaps store them)
        
        // Add new listeners that dispatch events to the active window
        newItem.onclick = () => activeProgram.windowElement.dispatchEvent(new CustomEvent('new-file'));
        saveItem.onclick = () => activeProgram.windowElement.dispatchEvent(new CustomEvent('save-file'));
        saveAsItem.onclick = () => activeProgram.windowElement.dispatchEvent(new CustomEvent('save-file-as'));
        
        // Open needs special handling - trigger a virtual file picker
        openItem.onclick = () => {
            // TODO: Implement openVirtualFileSystemDialog(activeProgram);
            console.log('Trigger virtual file open for text editor');
            // For now, maybe still trigger the hidden input as a placeholder?
            // document.getElementById('file-input-text')?.click(); 
            // ^^^ This uses the BROWSER file system, needs replacement.
            showVirtualFilePicker(activeProgram); // Call the new function (see 4.5)
        };
    } else {
        // Remove listeners when text editor is not active
        // ...
    }
}

// This function needs to be called whenever the active window changes
// (e.g., via a callback from WindowManager)
```

### 4.4. Desktop Integration (`js/desktop.js`)

1.  **Listen for Saves:** Add a global event listener for the `file-saved` event.
    *   `document.addEventListener('file-saved', (event) => { ... });`
    *   Inside the handler, get `event.detail.fileName` and `event.detail.content`.
    *   Call a function (e.g., `updateDesktopIcon(fileName, content)`) to create a new icon on the desktop UI if it doesn't exist, or potentially update metadata if needed. Ensure the icon stores the `fileName`.
2.  **Handle Icon Double-Clicks:** Add event listeners (likely using event delegation on the desktop container) for `dblclick` events on file icons.
    *   Check if the clicked icon represents a `.txt` file (based on stored `fileName` or a data attribute).
    *   If it's a text file, get the `fileName`.
    *   Construct the `localStorage` key: `const storageKey = \`desktop_file_\${fileName}\`;`
    *   Retrieve the content: `const content = localStorage.getItem(storageKey);`
    *   Check if content exists. If yes, call `openTextEditor(fileName, content)`. If not, show an error ("File not found or empty").

```javascript
// Example in desktop.js

// Listener for file saves
document.addEventListener('file-saved', (event) => {
    const { fileName, content } = event.detail;
    console.log(`Desktop received file-saved event for: ${fileName}`);
    // TODO: Implement logic to create/update the icon on the desktop visually
    createOrUpdateDesktopIcon(fileName, 'text'); // Assuming type 'text'
});

// Listener for icon double-clicks (using delegation)
desktopContainerElement.addEventListener('dblclick', (event) => {
    const iconElement = event.target.closest('.desktop-icon'); // Adjust selector
    if (iconElement && iconElement.dataset.fileType === 'text') {
        const fileName = iconElement.dataset.fileName;
        const storageKey = `desktop_file_${fileName}`;
        const content = localStorage.getItem(storageKey);

        if (content !== null) {
            console.log(`Opening ${fileName} from desktop`);
            openTextEditor(fileName, content);
        } else {
            alert(`Error: Could not load content for ${fileName}`);
        }
    }
});
```

### 4.5. Virtual File System (Recommended Enhancement)

1.  **`js/filesystem.js` Module:** Create a new module to abstract `localStorage` interactions.
    *   `listFiles()`: Returns an array of filenames (filtering by `desktop_file_` prefix).
    *   `readFile(fileName)`: Reads content from `localStorage[desktop_file_fileName]`.
    *   `writeFile(fileName, content)`: Writes content to `localStorage[desktop_file_fileName]`.
    *   `deleteFile(fileName)`: Removes the item from `localStorage`.
2.  **Refactor:** Update `text-editor.js` and `desktop.js` to use this module instead of direct `localStorage` access.
3.  **Virtual File Picker:** Create a simple UI (e.g., a modal window) that uses `FileSystem.listFiles()` to display available `.txt` files.
    *   This picker should be shown when "File -> Open" is clicked in the Text Editor.
    *   When a file is selected in the picker, it should call the target program's method to open the file (e.g., `activeProgram.openVirtualFile(selectedFileName)`).
    *   The `text-editor.js` needs the `openVirtualFile(fileName)` method mentioned in 4.1.6, which would use `FileSystem.readFile(fileName)` and then call the main `openFile` logic.

## 5. Testing Cases

*   Launch editor from dock -> Verify blank "untitled.txt" window opens, textarea is focused.
*   Type text -> Verify title changes to "untitled.txt*".
*   File -> Save As -> Enter "test1.txt" -> Verify file saves, title changes to "test1.txt". Desktop icon appears.
*   Modify text -> Verify title changes to "test1.txt*".
*   File -> Save -> Verify title changes back to "test1.txt".
*   File -> New -> Confirm discard -> Verify blank "untitled.txt" appears.
*   File -> Open -> (Requires Virtual File Picker) Select "test1.txt" -> Verify content loads, title is "test1.txt".
*   Modify text -> File -> New -> Confirm discard -> Verify blank "untitled.txt".
*   Double-click "test1.txt" icon on desktop -> Verify editor opens/focuses with correct content.
*   Open "test1.txt", modify -> Click dock icon -> Verify existing window is focused, content/state unchanged.
*   Open "test1.txt", modify -> File -> Open -> Select different file -> Confirm discard -> Verify new file loads.

## 6. Conclusion

This plan outlines the necessary steps to integrate a functional Text Editor. Key areas involve refining the existing `TextEditorProgram`, implementing robust menu bar interaction based on the active window, handling virtual file operations via `localStorage` (ideally abstracted into a `FileSystem` module), and connecting desktop icon interactions. Implementing the virtual file picker for the "Open" command is crucial for moving away from the browser's default file input. 