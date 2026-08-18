import { ENDPOINTS } from './endpointRegistry.js';
import { fetchPhoneNumbers, fetchE911Addresses } from './entityPicker.js';
import { PhoneValidator } from './phoneValidator.js';

export class EndpointPageView {
    constructor(container) {
        this.container = container;
        this._credentials = null;
    }

    setCredentials(credentials) {
        this._credentials = credentials;
    }

    show(targetId) {
        const config = ENDPOINTS[targetId];
        if (!config) {
            this.container.innerHTML = '';
            return;
        }

        const methodBadge = config.method
            ? `<span class="tool-method method-${config.method.toLowerCase()}">${config.method}</span>`
            : '';

        const content = config.status === 'coming-soon'
            ? this._comingSoonContent(config)
            : this._activeContent(config, targetId);

        this.container.innerHTML = `
            <div class="endpoint-page" data-endpoint="${targetId}">
                <div class="endpoint-header">
                    ${methodBadge}
                    <h1 class="view-title">${config.title}</h1>
                </div>
                <p class="view-subtitle">${config.description}</p>
                <div class="endpoint-content">${content}</div>
            </div>
        `;
        this.container.classList.remove('hidden');

        this._populatePickers(targetId);
    }

    hide() {
        this.container.classList.add('hidden');
        this.container.innerHTML = '';
    }

    _populatePickers(targetId) {
        const config = ENDPOINTS[targetId];
        if (!config || !config.fields) return;

        const pickerFields = config.fields.filter(f => f.type === 'picker');
        for (const field of pickerFields) {
            this._populatePicker(field.name, field.pickerType);
        }

        this.container.querySelectorAll('.picker-refresh-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const fieldName = btn.dataset.pickerRefresh;
                const select = this.container.querySelector(`#field-${fieldName}`);
                if (!select) return;
                const pickerType = select.dataset.pickerType;
                this._populatePicker(fieldName, pickerType);
            });
        });
    }

    async _populatePicker(fieldName, pickerType) {
        const select = this.container.querySelector(`#field-${fieldName}`);
        const searchInput = this.container.querySelector(`#search-${fieldName}`);
        if (!select) return;

        select.disabled = true;
        select.innerHTML = '<option value="">Loading...</option>';
        if (searchInput) { searchInput.disabled = true; searchInput.value = ''; }

        try {
            if (!this._credentials) {
                select.innerHTML = '<option value="">Save credentials first</option>';
                return;
            }

            const items = pickerType === 'phone-number'
                ? await fetchPhoneNumbers(this._credentials)
                : await fetchE911Addresses(this._credentials);

            if (items.length === 0) {
                select.innerHTML = '<option value="">No items available</option>';
                select.disabled = true;
                return;
            }

            select.dataset.allItems = JSON.stringify(items);
            this._renderPickerOptions(select, items, pickerType);
            select.disabled = false;
            if (searchInput) searchInput.disabled = false;

            if (searchInput && !searchInput.dataset.wired) {
                searchInput.dataset.wired = '1';
                searchInput.addEventListener('input', () => {
                    const allItems = JSON.parse(select.dataset.allItems || '[]');
                    this._renderPickerOptions(select, allItems, pickerType, searchInput.value);
                });
            }
        } catch (err) {
            select.innerHTML = `<option value="">Error: ${this._escapeHtml(err.message)}</option>`;
            select.disabled = true;
            if (searchInput) searchInput.disabled = true;
        }
    }

    _renderPickerOptions(select, items, pickerType, filterTerm = '') {
        const current = select.value;
        const hasFilter = Boolean(filterTerm.trim());
        let filtered = items;

        if (hasFilter) {
            const term = filterTerm.toLowerCase();
            if (pickerType === 'phone-number') {
                const digits = PhoneValidator.toDigits(filterTerm);
                filtered = items.filter(item => {
                    if (item.label.toLowerCase().includes(term)) return true;
                    return digits.length >= 7 && PhoneValidator.matches(item.label, filterTerm);
                });
            } else {
                filtered = items.filter(item => item.label.toLowerCase().includes(term));
            }
        }

        const status = this.container.querySelector(`#picker-status-${select.name}`);
        if (filtered.length === 0) {
            select.innerHTML = '<option value="">No matching results</option>';
            if (status) status.textContent = 'No matching results';
            return;
        }

        const options = filtered.map(item =>
            `<option value="${this._escapeHtml(item.id)}">${this._escapeHtml(item.label)}</option>`
        ).join('');
        select.innerHTML = `<option value="">Select...</option>${options}`;

        if (hasFilter && filtered.length === 1) {
            select.value = filtered[0].id;
            if (status) status.textContent = '1 match found and selected';
        } else if ([...select.options].some(o => o.value === current)) {
            select.value = current;
            if (status) status.textContent = hasFilter ? `${filtered.length} matches found` : '';
        } else if (status) {
            status.textContent = hasFilter ? `${filtered.length} matches found — choose one` : '';
        }
    }

    _comingSoonContent(config) {
        return `
            <div class="coming-soon-panel">
                <div class="coming-soon-icon-large" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="48" height="48">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4"/>
                        <path d="M12 16h.01"/>
                    </svg>
                </div>
                <h2 class="coming-soon-title">Coming Soon</h2>
                <p class="coming-soon-message">This tool is not yet available. Check back soon — we're working on adding it.</p>
                <span class="coming-soon-badge">Coming Soon</span>
            </div>
        `;
    }

    _activeContent(config, targetId) {
        if (config.type === 'messaging-analytics') {
            return '<p class="endpoint-loading-text">Loading analytics tool...</p>';
        }
        if (config.type === 'high-volume-messages') {
            return '<p class="endpoint-loading-text">Loading high-volume tool...</p>';
        }

        // Legacy CSV-style endpoints (list phone numbers, messages, etc.)
        if (config.endpoint && !config.formType) {
            return `
                <div class="endpoint-active-panel">
                    <p class="endpoint-ready-text">This tool is ready to use. Click the button below to fetch your data.</p>
                    <button type="button" class="primary-btn endpoint-run-btn" data-run-target="${targetId}">
                        Fetch Data
                    </button>
                </div>
            `;
        }

        // Dynamic form-based endpoints
        return this._renderForm(config, targetId);
    }

    _renderForm(config, targetId) {
        const isDelete = config.formType === 'delete';
        const submitLabel = isDelete ? 'Delete' :
            config.formType === 'create' ? 'Submit' :
            config.formType === 'update' ? 'Update' :
            config.formType === 'search' || config.formType === 'list' ? 'Search' :
            'Retrieve';

        const formFields = config.fields.map(field => {
            const requiredAttr = field.required ? 'required' : '';
            const requiredMark = field.required ? ' <span class="field-required">*</span>' : '';
            const defaultVal = field.default ? `value="${field.default}"` : '';

            let inputHtml;
            if (field.type === 'picker') {
                const searchPlaceholder = field.pickerType === 'phone-number'
                    ? 'Search phone numbers...'
                    : 'Search address label or location...';
                inputHtml = `<input type="text" class="picker-search" id="search-${field.name}" placeholder="${searchPlaceholder}" autocomplete="off" disabled>
                <div class="picker-row">
                <select name="${field.name}" id="field-${field.name}" class="entity-picker" data-picker-type="${field.pickerType}" ${requiredAttr} disabled>
                    <option value="">Loading...</option>
                </select>
                <button type="button" class="picker-refresh-btn" data-picker-refresh="${field.name}" title="Refresh list">↻</button>
                </div>
                <div class="picker-status" id="picker-status-${field.name}" aria-live="polite"></div>`;
                return `
                    <div class="endpoint-form-group endpoint-form-group-picker">
                        <label for="field-${field.name}">${field.label}${requiredMark}</label>
                        <div class="picker-wrapper">${inputHtml}</div>
                    </div>
                `;
            } else if (field.type === 'select') {
                const options = field.options.map(opt =>
                    `<option value="${opt.value}"${opt.value === (field.default || '') ? ' selected' : ''}>${opt.label}</option>`
                ).join('');
                inputHtml = `<select name="${field.name}" id="field-${field.name}" ${requiredAttr}>${options}</select>`;
            } else if (field.type === 'checkbox') {
                const checked = field.default === true ? 'checked' : '';
                inputHtml = `<input type="checkbox" name="${field.name}" id="field-${field.name}" ${checked}>`;
                return `
                    <div class="endpoint-form-group endpoint-form-checkbox">
                        <label for="field-${field.name}">
                            <input type="checkbox" name="${field.name}" id="field-${field.name}" ${checked}>
                            ${field.label}
                        </label>
                    </div>
                `;
            } else if (field.type === 'number') {
                inputHtml = `<input type="number" name="${field.name}" id="field-${field.name}" placeholder="${field.placeholder || ''}" ${defaultVal} ${requiredAttr}>`;
            } else {
                inputHtml = `<input type="${field.type || 'text'}" name="${field.name}" id="field-${field.name}" placeholder="${field.placeholder || ''}" ${defaultVal} ${requiredAttr}>`;
            }

            return `
                <div class="endpoint-form-group">
                    <label for="field-${field.name}">${field.label}${requiredMark}</label>
                    ${inputHtml}
                </div>
            `;
        }).join('');

        const confirmAttr = config.confirmMessage ? `data-confirm="${config.confirmMessage.replace(/"/g, '&quot;')}"` : '';

        return `
            <div class="endpoint-form-panel">
                <form class="endpoint-form" data-endpoint-id="${targetId}" ${confirmAttr}>
                    ${formFields}
                    <div class="endpoint-form-actions">
                        <button type="submit" class="primary-btn endpoint-submit-btn ${isDelete ? 'danger-btn' : ''}">
                            ${submitLabel}
                        </button>
                    </div>
                </form>
                <div class="endpoint-result" id="endpointResult" style="display:none;"></div>
            </div>
        `;
    }

    showResult(targetId, result, isError = false) {
        const resultDiv = this.container.querySelector('#endpointResult');
        if (!resultDiv) return;

        if (isError) {
            const apiError = result.apiError;
            let extraHtml = '';
            if (apiError) {
                if (Array.isArray(apiError.errors) && apiError.errors.length > 0) {
                    const errorItems = apiError.errors.map(e => `<li>${this._escapeHtml(typeof e === 'string' ? e : JSON.stringify(e))}</li>`).join('');
                    extraHtml += `<div class="result-error-detail"><strong>Errors:</strong><ul>${errorItems}</ul></div>`;
                }
                if (Array.isArray(apiError.candidates) && apiError.candidates.length > 0) {
                    const candidateRows = apiError.candidates.map(c => {
                        const cells = Object.entries(c).map(([k, v]) => `<td>${this._escapeHtml(String(v ?? ''))}</td>`).join('');
                        const header = Object.keys(c).map(k => `<th>${this._escapeHtml(this._humanizeKey(k))}</th>`).join('');
                        return `<tr>${cells}</tr>`;
                    }).join('');
                    const candidateHeader = apiError.candidates.length > 0
                        ? Object.keys(apiError.candidates[0]).map(k => `<th>${this._escapeHtml(this._humanizeKey(k))}</th>`).join('')
                        : '';
                    extraHtml += `<div class="result-error-detail"><strong>Suggested addresses:</strong>
                        <table class="result-table"><thead><tr>${candidateHeader}</tr></thead><tbody>${candidateRows}</tbody></table>
                    </div>`;
                }
            }
            resultDiv.innerHTML = `
                <div class="endpoint-result-error">
                    <div class="result-error-icon">!</div>
                    <div class="result-error-body">
                        <h3>Request Failed</h3>
                        <p>${this._escapeHtml(result.error || result.message || 'Unknown error occurred')}</p>
                        ${result.statusCode ? `<span class="result-status-code">HTTP ${result.statusCode}</span>` : ''}
                        ${extraHtml}
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
            return;
        }

        const data = result.data || result;
        const config = ENDPOINTS[targetId];

        // For list endpoints, render a table
        if (config.formType === 'list' && data.data && Array.isArray(data.data)) {
            resultDiv.innerHTML = this._renderResultTable(data.data, data.links);
            resultDiv.style.display = 'block';
            return;
        }

        // For search endpoints, render a table of available numbers
        if (config.formType === 'search' && data.data && Array.isArray(data.data)) {
            resultDiv.innerHTML = this._renderResultTable(data.data, data.links);
            resultDiv.style.display = 'block';
            return;
        }

        // For single records, render a key-value card
        resultDiv.innerHTML = this._renderResultCard(data);
        resultDiv.style.display = 'block';
    }

    showSuccess(targetId, message) {
        const resultDiv = this.container.querySelector('#endpointResult');
        if (!resultDiv) return;
        resultDiv.innerHTML = `
            <div class="endpoint-result-success">
                <div class="result-success-icon">&#10003;</div>
                <div class="result-success-body">
                    <h3>Success</h3>
                    <p>${this._escapeHtml(message)}</p>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';
    }

    showLoading(targetId) {
        const resultDiv = this.container.querySelector('#endpointResult');
        if (!resultDiv) return;
        resultDiv.innerHTML = `<div class="endpoint-loading"><span class="endpoint-spinner"></span> Loading...</div>`;
        resultDiv.style.display = 'block';
    }

    _renderResultCard(data) {
        const rows = Object.entries(data).map(([key, value]) => {
            const displayValue = this._formatValue(value);
            return `
                <div class="result-card-row">
                    <span class="result-card-key">${this._escapeHtml(this._humanizeKey(key))}</span>
                    <span class="result-card-value">${displayValue}</span>
                </div>
            `;
        }).join('');

        return `<div class="result-card">${rows}</div>`;
    }

    _renderResultTable(items, links) {
        if (!items || items.length === 0) {
            return '<div class="endpoint-empty">No results found.</div>';
        }

        const columns = Object.keys(items[0]).slice(0, 12);

        const headerCells = columns.map(col =>
            `<th>${this._escapeHtml(this._humanizeKey(col))}</th>`
        ).join('');

        const bodyRows = items.map(item => {
            const cells = columns.map(col => {
                const val = item[col];
                const display = this._formatValue(val);
                return `<td>${display}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');

        let pagination = '';
        if (links) {
            const linkParts = [];
            if (links.self) linkParts.push('<span class="result-pagination-info">Current page</span>');
            if (links.next) linkParts.push('<span class="result-pagination-info">More results available on next page</span>');
            if (links.prev) linkParts.push('<span class="result-pagination-info">Previous page available</span>');
            if (linkParts.length > 0) {
                pagination = `<div class="result-pagination">${linkParts.join('')}</div>`;
            }
        }

        return `
            <div class="result-table-wrapper">
                <table class="result-table">
                    <thead><tr>${headerCells}</tr></thead>
                    <tbody>${bodyRows}</tbody>
                </table>
                ${pagination}
            </div>
        `;
    }

    _formatValue(value) {
        if (value === null || value === undefined) return '<span class="result-null">—</span>';
        if (Array.isArray(value)) {
            return value.map(v => this._escapeHtml(String(v))).join(', ');
        }
        if (typeof value === 'object') {
            return `<span class="result-object">${this._escapeHtml(JSON.stringify(value))}</span>`;
        }
        const str = String(value);
        if (str.length > 200) {
            return this._escapeHtml(str.substring(0, 200)) + '...';
        }
        return this._escapeHtml(str);
    }

    _humanizeKey(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
