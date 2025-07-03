// Main application controller
import { StorageManager } from './storage.js';
import { DateUtils } from './dateUtils.js';
import { CSVUtils } from './csvUtils.js';
import { DataFilter } from './dataFilter.js';
import { DataTable } from './dataTable.js';
import { APIClient } from './apiClient.js';
import { UIManager } from './uiManager.js';
import { Analytics } from './analytics.js';
import { AnalyticsRenderer } from './analyticsRenderer.js';

class SignalWireApp {
    constructor() {
        this.credentials = StorageManager.getCredentials();
        this.dataFilter = new DataFilter();
        this.uiManager = new UIManager();
        this.analytics = new Analytics();
        this.analyticsRenderer = new AnalyticsRenderer(document.getElementById('analyticsContainer'));
        this.currentDataType = '';
        
        this.initializeElements();
        this.initializeDataTable();
        this.bindEvents();
        this.initializeForm();
    }
    
    initializeElements() {
        // Form elements
        this.credentialsForm = document.getElementById('credentialsForm');
        this.projectIdInput = document.getElementById('projectId');
        this.authTokenInput = document.getElementById('authToken');
        this.spaceUrlInput = document.getElementById('spaceUrl');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Date range elements (main form)
        this.startDateInput = document.getElementById('startDate');
        this.endDateInput = document.getElementById('endDate');
        this.clearDatesBtn = document.getElementById('clearDatesBtn');
        
        // Filter elements (in data display)
        this.filterStartDateInput = document.getElementById('filterStartDate');
        this.filterEndDateInput = document.getElementById('filterEndDate');
        this.searchInput = document.getElementById('searchInput');
        this.clearFiltersBtn = document.getElementById('clearFiltersBtn');
        this.applyFiltersBtn = document.getElementById('applyFiltersBtn');
        
        // Action buttons
        this.downloadFilteredBtn = document.getElementById('downloadFilteredBtn');
        this.backBtn = document.getElementById('backBtn');
        this.toggleAnalyticsBtn = document.getElementById('toggleAnalyticsBtn');
        
        // API links
        this.apiLinks = document.querySelectorAll('.api-link');
    }
    
    initializeDataTable() {
        this.dataTable = new DataTable(
            document.getElementById('dataTable'),
            document.getElementById('dataTableHead'),
            document.getElementById('dataTableBody'),
            document.getElementById('recordCount'),
            document.getElementById('filteredCount')
        );
    }
    
    initializeForm() {
        if (this.credentials) {
            this.projectIdInput.value = this.credentials.projectId;
            this.authTokenInput.value = this.credentials.authToken;
            this.spaceUrlInput.value = this.credentials.spaceUrl;
        }
    }
    
    bindEvents() {
        // Form events
        this.credentialsForm.addEventListener('submit', (e) => this.handleCredentialsSubmit(e));
        this.clearBtn.addEventListener('click', () => this.handleClearCredentials());
        
        // Date range events (main form)
        this.clearDatesBtn.addEventListener('click', () => this.handleClearDates());
        
        // Filter events
        this.clearFiltersBtn.addEventListener('click', () => this.handleClearFilters());
        this.searchInput.addEventListener('input', () => this.handleApplyFilters());
        this.filterStartDateInput.addEventListener('change', () => this.handleApplyFilters());
        this.filterEndDateInput.addEventListener('change', () => this.handleApplyFilters());
        
        // Action button events
        this.downloadFilteredBtn.addEventListener('click', () => this.handleDownloadFiltered());
        this.backBtn.addEventListener('click', () => this.handleBack());
        this.toggleAnalyticsBtn.addEventListener('click', () => this.handleToggleAnalytics());
        
        // API link events
        this.apiLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleApiLinkClick(e));
        });
        
        // Date preset events
        this.bindDatePresetEvents();
    }
    
    bindDatePresetEvents() {
        document.querySelectorAll('.preset-btn[data-days]').forEach(btn => {
            btn.addEventListener('click', () => {
                const days = parseInt(btn.dataset.days);
                
                // Check if we're in the main form or filter section
                if (btn.closest('#dateRangeSection')) {
                    DateUtils.setDateRange(this.startDateInput, this.endDateInput, days);
                } else {
                    DateUtils.setDateRange(this.filterStartDateInput, this.filterEndDateInput, days);
                    // Automatically apply filters when date preset is clicked
                    this.handleApplyFilters();
                }
            });
        });
    }
    
    handleCredentialsSubmit(e) {
        e.preventDefault();
        
        this.credentials = {
            projectId: this.projectIdInput.value,
            authToken: this.authTokenInput.value,
            spaceUrl: this.spaceUrlInput.value
        };
        
        StorageManager.saveCredentials(this.credentials);
    }
    
    handleClearCredentials() {
        StorageManager.clearCredentials();
        this.credentials = null;
        this.credentialsForm.reset();
        this.uiManager.hideStatus();
        this.uiManager.hideDataDisplay();
    }
    
    handleClearDates() {
        DateUtils.clearDateRange(this.startDateInput, this.endDateInput);
    }
    
    handleClearFilters() {
        DateUtils.clearDateRange(this.filterStartDateInput, this.filterEndDateInput);
        this.searchInput.value = '';
        const filteredData = this.dataFilter.clearFilters();
        this.dataTable.render(filteredData, this.dataFilter.getOriginalData().length);
    }
    
    handleApplyFilters() {
        const filteredData = this.dataFilter.applyFilters(
            this.filterStartDateInput.value,
            this.filterEndDateInput.value,
            this.searchInput.value
        );
        this.dataTable.render(filteredData, this.dataFilter.getOriginalData().length);
    }
    
    handleDownloadFiltered() {
        const filteredData = this.dataFilter.getFilteredData();
        const filename = `Filtered_${this.currentDataType}.csv`;
        CSVUtils.downloadCSV(filteredData, filename);
    }
    
    handleBack() {
        this.uiManager.resetToApiLinks();
        this.searchInput.value = '';
        this.handleClearFilters();
        this.dataFilter.setOriginalData([]);
        this.currentDataType = '';
        this.analyticsRenderer.hide();
        this.resetAnalyticsToggle();
    }
    
    handleToggleAnalytics() {
        const analyticsContainer = document.getElementById('analyticsContainer');
        const isHidden = analyticsContainer.classList.contains('hidden');
        
        if (isHidden) {
            // Generate and show analytics
            this.analytics.setData(this.dataFilter.getOriginalData(), this.currentDataType);
            const analyticsData = this.analytics.generateSummary();
            this.analyticsRenderer.render(analyticsData);
            analyticsContainer.classList.remove('hidden');
            this.toggleAnalyticsBtn.innerHTML = '📊 Hide Analytics';
        } else {
            // Hide analytics
            analyticsContainer.classList.add('hidden');
            this.toggleAnalyticsBtn.innerHTML = '📊 Show Analytics';
        }
    }
    
    resetAnalyticsToggle() {
        const analyticsContainer = document.getElementById('analyticsContainer');
        analyticsContainer.classList.add('hidden');
        this.toggleAnalyticsBtn.innerHTML = '📊 Show Analytics';
    }
    
    async handleApiLinkClick(e) {
        e.preventDefault();
        
        if (!this.credentials) {
            alert('Please save your credentials first');
            return;
        }
        
        const link = e.currentTarget;
        const endpoint = link.dataset.endpoint;
        
        // Show date range section when API is selected
        this.uiManager.showDateRangeSection();
        
        // Validate date range
        if (!DateUtils.validateDateRange(this.startDateInput.value, this.endDateInput.value)) {
            alert('Start date must be before or equal to end date');
            return;
        }
        
        // Get date range parameters
        const dateParams = DateUtils.getDateRangeParams(this.startDateInput, this.endDateInput);
        
        this.uiManager.showStatus();
        this.currentDataType = APIClient.getDataTypeTitle(endpoint);
        
        try {
            const response = await APIClient.makeRequest(endpoint, this.credentials, dateParams);
            const csvText = await response.text();
            
            // Parse and display data
            const originalData = CSVUtils.parseCSV(csvText);
            this.dataFilter.setOriginalData(originalData);
            
            // Show data display
            this.uiManager.showDataDisplay(this.currentDataType);
            
            // Copy main form date range to filter inputs
            if (this.startDateInput.value) {
                this.filterStartDateInput.value = this.startDateInput.value;
            }
            if (this.endDateInput.value) {
                this.filterEndDateInput.value = this.endDateInput.value;
            }
            
            this.dataTable.render(originalData, originalData.length);
            this.uiManager.hideStatus();
            
            // Reset analytics toggle
            this.resetAnalyticsToggle();
            
        } catch (error) {
            alert('Error: ' + error.message);
            this.uiManager.hideStatus();
            this.uiManager.showDateRangeSection();
            this.uiManager.showApiLinks();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignalWireApp();
});