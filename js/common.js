// Common utility functions - Updated to use WindowManager
import { createWindowManager } from './window-manager.js';

export function createWindow(options) {
    const { id } = options;
    
    if (!id) {
        console.error('Window ID is required');
        return null;
    }
    
    // Use the standardized WindowManager
    return createWindowManager(id, options);
}

// Add any additional common utility functions here
export function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleDateString(undefined, options);
}

export function generateUniqueId(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
} 