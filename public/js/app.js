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
import { HighVolumeMessagesView } from './highVolumeMessagesView.js';
import { EndpointPageView } from './endpointPageView.js';
import { ENDPOINTS } from './endpointRegistry.js';

class SignalWireApp {
    constructor() {
        this.credentials = StorageManager.getCredentials();
        this.dataFilter = new DataFilter();
        this.uiManager = new UIManager();
        this.analytics = new Analytics();
        this.analyticsRenderer = new AnalyticsRenderer(document.getElementById('analyticsContainer'));
        this.messagingAnalyticsDashboard = new MessagingAnalyticsDashboard('analyticsResultsContainer');
        this.highVolumeMessagesView = new HighVolumeMessagesView();
        this.endpointPageView = new EndpointPageView(document.getElementById('endpointPageView'));
        this.endpointPageView.setCredentials(this.credentials);
        this.currentDataType = '';
        this.currentProjectName = '';
        this.csvDataForDownload = null;

        this.initializeElements();
        this.initializeDataTable();
        this.bindEvents();
        this.initializeForm();
        this.updateConnectionStatus();
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
        this.topBarBackBtn = document.getElementById('topBarBackBtn');
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
        this.clearAnalyticsFiltersBtn = document.getElementById('clearAnalyticsFiltersBtn');
        this.analyticsResultsContainer = document.getElementById('analyticsResultsContainer');

        // Quick cards on overview
        this.quickCards = document.querySelectorAll('.quick-card');
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

    updateConnectionStatus() {
        this.uiManager.updateConnectionStatus(!!this.credentials);
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
        this.topBarBackBtn.addEventListener('click', () => this.handleTopBarBack());
        this.toggleAnalyticsBtn.addEventListener('click', () => this.handleToggleAnalytics());

        // Messaging Analytics events
        this.analyticsQueryForm.addEventListener('submit', (e) => this.handleAnalyticsQuery(e));
        this.clearAnalyticsFiltersBtn.addEventListener('click', () => this.handleClearAnalyticsFilters());
        this.analyticsToNumber.addEventListener('input', () => this.validatePhoneNumber(this.analyticsToNumber, this.toNumberError));
        this.analyticsFromNumber.addEventListener('input', () => this.validatePhoneNumber(this.analyticsFromNumber, this.fromNumberError));

        // Endpoint page events — listen for sidebar subitem selection
        document.addEventListener('endpoint-selected', (e) => {
            this.handleEndpointSelected(e.detail.target);
        });

        // Delegate clicks within the endpoint page (e.g. "Fetch Data" button)
        document.getElementById('endpointPageView').addEventListener('click', (e) => {
            const runBtn = e.target.closest('.endpoint-run-btn');
            if (runBtn) {
                const target = runBtn.dataset.runTarget;
                if (target) {
                    this.runEndpoint(target);
                }
            }
        });

        // Delegate form submissions within the endpoint page
        document.getElementById('endpointPageView').addEventListener('submit', (e) => {
            const form = e.target.closest('.endpoint-form');
            if (form) {
                e.preventDefault();
                const targetId = form.dataset.endpointId;
                if (targetId) {
                    this.handleEndpointFormSubmit(targetId, form);
                }
            }
        });

        // Quick card navigation
        this.quickCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const target = card.dataset.quick;
                if (target) {
                    this.uiManager.switchCategory(target);
                }
            });
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
        this.endpointPageView.setCredentials(this.credentials);
        this.updateConnectionStatus();
    }

    handleClearCredentials() {
        StorageManager.clearCredentials();
        this.credentials = null;
        this.credentialsForm.reset();
        this.endpointPageView.setCredentials(null);
        this.uiManager.hideStatus();
        this.uiManager.hideDataDisplay();
        this.updateConnectionStatus();
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
        const dataToDownload = this.csvDataForDownload || this.dataFilter.getFilteredData();
        const filename = this.generateDownloadFilename('Filtered');
        CSVUtils.downloadCSV(dataToDownload, filename);
    }

    handleDownloadOriginal() {
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
        this.csvDataForDownload = null;
        this.currentDataType = '';
        this.currentProjectName = '';
        this.analyticsRenderer.hide();
        this.resetAnalyticsToggle();
    }

    handleToggleAnalytics() {
        const analyticsContainer = document.getElementById('analyticsContainer');
        const isHidden = analyticsContainer.classList.contains('hidden');

        if (isHidden) {
            this.analytics.setData(this.dataFilter.getOriginalData(), this.currentDataType);
            const analyticsData = this.analytics.generateSummary();
            this.analyticsRenderer.render(analyticsData);
            analyticsContainer.classList.remove('hidden');
            this.toggleAnalyticsBtn.innerHTML = '📊 Hide Analytics';
        } else {
            analyticsContainer.classList.add('hidden');
            this.toggleAnalyticsBtn.innerHTML = '📊 Show Analytics';
        }
    }

    resetAnalyticsToggle() {
        const analyticsContainer = document.getElementById('analyticsContainer');
        analyticsContainer.classList.add('hidden');
        this.toggleAnalyticsBtn.innerHTML = '📊 Show Analytics';
    }

    handleEndpointSelected(target) {
        const config = ENDPOINTS[target];
        if (!config) return;

        // Show the endpoint page
        this.endpointPageView.show(target);
        this.uiManager.showEndpointPage();

        // For active endpoints that need immediate action, launch them
        if (config.status === 'active') {
            if (config.type === 'messaging-analytics') {
                if (!this.credentials) {
                    alert('Please save your credentials first');
                    this.uiManager.toggleConnectionPanel();
                    return;
                }
                this.showMessagingAnalytics();
            } else if (config.type === 'high-volume-messages') {
                if (!this.credentials) {
                    alert('Please save your credentials first');
                    this.uiManager.toggleConnectionPanel();
                    return;
                }
                this.showHighVolumeMessages();
            }
        }
    }

    async handleEndpointFormSubmit(targetId, form) {
        if (!this.credentials) {
            alert('Please save your credentials first');
            this.uiManager.toggleConnectionPanel();
            return;
        }

        const config = ENDPOINTS[targetId];
        if (!config || !config.apiPath) return;

        // Confirmation for destructive actions
        if (config.confirmMessage) {
            if (!confirm(config.confirmMessage)) {
                return;
            }
        }

        // Gather form field values (handle checkboxes: unchecked boxes are absent from FormData)
        const formData = new FormData(form);
        const fieldValues = {};
        for (const [key, value] of formData.entries()) {
            if (value !== '') {
                fieldValues[key] = value;
            }
        }
        for (const field of config.fields) {
            if (field.type === 'checkbox') {
                fieldValues[field.name] = form.elements[field.name] ? form.elements[field.name].checked : false;
            }
        }

        // Separate path params from body/query params.
        // Only 'id' goes in the path; other fields like 'e911_address_id' go in the body.
        const pathParams = {};
        const bodyParams = {};
        const queryParams = {};

        for (const field of config.fields) {
            const val = fieldValues[field.name];
            if (val === undefined || val === '' || val === false) continue;

            if (field.name === 'id') {
                pathParams[field.name] = val;
            } else if (config.method === 'GET' || config.method === 'DELETE') {
                queryParams[field.name] = val;
            } else {
                bodyParams[field.name] = val;
            }
        }

        this.endpointPageView.showLoading(targetId);

        try {
            const response = await fetch('/.netlify/functions/phone-numbers-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...this.credentials,
                    method: config.method,
                    apiPath: config.apiPath,
                    pathParams: Object.keys(pathParams).length > 0 ? pathParams : undefined,
                    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
                    bodyParams: Object.keys(bodyParams).length > 0 ? bodyParams : undefined
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                this.endpointPageView.showResult(targetId, result, true);
                return;
            }

            // For DELETE endpoints with no body, show success message
            if (config.method === 'DELETE' && (!result.data || Object.keys(result.data).length === 0)) {
                this.endpointPageView.showSuccess(targetId, 'The request was completed successfully.');
            } else {
                this.endpointPageView.showResult(targetId, result);
            }
        } catch (error) {
            this.endpointPageView.showResult(targetId, { error: error.message }, true);
        }
    }

    async runEndpoint(target) {
        if (!this.credentials) {
            alert('Please save your credentials first');
            this.uiManager.toggleConnectionPanel();
            return;
        }

        const config = ENDPOINTS[target];
        if (!config || !config.endpoint) return;

        const endpoint = config.endpoint;

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
            await this.processApiResponse(endpoint, response);
        } catch (error) {
            alert('Error: ' + error.message);
            this.uiManager.hideStatus();
            this.uiManager.showDateRangeSection();
        }
    }

    async handleSpecialEndpoints(endpoint, response) {
        if (endpoint === '/test-bins-api') {
            const jsonResponse = await response.json();

            if (jsonResponse.success && jsonResponse.tableData) {
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

                this.csvDataForDownload = jsonResponse.csvData || csvLikeData;

                this.dataFilter.setOriginalData(csvLikeData);
                this.uiManager.showDataDisplay(this.currentDataType);
                this.dataTable.render(csvLikeData, csvLikeData.length);

                this.currentProjectName = 'TestData';

                const summary = jsonResponse.summary;
                const summaryText = `Summary: ${summary.totalBins} total bins, ${summary.detailedBins} with details, ${summary.withContents} with contents, avg content length: ${Math.round(summary.averageContentLength)} chars`;

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
        const csvText = await response.text();

        const filename = APIClient.extractFilename(response);
        const projectNameMatch = filename.match(/^[^-]+-(.+)\.csv$/);
        this.currentProjectName = projectNameMatch ? projectNameMatch[1] : '';

        const originalData = CSVUtils.parseCSV(csvText);
        this.dataFilter.setOriginalData(originalData);

        this.uiManager.showDataDisplay(this.currentDataType);

        if (this.startDateInput.value) {
            this.filterStartDateInput.value = this.startDateInput.value;
        }
        if (this.endDateInput.value) {
            this.filterEndDateInput.value = this.endDateInput.value;
        }

        this.dataTable.render(originalData, originalData.length);
        this.resetAnalyticsToggle();
    }

    async processApiResponse(endpoint, response) {
        if (endpoint === '/test-bins-api' || endpoint === '/generate-bins-csv') {
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
        this.uiManager.hideAllSections();
        this.messagingAnalyticsView.classList.remove('hidden');
        this.analyticsResultsContainer.classList.add('hidden');
        this.uiManager.showTopBarBack();
    }

    showHighVolumeMessages() {
        this.highVolumeMessagesView.show(this.credentials);
        this.uiManager.showTopBarBack();
    }

    handleTopBarBack() {
        const hvView = document.getElementById('highVolumeMessagesView');
        if (hvView && !hvView.classList.contains('hidden')) {
            if (confirm('Are you sure? Any fetch in progress will be cancelled.')) {
                this.highVolumeMessagesView.orchestrator.cancel();
                this.highVolumeMessagesView.hide();
                this.uiManager.hideTopBarBack();
                this.uiManager.showEndpointPage();
            }
        } else if (!this.messagingAnalyticsView.classList.contains('hidden')) {
            this.handleBackFromAnalytics();
        } else {
            this.handleBack();
        }
    }

    handleBackFromAnalytics() {
        this.messagingAnalyticsView.classList.add('hidden');
        this.analyticsResultsContainer.classList.add('hidden');
        this.analyticsQueryForm.reset();
        this.toNumberError.classList.add('hidden');
        this.fromNumberError.classList.add('hidden');
        // Return to the endpoint page if there's an active subitem
        if (this.uiManager.activeTarget) {
            this.endpointPageView.show(this.uiManager.activeTarget);
            this.uiManager.showEndpointPage();
        } else {
            this.uiManager.switchCategory(this.uiManager.currentCategory);
        }
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
                to: toNumber ? PhoneValidator.normalizeToE164(toNumber) : undefined,
                from: fromNumber ? PhoneValidator.normalizeToE164(fromNumber) : undefined,
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
