// Analytics component for generating data insights and summaries
export class Analytics {
    constructor() {
        this.data = [];
        this.dataType = '';
    }
    
    setData(data, dataType) {
        this.data = data;
        this.dataType = dataType;
    }
    
    generateSummary() {
        if (!this.data.length) return null;
        
        switch (this.dataType) {
            case 'Messages':
                return this.generateMessagesSummary();
            case 'Calls':
            case 'RELAY Calls':
                return this.generateCallsSummary();
            case 'Faxes':
                return this.generateFaxesSummary();
            case 'cXML Bins':
            case 'Bins':
                return this.generateBinsSummary();
            default:
                return this.generateGenericSummary();
        }
    }
    
    generateMessagesSummary() {
        const total = this.data.length;
        const statusBreakdown = this.getFieldBreakdown('Status');
        const directionBreakdown = this.getFieldBreakdown('Direction');
        const dateRange = this.getDateRange(['Date Sent']);
        const totalCost = this.calculateTotalCost();
        const avgSegments = this.calculateAverage('Number of Segments');
        
        // Top senders/receivers
        const topSenders = this.getTopValues('From', 5);
        const topReceivers = this.getTopValues('To', 5);
        
        return {
            title: 'Messages Analytics',
            metrics: [
                { label: 'Total Messages', value: total.toLocaleString(), type: 'primary' },
                { label: 'Date Range', value: dateRange, type: 'info' },
                { label: 'Total Cost', value: totalCost, type: 'cost' },
                { label: 'Avg Segments', value: avgSegments, type: 'secondary' }
            ],
            breakdowns: [
                { title: 'Status Breakdown', data: statusBreakdown },
                { title: 'Direction Breakdown', data: directionBreakdown }
            ],
            topLists: [
                { title: 'Top Senders', data: topSenders },
                { title: 'Top Recipients', data: topReceivers }
            ]
        };
    }
    
    generateCallsSummary() {
        const total = this.data.length;
        const statusBreakdown = this.getFieldBreakdown('Status');
        const directionBreakdown = this.getFieldBreakdown('Direction');
        const dateRange = this.getDateRange(['Start Time', 'Created At']);
        const totalCost = this.calculateTotalCost();
        
        // Handle both LaML calls (Duration (seconds)) and RELAY calls (Duration)
        const durationField = this.data[0] && this.data[0]['Duration (seconds)'] !== undefined ? 'Duration (seconds)' : 'Duration';
        const totalDuration = this.calculateTotalDuration(durationField);
        const avgDuration = this.calculateAverage(durationField);
        
        // Top callers/receivers
        const topCallers = this.getTopValues('From', 5);
        const topReceivers = this.getTopValues('To', 5);
        
        return {
            title: 'Calls Analytics',
            metrics: [
                { label: 'Total Calls', value: total.toLocaleString(), type: 'primary' },
                { label: 'Date Range', value: dateRange, type: 'info' },
                { label: 'Total Cost', value: totalCost, type: 'cost' },
                { label: 'Total Duration', value: totalDuration, type: 'duration' },
                { label: 'Avg Duration', value: this.formatDuration(avgDuration), type: 'secondary' }
            ],
            breakdowns: [
                { title: 'Status Breakdown', data: statusBreakdown },
                { title: 'Direction Breakdown', data: directionBreakdown }
            ],
            topLists: [
                { title: 'Top Callers', data: topCallers },
                { title: 'Top Recipients', data: topReceivers }
            ]
        };
    }
    
    generateFaxesSummary() {
        const total = this.data.length;
        const statusBreakdown = this.getFieldBreakdown('Status');
        const directionBreakdown = this.getFieldBreakdown('Direction');
        const dateRange = this.getDateRange(['Date Created']);
        const totalCost = this.calculateTotalCost();
        const totalPages = this.calculateTotal('Number of Pages');
        const avgPages = this.calculateAverage('Number of Pages');
        
        // Top senders/receivers
        const topSenders = this.getTopValues('From', 5);
        const topReceivers = this.getTopValues('To', 5);
        
        return {
            title: 'Faxes Analytics',
            metrics: [
                { label: 'Total Faxes', value: total.toLocaleString(), type: 'primary' },
                { label: 'Date Range', value: dateRange, type: 'info' },
                { label: 'Total Cost', value: totalCost, type: 'cost' },
                { label: 'Total Pages', value: totalPages.toLocaleString(), type: 'secondary' },
                { label: 'Avg Pages', value: avgPages.toFixed(1), type: 'secondary' }
            ],
            breakdowns: [
                { title: 'Status Breakdown', data: statusBreakdown },
                { title: 'Direction Breakdown', data: directionBreakdown }
            ],
            topLists: [
                { title: 'Top Senders', data: topSenders },
                { title: 'Top Recipients', data: topReceivers }
            ]
        };
    }
    
    generateBinsSummary() {
        const total = this.data.length;
        const dateRange = this.getDateRange(['Date Created', 'Date Updated', 'Date Last Accessed']);
        const totalWithContents = this.data.filter(row => row['Contents'] && row['Contents'].trim()).length;
        const avgContentLength = this.calculateAverageContentLength();
        const lastAccessedCount = this.data.filter(row => row['Date Last Accessed'] && row['Date Last Accessed'].trim()).length;
        
        // Top bins by name
        const topBins = this.getTopValues('Name', 10);
        
        return {
            title: 'cXML Bins Analytics',
            metrics: [
                { label: 'Total Bins', value: total.toLocaleString(), type: 'primary' },
                { label: 'Date Range', value: dateRange, type: 'info' },
                { label: 'With Contents', value: totalWithContents.toLocaleString(), type: 'secondary' },
                { label: 'Avg Content Length', value: `${avgContentLength} chars`, type: 'secondary' },
                { label: 'Recently Accessed', value: lastAccessedCount.toLocaleString(), type: 'info' }
            ],
            breakdowns: [],
            topLists: [
                { title: 'Bin Names', data: topBins }
            ]
        };
    }
    
    calculateAverageContentLength() {
        const contentLengths = this.data
            .map(row => (row['Contents'] || '').length)
            .filter(length => length > 0);
        
        if (contentLengths.length === 0) return 0;
        
        const average = contentLengths.reduce((sum, length) => sum + length, 0) / contentLengths.length;
        return Math.round(average);
    }
    
    generateGenericSummary() {
        const total = this.data.length;
        const dateRange = this.getDateRange();
        
        return {
            title: 'Data Analytics',
            metrics: [
                { label: 'Total Records', value: total.toLocaleString(), type: 'primary' },
                { label: 'Date Range', value: dateRange, type: 'info' }
            ],
            breakdowns: [],
            topLists: []
        };
    }
    
    getFieldBreakdown(fieldName) {
        const breakdown = {};
        this.data.forEach(row => {
            const value = row[fieldName] || 'Unknown';
            breakdown[value] = (breakdown[value] || 0) + 1;
        });
        
        return Object.entries(breakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([key, value]) => ({
                label: key,
                count: value,
                percentage: ((value / this.data.length) * 100).toFixed(1)
            }));
    }
    
    getTopValues(fieldName, limit = 5) {
        const counts = {};
        this.data.forEach(row => {
            const value = row[fieldName];
            if (value && value.trim()) {
                counts[value] = (counts[value] || 0) + 1;
            }
        });
        
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([value, count]) => ({ value, count }));
    }
    
    getDateRange(dateFields = ['Date Sent', 'Start Time', 'Date Created', 'Date Updated']) {
        const dates = [];
        
        this.data.forEach(row => {
            for (const field of dateFields) {
                if (row[field]) {
                    const date = new Date(row[field]);
                    if (!isNaN(date)) {
                        dates.push(date);
                        break;
                    }
                }
            }
        });
        
        if (dates.length === 0) return 'No dates available';
        
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        if (minDate.toDateString() === maxDate.toDateString()) {
            return minDate.toLocaleDateString();
        }
        
        return `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
    }
    
    calculateTotalCost() {
        const total = this.data.reduce((sum, row) => {
            const price = parseFloat(row['Price']) || 0;
            return sum + price;
        }, 0);
        
        if (total === 0) return 'N/A';
        
        // Assume USD if no currency info available
        const currency = this.data.find(row => row['Price Unit'])?.['Price Unit'] || 'USD';
        return `$${total.toFixed(4)} ${currency}`;
    }
    
    calculateTotal(fieldName) {
        return this.data.reduce((sum, row) => {
            const value = parseInt(row[fieldName]) || 0;
            return sum + value;
        }, 0);
    }
    
    calculateAverage(fieldName) {
        const values = this.data
            .map(row => parseFloat(row[fieldName]) || 0)
            .filter(value => value > 0);
        
        if (values.length === 0) return 0;
        
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
    
    calculateTotalDuration(durationField = 'Duration (seconds)') {
        const totalSeconds = this.calculateTotal(durationField);
        return this.formatDuration(totalSeconds);
    }
    
    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0s';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
        
        return parts.join(' ');
    }
}