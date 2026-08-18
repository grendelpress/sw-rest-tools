// Messaging Analytics Dashboard Renderer
export class MessagingAnalyticsDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.analyticsData = null;
    }

    render(analyticsData, filters) {
        this.analyticsData = analyticsData;

        if (!this.container) {
            console.error('Analytics container not found');
            return;
        }

        this.container.innerHTML = this.buildDashboardHTML(analyticsData, filters);
        this.attachEventListeners();
    }

    buildDashboardHTML(data, filters) {
        const { metrics, statusBreakdown, directionBreakdown, errorBreakdown, volumeByDate, peakDay, totalCost, avgSegments, dateRange } = data;

        return `
            <div class="analytics-dashboard">
                <div class="analytics-header">
                    <h2>Messaging Analytics Dashboard</h2>
                    ${this.buildFiltersDisplay(filters, dateRange)}
                </div>

                ${this.buildPrimaryMetrics(metrics)}
                ${this.buildSecondaryMetrics(totalCost, avgSegments, peakDay)}
                ${this.buildBreakdownSection(statusBreakdown, directionBreakdown)}
                ${errorBreakdown.length > 0 ? this.buildErrorSection(errorBreakdown) : ''}
                ${this.buildVolumeSection(volumeByDate)}
                ${this.buildDetailedTable(data.messages || [])}
            </div>
        `;
    }

    buildFiltersDisplay(filters, dateRange) {
        const filterParts = [];

        if (filters.to) filterParts.push(`To: ${filters.to}`);
        if (filters.from) filterParts.push(`From: ${filters.from}`);

        const dateRangeStr = dateRange ? dateRange.formatted :
            (filters.startDate && filters.endDate) ? `${filters.startDate} - ${filters.endDate}` :
            filters.startDate ? `From ${filters.startDate}` :
            filters.endDate ? `Until ${filters.endDate}` : 'All Time';

        return `
            <div class="analytics-filters-display">
                <div class="filter-item">
                    <span class="filter-label">Date Range:</span>
                    <span class="filter-value">${dateRangeStr}</span>
                </div>
                ${filterParts.length > 0 ? `
                    <div class="filter-item">
                        <span class="filter-label">Filters:</span>
                        <span class="filter-value">${filterParts.join(' | ')}</span>
                    </div>
                ` : ''}
                <div class="filter-item">
                    <span class="filter-label">Last Updated:</span>
                    <span class="filter-value">${new Date().toLocaleString()}</span>
                </div>
            </div>
        `;
    }

    buildPrimaryMetrics(metrics) {
        return `
            <div class="metrics-grid primary-metrics">
                <div class="metric-card received">
                    <div class="metric-icon">📨</div>
                    <div class="metric-content">
                        <div class="metric-label">Total Received Messages</div>
                        <div class="metric-value">${metrics.receivedMessages.toLocaleString()}</div>
                        <div class="metric-subtext">${metrics.receivedPercentage}% of total</div>
                    </div>
                </div>

                <div class="metric-card sent">
                    <div class="metric-icon">📤</div>
                    <div class="metric-content">
                        <div class="metric-label">Total Sent Messages</div>
                        <div class="metric-value">${metrics.sentMessages.toLocaleString()}</div>
                        <div class="metric-subtext">${metrics.sentPercentage}% of total</div>
                    </div>
                </div>

                <div class="metric-card opt-outs ${metrics.optOuts > 0 ? 'warning' : ''}">
                    <div class="metric-icon">🚫</div>
                    <div class="metric-content">
                        <div class="metric-label">Total Opt-Outs</div>
                        <div class="metric-value">${metrics.optOuts.toLocaleString()}</div>
                        <div class="metric-subtext">${metrics.optOutRate}% opt-out rate</div>
                    </div>
                </div>

                <div class="metric-card delivery-issues ${metrics.deliveryIssues > 0 ? 'error' : ''}">
                    <div class="metric-icon">⚠️</div>
                    <div class="metric-content">
                        <div class="metric-label">Delivery Issues/Errors</div>
                        <div class="metric-value">${metrics.deliveryIssues.toLocaleString()}</div>
                        <div class="metric-subtext">${metrics.deliveryFailureRate}% failure rate</div>
                    </div>
                </div>
            </div>
        `;
    }

    buildSecondaryMetrics(totalCost, avgSegments, peakDay) {
        return `
            <div class="metrics-grid secondary-metrics">
                <div class="metric-card small">
                    <div class="metric-label">Total Cost</div>
                    <div class="metric-value small">${totalCost ? totalCost.formatted : 'N/A'}</div>
                </div>

                <div class="metric-card small">
                    <div class="metric-label">Avg Segments</div>
                    <div class="metric-value small">${avgSegments}</div>
                </div>

                ${peakDay ? `
                    <div class="metric-card small">
                        <div class="metric-label">Peak Day</div>
                        <div class="metric-value small">${peakDay.date}</div>
                        <div class="metric-subtext">${peakDay.count} messages</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    buildBreakdownSection(statusBreakdown, directionBreakdown) {
        return `
            <div class="breakdown-section">
                <div class="breakdown-card">
                    <h3>Status Breakdown</h3>
                    <div class="breakdown-list">
                        ${statusBreakdown.map(item => `
                            <div class="breakdown-item">
                                <div class="breakdown-label">
                                    <span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span>
                                </div>
                                <div class="breakdown-stats">
                                    <span class="breakdown-count">${item.count.toLocaleString()}</span>
                                    <span class="breakdown-percentage">(${item.percentage}%)</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="breakdown-card">
                    <h3>Direction Breakdown</h3>
                    <div class="breakdown-list">
                        ${directionBreakdown.map(item => `
                            <div class="breakdown-item">
                                <div class="breakdown-label">
                                    <span class="direction-badge direction-${item.direction.toLowerCase()}">${item.direction}</span>
                                </div>
                                <div class="breakdown-stats">
                                    <span class="breakdown-count">${item.count.toLocaleString()}</span>
                                    <span class="breakdown-percentage">(${item.percentage}%)</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    buildErrorSection(errorBreakdown) {
        return `
            <div class="error-section">
                <h3>Error Details</h3>
                <div class="error-list">
                    ${errorBreakdown.map(item => `
                        <div class="error-item">
                            <div class="error-label">${this.escapeHtml(item.error)}</div>
                            <div class="error-stats">
                                <span class="error-count">${item.count.toLocaleString()}</span>
                                <span class="error-percentage">(${item.percentage}%)</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    buildVolumeSection(volumeByDate) {
        if (!volumeByDate.length) return '';

        return `
            <div class="volume-section">
                <h3>Message Volume by Date</h3>
                <div class="volume-chart">
                    ${volumeByDate.map(item => {
                        const maxCount = Math.max(...volumeByDate.map(v => v.count));
                        const heightPercent = (item.count / maxCount) * 100;
                        return `
                            <div class="volume-bar-container" title="${item.date}: ${item.count} messages">
                                <div class="volume-bar" style="height: ${heightPercent}%"></div>
                                <div class="volume-count">${item.count}</div>
                                <div class="volume-date">${item.date}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    buildDetailedTable(messages) {
        if (!messages || !messages.length) return '';

        return `
            <div class="detailed-results">
                <div class="results-header">
                    <h3>Detailed Results</h3>
                    <button id="toggleDetailsBtn" class="toggle-btn">Show Details</button>
                </div>
                <div id="detailsTableContainer" class="details-table-container hidden">
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>Date Sent</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Status</th>
                                <th>Direction</th>
                                <th>Segments</th>
                                <th>Body Preview</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${messages.slice(0, 100).map(msg => `
                                <tr>
                                    <td>${new Date(msg.dateSent).toLocaleString()}</td>
                                    <td>${this.escapeHtml(msg.from)}</td>
                                    <td>${this.escapeHtml(msg.to)}</td>
                                    <td><span class="status-badge status-${msg.status.toLowerCase()}">${msg.status}</span></td>
                                    <td>${msg.direction}</td>
                                    <td>${msg.numSegments}</td>
                                    <td class="body-preview">${this.escapeHtml((msg.body || '').substring(0, 50))}${msg.body && msg.body.length > 50 ? '...' : ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${messages.length > 100 ? `<p class="table-note">Showing first 100 of ${messages.length} messages</p>` : ''}
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const toggleBtn = document.getElementById('toggleDetailsBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const container = document.getElementById('detailsTableContainer');
                if (container) {
                    container.classList.toggle('hidden');
                    toggleBtn.textContent = container.classList.contains('hidden') ? 'Show Details' : 'Hide Details';
                }
            });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    hide() {
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.add('hidden');
        }
    }

    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }
}
