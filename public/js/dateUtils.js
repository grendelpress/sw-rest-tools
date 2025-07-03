// Date utility functions for handling date ranges and formatting
export class DateUtils {
    static setDateRange(startInput, endInput, days) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        startInput.value = startDate.toISOString().split('T')[0];
        endInput.value = endDate.toISOString().split('T')[0];
    }
    
    static clearDateRange(startInput, endInput) {
        startInput.value = '';
        endInput.value = '';
    }
    
    static validateDateRange(startDate, endDate) {
        if (startDate && endDate) {
            return new Date(startDate) <= new Date(endDate);
        }
        return true;
    }
    
    static getDateRangeParams(startInput, endInput) {
        const params = {};
        if (startInput.value) {
            params.startDate = startInput.value;
        }
        if (endInput.value) {
            params.endDate = endInput.value;
        }
        return params;
    }
    
    static formatDateForFilter(dateString, isEndDate = false) {
        if (!dateString) return null;
        const suffix = isEndDate ? 'T23:59:59' : 'T00:00:00';
        return new Date(dateString + suffix);
    }
}