/**
 * filesystem.js
 * Simple abstraction for interacting with the virtual file system stored in localStorage.
 */

const FILE_PREFIX = 'desktop_file_';

export const FileSystem = {
    /**
     * List all files stored in the virtual file system.
     * @returns {string[]} An array of filenames.
     */
    listFiles: () => {
        const files = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(FILE_PREFIX)) {
                files.push(key.substring(FILE_PREFIX.length));
            }
        }
        console.log('[FileSystem] Listed files:', files);
        return files.sort(); // Return sorted list
    },

    /**
     * Read the content of a file.
     * @param {string} fileName - The name of the file to read.
     * @returns {string|null} The file content or null if the file doesn't exist.
     */
    readFile: (fileName) => {
        if (!fileName) {
            console.error('[FileSystem] readFile error: fileName is invalid.', fileName);
            return null;
        }
        const key = FILE_PREFIX + fileName;
        const content = localStorage.getItem(key);
        console.log(`[FileSystem] Reading file: ${fileName} (key: ${key}), Found: ${content !== null}`);
        return content;
    },

    /**
     * Write content to a file, overwriting if it exists.
     * @param {string} fileName - The name of the file to write.
     * @param {string} content - The content to save.
     * @returns {boolean} True if successful, false otherwise.
     */
    writeFile: (fileName, content) => {
        if (!fileName || typeof content !== 'string') {
            console.error('[FileSystem] writeFile error: Invalid fileName or content.', { fileName, content });
            return false;
        }
        const key = FILE_PREFIX + fileName;
        try {
            localStorage.setItem(key, content);
            console.log(`[FileSystem] Wrote file: ${fileName} (key: ${key}), Content length: ${content.length}`);
            return true;
        } catch (error) {
            console.error(`[FileSystem] Error writing file ${fileName} to localStorage:`, error);
            alert('Failed to save file. Storage might be full or unavailable.');
            return false;
        }
    },

    /**
     * Delete a file.
     * @param {string} fileName - The name of the file to delete.
     */
    deleteFile: (fileName) => {
         if (!fileName) {
            console.error('[FileSystem] deleteFile error: fileName is invalid.', fileName);
            return;
        }
        const key = FILE_PREFIX + fileName;
        localStorage.removeItem(key);
        console.log(`[FileSystem] Deleted file: ${fileName} (key: ${key})`);
    }
};

// Make FileSystem globally accessible for easier debugging if needed, but prefer imports
window.FileSystem = FileSystem; 