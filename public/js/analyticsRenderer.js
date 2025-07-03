// Analytics renderer for displaying analytics data in the UI
export class AnalyticsRenderer {
    constructor(containerElement) {
        this.container = containerElement;
    }
    
    render(analyticsData) {
        if (!analyticsData) {
            this.container.innerHTML = '<p>No analytics data available</p>';
            return;
        }
        
        this.container.innerHTML = '';
        
        // Create analytics container
        const analyticsDiv = document.createElement('div');
        analyticsDiv.className = 'analytics-container';
        
        // Title
        const title = document.createElement('h3');
        title.className = 'analytics-title';
        title.textContent = analyticsData.title;
        analyticsDiv.appendChild(title);
        
        // Metrics section
        if (analyticsData.metrics && analyticsData.metrics.length > 0) {
            const metricsSection = this.createMetricsSection(analyticsData.metrics);
            analyticsDiv.appendChild(metricsSection);
        }
        
        // Breakdowns and top lists in a grid
        const gridContainer = document.createElement('div');
        gridContainer.className = 'analytics-grid';
        
        // Breakdowns
        if (analyticsData.breakdowns && analyticsData.breakdowns.length > 0) {
            analyticsData.breakdowns.forEach(breakdown => {
                const breakdownElement = this.createBreakdownSection(breakdown);
                gridContainer.appendChild(breakdownElement);
            });
        }
        
        // Top lists
        if (analyticsData.topLists && analyticsData.topLists.length > 0) {
            analyticsData.topLists.forEach(topList => {
                const topListElement = this.createTopListSection(topList);
                gridContainer.appendChild(topListElement);
            });
        }
        
        if (gridContainer.children.length > 0) {
            analyticsDiv.appendChild(gridContainer);
        }
        
        this.container.appendChild(analyticsDiv);
    }
    
    createMetricsSection(metrics) {
        const section = document.createElement('div');
        section.className = 'analytics-metrics';
        
        metrics.forEach(metric => {
            const metricDiv = document.createElement('div');
            metricDiv.className = `analytics-metric metric-${metric.type}`;
            
            const value = document.createElement('div');
            value.className = 'metric-value';
            value.textContent = metric.value;
            
            const label = document.createElement('div');
            label.className = 'metric-label';
            label.textContent = metric.label;
            
            metricDiv.appendChild(value);
            metricDiv.appendChild(label);
            section.appendChild(metricDiv);
        });
        
        return section;
    }
    
    createBreakdownSection(breakdown) {
        const section = document.createElement('div');
        section.className = 'analytics-breakdown';
        
        const title = document.createElement('h4');
        title.textContent = breakdown.title;
        section.appendChild(title);
        
        if (breakdown.data && breakdown.data.length > 0) {
            const list = document.createElement('div');
            list.className = 'breakdown-list';
            
            breakdown.data.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'breakdown-item';
                
                const labelSpan = document.createElement('span');
                labelSpan.className = 'breakdown-label';
                labelSpan.textContent = item.label;
                
                const countSpan = document.createElement('span');
                countSpan.className = 'breakdown-count';
                countSpan.textContent = `${item.count} (${item.percentage}%)`;
                
                const bar = document.createElement('div');
                bar.className = 'breakdown-bar';
                const fill = document.createElement('div');
                fill.className = 'breakdown-bar-fill';
                fill.style.width = `${item.percentage}%`;
                bar.appendChild(fill);
                
                itemDiv.appendChild(labelSpan);
                itemDiv.appendChild(countSpan);
                itemDiv.appendChild(bar);
                list.appendChild(itemDiv);
            });
            
            section.appendChild(list);
        } else {
            const noData = document.createElement('p');
            noData.textContent = 'No data available';
            noData.className = 'no-data';
            section.appendChild(noData);
        }
        
        return section;
    }
    
    createTopListSection(topList) {
        const section = document.createElement('div');
        section.className = 'analytics-top-list';
        
        const title = document.createElement('h4');
        title.textContent = topList.title;
        section.appendChild(title);
        
        if (topList.data && topList.data.length > 0) {
            const list = document.createElement('div');
            list.className = 'top-list';
            
            topList.data.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'top-list-item';
                
                const rank = document.createElement('span');
                rank.className = 'top-list-rank';
                rank.textContent = `${index + 1}.`;
                
                const value = document.createElement('span');
                value.className = 'top-list-value';
                value.textContent = item.value;
                value.title = item.value; // Full value on hover
                
                const count = document.createElement('span');
                count.className = 'top-list-count';
                count.textContent = item.count;
                
                itemDiv.appendChild(rank);
                itemDiv.appendChild(value);
                itemDiv.appendChild(count);
                list.appendChild(itemDiv);
            });
            
            section.appendChild(list);
        } else {
            const noData = document.createElement('p');
            noData.textContent = 'No data available';
            noData.className = 'no-data';
            section.appendChild(noData);
        }
        
        return section;
    }
    
    hide() {
        this.container.innerHTML = '';
    }
}