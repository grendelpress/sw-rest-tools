// Phone number validation and normalization utility.
// Accepts common human formats ((606) 759-0004, 606-759-0004, 6067590004,
// +16067590004) and converts them to E.164 for the SignalWire API.
export class PhoneValidator {
    static E164_REGEX = /^\+[1-9]\d{1,14}$/;

    // Strip every formatting character, leaving only digits and a leading +.
    static _stripFormatting(phoneNumber) {
        if (!phoneNumber) return '';
        return String(phoneNumber).replace(/[\s\-\(\)\.]/g, '').trim();
    }

    // Convert any common format to E.164. Numbers without a country code
    // default to +1 (US/Canada), matching the existing North American data.
    static normalizeToE164(phoneNumber) {
        if (!phoneNumber) return '';
        const cleaned = this._stripFormatting(phoneNumber);
        if (!cleaned) return '';

        if (cleaned.startsWith('+')) {
            return cleaned;
        }

        const digits = cleaned.replace(/\D/g, '');
        if (!digits) return '';

        // Already 11 digits starting with 1 -> add +
        if (digits.length === 11 && digits.startsWith('1')) {
            return '+' + digits;
        }
        // 10 digits -> assume US/Canada, prepend 1
        if (digits.length === 10) {
            return '+1' + digits;
        }
        // Any other length -> treat as international with + prefix
        return '+' + digits;
    }

    // Return only the digits (no +, no formatting) for loose matching.
    static toDigits(phoneNumber) {
        if (!phoneNumber) return '';
        return String(phoneNumber).replace(/\D/g, '');
    }

    // True when two phone-number strings refer to the same number
    // regardless of formatting (e.g. "(606) 759-0004" vs "+16067590004").
    static matches(a, b) {
        const da = this.toDigits(a);
        const db = this.toDigits(b);
        if (!da || !db) return false;
        // Match on the last 10 digits so a missing country code still lines up.
        return da.endsWith(db) || db.endsWith(da) ||
            da.slice(-10) === db.slice(-10);
    }

    static isValidE164(phoneNumber) {
        if (!phoneNumber || phoneNumber.trim() === '') {
            return true; // Empty is valid (optional field)
        }
        return this.E164_REGEX.test(this.normalizeToE164(phoneNumber));
    }

    static formatForDisplay(phoneNumber) {
        if (!phoneNumber) return '';
        return phoneNumber.trim();
    }

    static sanitize(phoneNumber) {
        return this.normalizeToE164(phoneNumber);
    }

    static getValidationMessage(phoneNumber) {
        if (!phoneNumber || phoneNumber.trim() === '') {
            return '';
        }

        const normalized = this.normalizeToE164(phoneNumber);

        if (!normalized.startsWith('+')) {
            return 'Enter a valid phone number (e.g. +12345678901 or (606) 759-0004)';
        }

        if (!/^\+[0-9]+$/.test(normalized)) {
            return 'Phone number must contain only digits after +';
        }

        if (normalized.length < 8 || normalized.length > 16) {
            return 'Phone number must be between 8 and 16 digits';
        }

        if (normalized[1] === '0') {
            return 'Country code cannot start with 0';
        }

        return '';
    }

    static getExampleFormat() {
        return '+12345678901 or (606) 759-0004';
    }
}
