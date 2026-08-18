// Data filtering and search functionality
import { DateUtils } from './dateUtils.js';
import { PhoneValidator } from './phoneValidator.js';

export class DataFilter {
    constructor() {
        this.originalData = [];
        this.filteredData = [];
    }
    
    setOriginalData(data) {
        this.originalData = [...data];
        this.filteredData = [...data];
    }
    
    applyFilters(startDate, endDate, searchTerm) {
        let filteredData = [...this.originalData];
        
        // Apply date range filter
        if (startDate || endDate) {
            filteredData = this.filterByDateRange(filteredData, startDate, endDate);
        }
        
        // Apply search filter
        if (searchTerm && searchTerm.trim()) {
            filteredData = this.filterBySearchTerm(filteredData, searchTerm.trim());
        }
        
        this.filteredData = filteredData;
        return filteredData;
    }
    
    filterByDateRange(data, startDate, endDate) {
        return data.filter(row => {
            // Find date fields in the row (including RELAY-specific fields)
            const dateFields = ['Start Time', 'Date Sent', 'Date Created', 'Date Updated', 'Created At'];
            let rowDate = null;
            
            for (const field of dateFields) {
                if (row[field]) {
                    rowDate = new Date(row[field]);
                    break;
                }
            }
            
            if (!rowDate || isNaN(rowDate)) return true; // Keep if no valid date found
            
            const filterStartDate = DateUtils.formatDateForFilter(startDate, false);
            const filterEndDate = DateUtils.formatDateForFilter(endDate, true);
            
            if (filterStartDate && rowDate < filterStartDate) return false;
            if (filterEndDate && rowDate > filterEndDate) return false;
            
            return true;
        });
    }
    
    filterBySearchTerm(data, searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchDigits = PhoneValidator.toDigits(searchTerm);
        const looksLikePhone = searchDigits.length >= 7;

        return data.filter(row => {
            const values = Object.values(row);

            // Plain text match (message body, status, name, etc.)
            if (values.some(value => value.toString().toLowerCase().includes(term))) {
                return true;
            }

            // Phone-number aware match: when the search term looks like a phone
            // number, compare against row values using digit-only matching so
            // "(606) 759-0004" finds a row stored as "+16067590004".
            if (looksLikePhone) {
                return values.some(value => {
                    const valStr = String(value ?? '');
                    return PhoneValidator.toDigits(valStr).length >= 7 &&
                        PhoneValidator.matches(valStr, searchTerm);
                });
            }

            return false;
        });
    }
    
    getFilteredData() {
        return this.filteredData;
    }
    
    getOriginalData() {
        return this.originalData;
    }
    
    clearFilters() {
        this.filteredData = [...this.originalData];
        return this.filteredData;
    }
}
