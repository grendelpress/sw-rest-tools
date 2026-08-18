// Message analytics calculator for computing key metrics
export class MessageAnalytics {
    constructor(messages) {
        this.messages = messages || [];
    }

    setMessages(messages) {
        this.messages = messages || [];
    }

    calculateMetrics() {
        if (!this.messages.length) {
            return this.getEmptyMetrics();
        }

        const totalMessages = this.messages.length;
        const receivedMessages = this.countReceived();
        const sentMessages = this.countSent();
        const optOuts = this.countOptOuts();
        const deliveryIssues = this.countDeliveryIssues();

        return {
            totalMessages,
            receivedMessages,
            sentMessages,
            optOuts,
            deliveryIssues,
            receivedPercentage: this.calculatePercentage(receivedMessages, totalMessages),
            sentPercentage: this.calculatePercentage(sentMessages, totalMessages),
            optOutRate: this.calculatePercentage(optOuts, totalMessages),
            deliveryFailureRate: this.calculatePercentage(deliveryIssues, totalMessages),
            deliverySuccessRate: this.calculatePercentage(totalMessages - deliveryIssues, totalMessages)
        };
    }

    countReceived() {
        return this.messages.filter(msg =>
            msg.direction === 'inbound' ||
            msg.direction === 'inbound-api' ||
            msg.direction === 'incoming'
        ).length;
    }

    countSent() {
        return this.messages.filter(msg =>
            msg.direction === 'outbound' ||
            msg.direction === 'outbound-api' ||
            msg.direction === 'outgoing'
        ).length;
    }

    countOptOuts() {
        // Count messages that indicate opt-out
        // Common opt-out indicators: STOP, UNSTOP, START keywords
        // Error code 21610 is typical opt-out error
        return this.messages.filter(msg => {
            const body = (msg.body || '').toUpperCase().trim();
            const errorCode = msg.errorCode;
            const status = (msg.status || '').toLowerCase();

            // Check for opt-out keywords in received messages
            const isOptOutKeyword = msg.direction === 'inbound' &&
                (body === 'STOP' || body === 'UNSUBSCRIBE' || body === 'CANCEL' || body === 'END' || body === 'QUIT');

            // Check for opt-out error code
            const isOptOutError = errorCode === 21610 || errorCode === '21610';

            // Check for blocked status
            const isBlocked = status === 'blocked';

            return isOptOutKeyword || isOptOutError || isBlocked;
        }).length;
    }

    countDeliveryIssues() {
        // Count messages with delivery failures or errors
        return this.messages.filter(msg => {
            const status = (msg.status || '').toLowerCase();
            const hasErrorCode = msg.errorCode && msg.errorCode !== null;

            return status === 'failed' ||
                   status === 'undelivered' ||
                   status === 'error' ||
                   (hasErrorCode && status !== 'delivered');
        }).length;
    }

    getStatusBreakdown() {
        const breakdown = {};

        this.messages.forEach(msg => {
            const status = msg.status || 'unknown';
            breakdown[status] = (breakdown[status] || 0) + 1;
        });

        return Object.entries(breakdown)
            .map(([status, count]) => ({
                status,
                count,
                percentage: this.calculatePercentage(count, this.messages.length)
            }))
            .sort((a, b) => b.count - a.count);
    }

    getDirectionBreakdown() {
        const breakdown = {};

        this.messages.forEach(msg => {
            const direction = msg.direction || 'unknown';
            breakdown[direction] = (breakdown[direction] || 0) + 1;
        });

        return Object.entries(breakdown)
            .map(([direction, count]) => ({
                direction,
                count,
                percentage: this.calculatePercentage(count, this.messages.length)
            }))
            .sort((a, b) => b.count - a.count);
    }

    getErrorBreakdown() {
        const errors = this.messages.filter(msg => msg.errorCode);
        const breakdown = {};

        errors.forEach(msg => {
            const errorKey = `${msg.errorCode}: ${msg.errorMessage || 'Unknown error'}`;
            breakdown[errorKey] = (breakdown[errorKey] || 0) + 1;
        });

        return Object.entries(breakdown)
            .map(([error, count]) => ({
                error,
                count,
                percentage: this.calculatePercentage(count, errors.length)
            }))
            .sort((a, b) => b.count - a.count);
    }

    getMessageVolumeByDate() {
        const volumeByDate = {};

        this.messages.forEach(msg => {
            if (msg.dateSent) {
                const date = new Date(msg.dateSent).toLocaleDateString();
                volumeByDate[date] = (volumeByDate[date] || 0) + 1;
            }
        });

        return Object.entries(volumeByDate)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getPeakMessagingDay() {
        const volumeByDate = this.getMessageVolumeByDate();

        if (!volumeByDate.length) return null;

        return volumeByDate.reduce((peak, current) =>
            current.count > peak.count ? current : peak
        );
    }

    getTotalCost() {
        const total = this.messages.reduce((sum, msg) => {
            const price = parseFloat(msg.price) || 0;
            return sum + price;
        }, 0);

        if (total === 0) return null;

        const currency = this.messages.find(msg => msg.priceUnit)?.priceUnit || 'USD';
        return {
            amount: total,
            currency: currency,
            formatted: `$${total.toFixed(4)} ${currency}`
        };
    }

    getAverageSegments() {
        if (!this.messages.length) return 0;

        const totalSegments = this.messages.reduce((sum, msg) =>
            sum + (parseInt(msg.numSegments) || 0), 0
        );

        return (totalSegments / this.messages.length).toFixed(2);
    }

    calculatePercentage(value, total) {
        if (total === 0) return '0.0';
        return ((value / total) * 100).toFixed(1);
    }

    getEmptyMetrics() {
        return {
            totalMessages: 0,
            receivedMessages: 0,
            sentMessages: 0,
            optOuts: 0,
            deliveryIssues: 0,
            receivedPercentage: '0.0',
            sentPercentage: '0.0',
            optOutRate: '0.0',
            deliveryFailureRate: '0.0',
            deliverySuccessRate: '0.0'
        };
    }

    getDateRange() {
        if (!this.messages.length) return null;

        const dates = this.messages
            .filter(msg => msg.dateSent)
            .map(msg => new Date(msg.dateSent));

        if (!dates.length) return null;

        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        return {
            start: minDate.toLocaleDateString(),
            end: maxDate.toLocaleDateString(),
            formatted: minDate.toDateString() === maxDate.toDateString()
                ? minDate.toLocaleDateString()
                : `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`
        };
    }

    getComprehensiveSummary() {
        const metrics = this.calculateMetrics();
        const statusBreakdown = this.getStatusBreakdown();
        const directionBreakdown = this.getDirectionBreakdown();
        const errorBreakdown = this.getErrorBreakdown();
        const volumeByDate = this.getMessageVolumeByDate();
        const peakDay = this.getPeakMessagingDay();
        const totalCost = this.getTotalCost();
        const avgSegments = this.getAverageSegments();
        const dateRange = this.getDateRange();

        return {
            metrics,
            statusBreakdown,
            directionBreakdown,
            errorBreakdown,
            volumeByDate,
            peakDay,
            totalCost,
            avgSegments,
            dateRange
        };
    }
}
