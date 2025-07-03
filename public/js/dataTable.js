// Data table rendering and management
export class DataTable {
    constructor(tableElement, headElement, bodyElement, recordCountElement, filteredCountElement) {
        this.table = tableElement;
        this.head = headElement;
        this.body = bodyElement;
        this.recordCount = recordCountElement;
        this.filteredCount = filteredCountElement;
    }
    
    render(data, originalDataLength = null) {
        if (!data.length) {
            this.renderEmpty();
            return;
        }
        
        const headers = Object.keys(data[0]);
        this.renderHeader(headers);
        this.renderBody(data, headers);
        this.updateRecordCounts(data.length, originalDataLength);
    }
    
    renderEmpty() {
        this.head.innerHTML = '';
        this.body.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
        this.updateRecordCounts(0, 0);
    }
    
    renderHeader(headers) {
        this.head.innerHTML = '';
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        this.head.appendChild(headerRow);
    }
    
    renderBody(data, headers) {
        this.body.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                const value = row[header] || '';
                td.textContent = value;
                // Add title attribute for full content on hover
                if (value.length > 20) {
                    td.title = value;
                }
                tr.appendChild(td);
            });
            this.body.appendChild(tr);
        });
    }
    
    updateRecordCounts(filteredLength, originalLength = null) {
        if (originalLength !== null) {
            this.recordCount.textContent = `${originalLength} total records`;
            if (filteredLength !== originalLength) {
                this.filteredCount.textContent = `${filteredLength} filtered results`;
                this.filteredCount.classList.remove('hidden');
            } else {
                this.filteredCount.classList.add('hidden');
            }
        } else {
            this.recordCount.textContent = `${filteredLength} records`;
            this.filteredCount.classList.add('hidden');
        }
    }
}