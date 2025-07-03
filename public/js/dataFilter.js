// Data filtering and search functionality
import { DateUtils } from './dateUtils.js';

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
            // Find date fields in the row (common date field names)
            const dateFields = ['Start Time', 'Date Sent', 'Date Created', 'Date Updated'];
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
        return data.filter(row => {
            return Object.values(row).some(value => 
                value.toString().toLowerCase().includes(term)
            );
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