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
import { PhoneValidator } from './phoneValidator.js';
import { MessageAnalytics } from './messageAnalytics.js';
import { MessagingAnalyticsDashboard } from './messagingAnalyticsDashboard.js';

class SignalWireApp {
    constructor() {
        this.credentials = StorageManager.getCredentials();
        this.dataFilter = new DataFilter();
        this.uiManager = new UIManager();
        this.analytics = new Analytics();
        this.analyticsRenderer = new AnalyticsRenderer(document.getElementById('analyticsContainer'));
        this.messagingAnalyticsDashboard = new MessagingAnalyticsDashboard('analyticsResultsContainer');
        this.currentDataType = '';
        this.currentProjectName = '';
        this.csvDataForDownload = null; // Store CSV data for special endpoints

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
        this.downloadOriginalBtn = document.getElementById('downloadOriginalBtn');
        this.backBtn = document.getElementById('backBtn');
        this.toggleAnalyticsBtn = document.getElementById('toggleAnalyticsBtn');

        // Messaging Analytics elements
        this.messagingAnalyticsView = document.getElementById('messagingAnalyticsView');
        this.analyticsQueryForm = document.getElementById('analyticsQueryForm');
        this.analyticsToNumber = document.getElementById('analyticsToNumber');
        this.analyticsFromNumber = document.getElementById('analyticsFromNumber');
        this.analyticsStartDate = document.getElementById('analyticsStartDate');
        this.analyticsEndDate = document.getElementById('analyticsEndDate');
        this.toNumberError = document.getElementById('toNumberError');
        this.fromNumberError = document.getElementById('fromNumberError');
        this.backFromAnalyticsBtn = document.getElementById('backFromAnalyticsBtn');
        this.clearAnalyticsFiltersBtn = document.getElementById('clearAnalyticsFiltersBtn');
        this.analyticsResultsContainer = document.getElementById('analyticsResultsContainer');

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
        this.downloadOriginalBtn.addEventListener('click', () => this.handleDownloadOriginal());
        this.backBtn.addEventListener('click', () => this.handleBack());
        this.toggleAnalyticsBtn.addEventListener('click', () => this.handleToggleAnalytics());

        // Messaging Analytics events
        this.analyticsQueryForm.addEventListener('submit', (e) => this.handleAnalyticsQuery(e));
        this.backFromAnalyticsBtn.addEventListener('click', () => this.handleBackFromAnalytics());
        this.clearAnalyticsFiltersBtn.addEventListener('click', () => this.handleClearAnalyticsFilters());
        this.analyticsToNumber.addEventListener('input', () => this.validatePhoneNumber(this.analyticsToNumber, this.toNumberError));
        this.analyticsFromNumber.addEventListener('input', () => this.validatePhoneNumber(this.analyticsFromNumber, this.fromNumberError));

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

                // Check if we're in the analytics form
                if (btn.closest('#messagingAnalyticsView')) {
                    DateUtils.setDateRange(this.analyticsStartDate, this.analyticsEndDate, days);
                }
                // Check if we're in the main form or filter section
                else if (btn.closest('#dateRangeSection')) {
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
        // Use CSV data if available (for test endpoints), otherwise use filtered data
        const dataToDownload = this.csvDataForDownload || this.dataFilter.getFilteredData();
        const filename = this.generateDownloadFilename('Filtered');
        CSVUtils.downloadCSV(dataToDownload, filename);
    }
    
    handleDownloadOriginal() {
        // Use CSV data if available (for test endpoints), otherwise use original data
        const dataToDownload = this.csvDataForDownload || this.dataFilter.getOriginalData();
        const filename = this.generateDownloadFilename('All');
        CSVUtils.downloadCSV(dataToDownload, filename);
    }
    
    generateDownloadFilename(prefix = '') {
        const cleanDataType = this.currentDataType.replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanProjectName = this.currentProjectName.replace(/[^a-zA-Z0-9_-]/g, '_');
        
        if (this.currentProjectName) {
            return prefix ? 
                `${prefix}_${cleanDataType}-${cleanProjectName}.csv` : 
                `${cleanDataType}-${cleanProjectName}.csv`;
        } else {
            return prefix ? 
                `${prefix}_${cleanDataType}.csv` : 
                `${cleanDataType}.csv`;
        }
    }
    
    handleBack() {
        this.uiManager.resetToApiLinks();
        this.searchInput.value = '';
        this.handleClearFilters();
        this.dataFilter.setOriginalData([]);
        this.csvDataForDownload = null; // Clear CSV data
        this.currentDataType = '';
        this.currentProjectName = '';
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
        const analyticsType = link.dataset.type;

        // Check if this is the messaging analytics link
        if (analyticsType === 'messaging-analytics') {
            this.showMessagingAnalytics();
            return;
        }

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

            // Process the response based on endpoint type
            await this.processApiResponse(endpoint, response);

        } catch (error) {
            alert('Error: ' + error.message);
            this.uiManager.hideStatus();
            this.uiManager.showDateRangeSection();
            this.uiManager.showApiLinks();
        }
    }
    
    async handleSpecialEndpoints(endpoint, response) {
        if (endpoint === '/test-bins-api') {
            // Handle test bins API differently - show JSON response
            const jsonResponse = await response.json();
            
            if (jsonResponse.success && jsonResponse.tableData) {
                // Convert table data to CSV-like format for display
                const csvLikeData = jsonResponse.tableData.map(row => ({
                    'Index': row.index,
                    'Bin SID': row.sid,
                    'Name': row.name,
                    'Date Created': row.dateCreated,
                    'Date Updated': row.dateUpdated,
                    'Date Last Accessed': row.dateLastAccessed,
                    'Account SID': row.accountSid,
                    'Request URL': row.requestUrl,
                    'Num Requests': row.numRequests,
                    'API Version': row.apiVersion,
                    'Contents': row.contentsPreview,
                    'Contents Length': row.contentsLength,
                    'URI': row.uri
                }));
                
                // Store the CSV data for downloads
                this.csvDataForDownload = jsonResponse.csvData || csvLikeData;
                
                this.dataFilter.setOriginalData(csvLikeData);
                this.uiManager.showDataDisplay(this.currentDataType);
                this.dataTable.render(csvLikeData, csvLikeData.length);
                
                // Set a default project name for test endpoint
                this.currentProjectName = 'TestData';
                
                // Show summary information
                const summary = jsonResponse.summary;
                const summaryText = `Summary: ${summary.totalBins} total bins, ${summary.detailedBins} with details, ${summary.withContents} with contents, avg content length: ${Math.round(summary.averageContentLength)} chars`;
                
                // Add summary to the data title
                document.getElementById('dataTitle').innerHTML = `
                    ${this.currentDataType}
                    <div style="font-size: 14px; font-weight: normal; color: #666; margin-top: 5px;">
                        ${summaryText}
                    </div>
                `;
            } else {
                alert('Error: ' + (jsonResponse.error || 'Failed to fetch bins data'));
                throw new Error(jsonResponse.error || 'Failed to fetch bins data');
            }
        } else {
            return this.handleRegularCSVEndpoint(response);
        }
    }
    
    async handleRegularCSVEndpoint(response) {
        // Handle regular CSV endpoints
        const csvText = await response.text();
        
        // Extract project name from the filename in the response headers
        const filename = APIClient.extractFilename(response);
        const projectNameMatch = filename.match(/^[^-]+-(.+)\.csv$/);
        this.currentProjectName = projectNameMatch ? projectNameMatch[1] : '';
        
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
        
        // Reset analytics toggle
        this.resetAnalyticsToggle();
    }
    
    async processApiResponse(endpoint, response) {
        if (endpoint === '/test-bins-api' || endpoint === '/generate-bins-csv') {
            // Check if response is JSON (test endpoint) or CSV (regular endpoint)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                await this.handleSpecialEndpoints(endpoint, response);
            } else {
                await this.handleRegularCSVEndpoint(response);
            }
        } else {
            await this.handleSpecialEndpoints(endpoint, response);
        }
        
        this.uiManager.hideStatus();
    }

    showMessagingAnalytics() {
        document.getElementById('apiLinks').classList.add('hidden');
        document.getElementById('dateRangeSection').classList.add('hidden');
        this.messagingAnalyticsView.classList.remove('hidden');
        this.analyticsResultsContainer.classList.add('hidden');
    }

    handleBackFromAnalytics() {
        this.messagingAnalyticsView.classList.add('hidden');
        this.analyticsResultsContainer.classList.add('hidden');
        document.getElementById('apiLinks').classList.remove('hidden');
        this.analyticsQueryForm.reset();
        this.toNumberError.classList.add('hidden');
        this.fromNumberError.classList.add('hidden');
    }

    handleClearAnalyticsFilters() {
        this.analyticsToNumber.value = '';
        this.analyticsFromNumber.value = '';
        DateUtils.clearDateRange(this.analyticsStartDate, this.analyticsEndDate);
        this.toNumberError.classList.add('hidden');
        this.fromNumberError.classList.add('hidden');
    }

    validatePhoneNumber(inputElement, errorElement) {
        const value = inputElement.value.trim();
        const validationMessage = PhoneValidator.getValidationMessage(value);

        if (validationMessage) {
            errorElement.textContent = validationMessage;
            errorElement.classList.remove('hidden');
            return false;
        } else {
            errorElement.classList.add('hidden');
            return true;
        }
    }

    async handleAnalyticsQuery(e) {
        e.preventDefault();

        if (!this.credentials) {
            alert('Please save your credentials first');
            return;
        }

        const toNumber = this.analyticsToNumber.value.trim();
        const fromNumber = this.analyticsFromNumber.value.trim();
        const startDate = this.analyticsStartDate.value;
        const endDate = this.analyticsEndDate.value;

        const isToValid = this.validatePhoneNumber(this.analyticsToNumber, this.toNumberError);
        const isFromValid = this.validatePhoneNumber(this.analyticsFromNumber, this.fromNumberError);

        if (!isToValid || !isFromValid) {
            alert('Please correct phone number format errors');
            return;
        }

        if (startDate && endDate && !DateUtils.validateDateRange(startDate, endDate)) {
            alert('Start date must be before or equal to end date');
            return;
        }

        this.uiManager.showStatus();

        try {
            const requestBody = {
                ...this.credentials,
                to: toNumber || undefined,
                from: fromNumber || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            };

            const response = await fetch('/.netlify/functions/query-messages-analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch analytics data');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch analytics data');
            }

            const messageAnalytics = new MessageAnalytics(result.data);
            const comprehensiveSummary = messageAnalytics.getComprehensiveSummary();
            comprehensiveSummary.messages = result.data;

            this.analyticsResultsContainer.classList.remove('hidden');
            this.messagingAnalyticsDashboard.render(comprehensiveSummary, result.filters);

            this.uiManager.hideStatus();

        } catch (error) {
            alert('Error: ' + error.message);
            this.uiManager.hideStatus();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignalWireApp();
});