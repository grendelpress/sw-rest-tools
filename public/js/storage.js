// Storage utilities for managing credentials and session data
export class StorageManager {
    static CREDENTIALS_KEY = 'signalwireCredentials';
    
    static getCredentials() {
        try {
            const stored = sessionStorage.getItem(this.CREDENTIALS_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error reading credentials from storage:', error);
            return null;
        }
    }
    
    static saveCredentials(credentials) {
        try {
            sessionStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
            return true;
        } catch (error) {
            console.error('Error saving credentials to storage:', error);
            return false;
        }
    }
    
    static clearCredentials() {
        try {
            sessionStorage.removeItem(this.CREDENTIALS_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing credentials from storage:', error);
            return false;
        }
    }
}