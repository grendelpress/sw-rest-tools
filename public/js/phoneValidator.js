// Phone number validation utility for E.164 format
export class PhoneValidator {
    static E164_REGEX = /^\+[1-9]\d{1,14}$/;

    static isValidE164(phoneNumber) {
        if (!phoneNumber || phoneNumber.trim() === '') {
            return true; // Empty is valid (optional field)
        }

        return this.E164_REGEX.test(phoneNumber.trim());
    }

    static formatForDisplay(phoneNumber) {
        if (!phoneNumber) return '';
        return phoneNumber.trim();
    }

    static sanitize(phoneNumber) {
        if (!phoneNumber) return '';

        // Remove all spaces, dashes, parentheses, and dots
        let cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');

        // Ensure it starts with +
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }

        return cleaned;
    }

    static getValidationMessage(phoneNumber) {
        if (!phoneNumber || phoneNumber.trim() === '') {
            return '';
        }

        const cleaned = phoneNumber.trim();

        if (!cleaned.startsWith('+')) {
            return 'Phone number must start with + (E.164 format)';
        }

        if (!/^\+[0-9]+$/.test(cleaned)) {
            return 'Phone number must contain only digits after +';
        }

        if (cleaned.length < 8 || cleaned.length > 16) {
            return 'Phone number must be between 8 and 16 characters';
        }

        if (cleaned[1] === '0') {
            return 'Country code cannot start with 0';
        }

        return '';
    }

    static getExampleFormat() {
        return '+12345678901';
    }
}
