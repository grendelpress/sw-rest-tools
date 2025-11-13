import { ChunkFetchOrchestrator } from './chunkFetchOrchestrator.js';
import { MessageAnalytics } from './messageAnalytics.js';
import { MessagingAnalyticsDashboard } from './messagingAnalyticsDashboard.js';

export class HighVolumeMessagesView {
    constructor() {
        this.orchestrator = new ChunkFetchOrchestrator();
        this.container = null;
        this.credentials = null;
        this.allMessages = [];
        this.filteredMessages = [];
        this.currentPage = 1;
        this.pageSize = 100;
        this.setupOrchestrator();
    }

    setupOrchestrator() {
        this.orchestrator.onProgress((progress) => {
            this.updateProgress(progress);
        });

        this.orchestrator.onComplete((result) => {
            this.handleFetchComplete(result);
        });

        this.orchestrator.onError((error) => {
            this.handleFetchError(error);
        });
    }

    show(credentials) {
        this.credentials = credentials;
        this.container = document.getElementById('highVolumeMessagesView');

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'highVolumeMessagesView';
            this.container.className = 'high-volume-view hidden';
            document.querySelector('.container').appendChild(this.container);
        }

        document.getElementById('apiLinks')?.classList.add('hidden');
        document.getElementById('dateRangeSection')?.classList.add('hidden');
        document.getElementById('dataDisplay')?.classList.add('hidden');
        document.getElementById('messagingAnalyticsView')?.classList.add('hidden');

        this.container.classList.remove('hidden');
        this.renderInitialView();
    }

    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
        document.getElementById('apiLinks')?.classList.remove('hidden');
        document.getElementById('dateRangeSection')?.classList.remove('hidden');
    }

    renderInitialView() {
        this.container.innerHTML = `
            <div class="high-volume-header">
                <h2>High-Volume Message Log Retrieval</h2>
                <button id="backFromHighVolumeBtn" class="back-button">← Back to Menu</button>
            </div>

            <div class="high-volume-info">
                <p>This tool fetches messages in weekly chunks to handle large datasets that would normally time out.</p>
                <p>Select a date range below, and the system will automatically retrieve data one week at a time.</p>
            </div>

            <div class="high-volume-form">
                <h3>Select Date Range</h3>
                <form id="highVolumeForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="hvStartDate">Start Date:</label>
                            <input type="date" id="hvStartDate" required>
                        </div>
                        <div class="form-group">
                            <label for="hvEndDate">End Date:</label>
                            <input type="date" id="hvEndDate" required>
                        </div>
                    </div>
                    <div class="date-presets">
                        <button type="button" class="preset-btn" data-days="7">Last Week</button>
                        <button type="button" class="preset-btn" data-days="30">Last Month</button>
                        <button type="button" class="preset-btn" data-days="60">Last 2 Months</button>
                        <button type="button" class="preset-btn" data-days="90">Last 3 Months</button>
                        <button type="button" class="preset-btn" data-month="current">Current Month</button>
                        <button type="button" class="preset-btn" data-month="previous">Previous Month</button>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary-btn">Start Fetching Messages</button>
                    </div>
                </form>
            </div>

            <div id="hvProgressSection" class="hv-progress-section hidden"></div>
            <div id="hvResultsSection" class="hv-results-section hidden"></div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const backBtn = document.getElementById('backFromHighVolumeBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (confirm('Are you sure? Any fetch in progress will be cancelled.')) {
                    this.orchestrator.cancel();
                    this.hide();
                }
            });
        }

        const form = document.getElementById('highVolumeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.startFetch();
            });
        }

        const presetButtons = document.querySelectorAll('.preset-btn[data-days], .preset-btn[data-month]');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.days) {
                    this.setDatePreset(parseInt(btn.dataset.days));
                } else if (btn.dataset.month) {
                    this.setMonthPreset(btn.dataset.month);
                }
            });
        });
    }

    setDatePreset(days) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        document.getElementById('hvStartDate').value = this.formatDateForInput(startDate);
        document.getElementById('hvEndDate').value = this.formatDateForInput(endDate);
    }

    setMonthPreset(monthType) {
        const now = new Date();
        let startDate, endDate;

        if (monthType === 'current') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (monthType === 'previous') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        }

        document.getElementById('hvStartDate').value = this.formatDateForInput(startDate);
        document.getElementById('hvEndDate').value = this.formatDateForInput(endDate);
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async startFetch() {
        const startDate = document.getElementById('hvStartDate').value;
        const endDate = document.getElementById('hvEndDate').value;

        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert('Start date must be before end date');
            return;
        }

        document.getElementById('highVolumeForm').style.display = 'none';
        document.getElementById('hvProgressSection').classList.remove('hidden');

        this.allMessages = [];
        this.filteredMessages = [];

        await this.orchestrator.startFetch(this.credentials, startDate, endDate);
    }

    updateProgress(progress) {
        const progressSection = document.getElementById('hvProgressSection');
        if (!progressSection) return;

        const percentage = progress.totalChunks > 0
            ? Math.round((progress.completedChunks / progress.totalChunks) * 100)
            : 0;

        const estimatedSeconds = this.orchestrator.getEstimatedTimeRemaining();
        const elapsedFormatted = this.orchestrator.formatElapsedTime(progress.elapsedTime);

        progressSection.innerHTML = `
            <div class="progress-header">
                <h3>Fetching Messages...</h3>
                <div class="progress-controls">
                    ${!this.orchestrator.isPaused
                        ? '<button id="pauseBtn" class="control-btn">⏸ Pause</button>'
                        : '<button id="resumeBtn" class="control-btn">▶ Resume</button>'}
                    <button id="cancelBtn" class="control-btn danger">✕ Cancel</button>
                </div>
            </div>

            <div class="progress-stats">
                <div class="stat-item">
                    <span class="stat-label">Progress:</span>
                    <span class="stat-value">${progress.completedChunks} / ${progress.totalChunks} weeks</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Messages Fetched:</span>
                    <span class="stat-value">${progress.allMessages.length.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Elapsed Time:</span>
                    <span class="stat-value">${elapsedFormatted}</span>
                </div>
                ${estimatedSeconds !== null ? `
                    <div class="stat-item">
                        <span class="stat-label">Est. Remaining:</span>
                        <span class="stat-value">${this.formatSeconds(estimatedSeconds)}</span>
                    </div>
                ` : ''}
            </div>

            <div class="overall-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                    <span class="progress-percentage">${percentage}%</span>
                </div>
            </div>

            <div class="chunks-grid">
                ${progress.chunks.map((chunk, index) => `
                    <div class="chunk-item status-${chunk.status}" title="${chunk.start} to ${chunk.end}">
                        <div class="chunk-header">
                            <span class="chunk-label">Week ${index + 1}</span>
                            <span class="chunk-status">${this.getStatusIcon(chunk.status)}</span>
                        </div>
                        <div class="chunk-dates">${chunk.start} - ${chunk.end}</div>
                        ${chunk.status === 'completed' ? `
                            <div class="chunk-count">${chunk.messageCount.toLocaleString()} messages</div>
                        ` : ''}
                        ${chunk.status === 'failed' ? `
                            <div class="chunk-error">${chunk.error || 'Failed'}</div>
                            <button class="retry-btn" data-index="${index}">↻ Retry</button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.orchestrator.pause());
        }

        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.orchestrator.resume());
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to cancel? Progress will be lost.')) {
                    this.orchestrator.cancel();
                    this.renderInitialView();
                }
            });
        }

        const retryButtons = document.querySelectorAll('.retry-btn');
        retryButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const index = parseInt(btn.dataset.index);
                btn.disabled = true;
                btn.textContent = 'Retrying...';
                await this.orchestrator.retryFailedChunk(this.credentials, index);
            });
        });
    }

    getStatusIcon(status) {
        switch (status) {
            case 'pending': return '⏳';
            case 'in-progress': return '⚙️';
            case 'completed': return '✓';
            case 'failed': return '✗';
            default: return '';
        }
    }

    formatSeconds(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}m ${secs}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${mins}m`;
        }
    }

    handleFetchComplete(result) {
        this.allMessages = result.messages;
        this.filteredMessages = [...result.messages];

        document.getElementById('hvProgressSection').classList.add('hidden');
        document.getElementById('hvResultsSection').classList.remove('hidden');

        this.renderResults();
    }

    handleFetchError(error) {
        alert(`Error during fetch: ${error.error}\n\nYou can retry failed weeks or start over.`);
    }

    renderResults() {
        const resultsSection = document.getElementById('hvResultsSection');
        if (!resultsSection) return;

        const analytics = new MessageAnalytics();
        const analyticsData = analytics.analyzeMessages(this.allMessages, {});

        resultsSection.innerHTML = `
            <div class="results-header">
                <h3>Fetch Complete!</h3>
                <button id="startOverBtn" class="secondary-btn">← Start New Fetch</button>
            </div>

            <div class="results-summary">
                <div class="summary-card">
                    <div class="summary-label">Total Messages Retrieved</div>
                    <div class="summary-value">${this.allMessages.length.toLocaleString()}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Date Range</div>
                    <div class="summary-value">${analyticsData.dateRange?.formatted || 'N/A'}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Elapsed Time</div>
                    <div class="summary-value">${this.orchestrator.formatElapsedTime(Date.now() - this.orchestrator.startTime)}</div>
                </div>
            </div>

            <div class="results-actions">
                <button id="exportAllBtn" class="primary-btn">📥 Export All to CSV</button>
                <button id="exportFilteredBtn" class="secondary-btn">📥 Export Filtered to CSV</button>
            </div>

            <div id="resultsAnalytics" class="results-analytics"></div>

            <div class="results-table-section">
                <h3>Message Details</h3>
                <div class="table-controls">
                    <input type="text" id="resultsSearchInput" placeholder="Search messages...">
                    <select id="statusFilter">
                        <option value="">All Statuses</option>
                        <option value="delivered">Delivered</option>
                        <option value="sent">Sent</option>
                        <option value="failed">Failed</option>
                        <option value="undelivered">Undelivered</option>
                    </select>
                    <select id="directionFilter">
                        <option value="">All Directions</option>
                        <option value="inbound">Inbound</option>
                        <option value="outbound-api">Outbound</option>
                    </select>
                </div>
                <div class="pagination-info">
                    Showing <span id="pageStart">1</span>-<span id="pageEnd">100</span> of <span id="totalResults">${this.filteredMessages.length}</span>
                </div>
                <div id="resultsTableContainer" class="results-table-container"></div>
                <div class="pagination-controls">
                    <button id="prevPageBtn" class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''}>← Previous</button>
                    <span id="pageInfo">Page ${this.currentPage}</span>
                    <button id="nextPageBtn" class="page-btn">Next →</button>
                </div>
            </div>
        `;

        const dashboard = new MessagingAnalyticsDashboard('resultsAnalytics');
        dashboard.render(analyticsData, {});

        this.renderResultsTable();
        this.attachResultsEventListeners();
    }

    renderResultsTable() {
        const container = document.getElementById('resultsTableContainer');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.filteredMessages.length);
        const pageMessages = this.filteredMessages.slice(startIndex, endIndex);

        container.innerHTML = `
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Date Sent</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Direction</th>
                        <th>Status</th>
                        <th>Segments</th>
                        <th>Body Preview</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageMessages.map(msg => `
                        <tr>
                            <td>${new Date(msg.dateSent).toLocaleString()}</td>
                            <td>${this.escapeHtml(msg.from)}</td>
                            <td>${this.escapeHtml(msg.to)}</td>
                            <td>${msg.direction}</td>
                            <td><span class="status-badge status-${msg.status.toLowerCase()}">${msg.status}</span></td>
                            <td>${msg.numSegments}</td>
                            <td class="body-preview">${this.escapeHtml((msg.body || '').substring(0, 50))}${msg.body && msg.body.length > 50 ? '...' : ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('pageStart').textContent = startIndex + 1;
        document.getElementById('pageEnd').textContent = endIndex;
        document.getElementById('totalResults').textContent = this.filteredMessages.length;

        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('pageInfo');

        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = endIndex >= this.filteredMessages.length;
        if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${Math.ceil(this.filteredMessages.length / this.pageSize)}`;
    }

    attachResultsEventListeners() {
        const startOverBtn = document.getElementById('startOverBtn');
        if (startOverBtn) {
            startOverBtn.addEventListener('click', () => {
                this.renderInitialView();
            });
        }

        const exportAllBtn = document.getElementById('exportAllBtn');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => {
                this.exportToCSV(this.allMessages, 'all-messages');
            });
        }

        const exportFilteredBtn = document.getElementById('exportFilteredBtn');
        if (exportFilteredBtn) {
            exportFilteredBtn.addEventListener('click', () => {
                this.exportToCSV(this.filteredMessages, 'filtered-messages');
            });
        }

        const searchInput = document.getElementById('resultsSearchInput');
        const statusFilter = document.getElementById('statusFilter');
        const directionFilter = document.getElementById('directionFilter');

        const applyFilters = () => {
            const searchTerm = searchInput?.value.toLowerCase() || '';
            const status = statusFilter?.value || '';
            const direction = directionFilter?.value || '';

            this.filteredMessages = this.allMessages.filter(msg => {
                const matchesSearch = !searchTerm ||
                    msg.from.toLowerCase().includes(searchTerm) ||
                    msg.to.toLowerCase().includes(searchTerm) ||
                    (msg.body || '').toLowerCase().includes(searchTerm);

                const matchesStatus = !status || msg.status.toLowerCase() === status;
                const matchesDirection = !direction || msg.direction.toLowerCase() === direction;

                return matchesSearch && matchesStatus && matchesDirection;
            });

            this.currentPage = 1;
            this.renderResultsTable();
        };

        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
        if (directionFilter) directionFilter.addEventListener('change', applyFilters);

        const prevPageBtn = document.getElementById('prevPageBtn');
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderResultsTable();
                }
            });
        }

        const nextPageBtn = document.getElementById('nextPageBtn');
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                const maxPage = Math.ceil(this.filteredMessages.length / this.pageSize);
                if (this.currentPage < maxPage) {
                    this.currentPage++;
                    this.renderResultsTable();
                }
            });
        }
    }

    exportToCSV(messages, prefix) {
        const headers = ['Date Sent', 'From', 'To', 'Direction', 'Status', 'Segments', 'Price', 'Body'];
        const rows = messages.map(msg => [
            new Date(msg.dateSent).toISOString(),
            msg.from,
            msg.to,
            msg.direction,
            msg.status,
            msg.numSegments,
            msg.price,
            (msg.body || '').replace(/"/g, '""')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `${prefix}-${timestamp}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
