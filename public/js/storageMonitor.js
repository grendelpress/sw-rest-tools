export class StorageMonitor {
    constructor() {
        this.quotaEstimate = 5 * 1024 * 1024;
        this.safetyMargin = 0.85;
        this.testStorageQuota();
    }

    testStorageQuota() {
        try {
            const testKey = '_storage_test_';
            const testData = new Array(1024).join('a');
            let size = 0;

            try {
                for (let i = 0; i < 10000; i++) {
                    sessionStorage.setItem(testKey + i, testData);
                    size += testData.length;
                }
            } catch (e) {
                this.quotaEstimate = size;
            } finally {
                for (let i = 0; i < 10000; i++) {
                    sessionStorage.removeItem(testKey + i);
                }
            }
        } catch (e) {
            console.warn('Could not test storage quota, using default estimate');
        }
    }

    getStorageSize() {
        let totalSize = 0;
        try {
            for (let key in sessionStorage) {
                if (sessionStorage.hasOwnProperty(key)) {
                    totalSize += sessionStorage[key].length + key.length;
                }
            }
        } catch (e) {
            console.error('Error calculating storage size:', e);
        }
        return totalSize;
    }

    getAvailableSpace() {
        return this.quotaEstimate - this.getStorageSize();
    }

    getUsagePercentage() {
        return (this.getStorageSize() / this.quotaEstimate) * 100;
    }

    estimateDataSize(data) {
        try {
            return JSON.stringify(data).length;
        } catch (e) {
            console.error('Error estimating data size:', e);
            return 0;
        }
    }

    canStoreData(data) {
        const dataSize = this.estimateDataSize(data);
        const availableSpace = this.getAvailableSpace();
        return dataSize < (availableSpace * this.safetyMargin);
    }

    predictStorageNeeded(currentMessages, currentChunkIndex, totalChunks) {
        if (currentChunkIndex === 0 || currentMessages.length === 0) {
            return {
                canComplete: true,
                estimatedSize: 0,
                availableSpace: this.getAvailableSpace(),
                reason: 'Insufficient data to predict'
            };
        }

        const avgMessagesPerChunk = currentMessages.length / (currentChunkIndex + 1);
        const remainingChunks = totalChunks - (currentChunkIndex + 1);
        const estimatedRemainingMessages = Math.ceil(avgMessagesPerChunk * remainingChunks);

        const sampleSize = Math.min(100, currentMessages.length);
        const sampleMessageSize = this.estimateDataSize(currentMessages.slice(0, sampleSize)) / sampleSize;
        const estimatedRemainingSize = estimatedRemainingMessages * sampleMessageSize;

        const currentDataSize = currentMessages.length * sampleMessageSize;
        const totalEstimatedSize = currentDataSize + estimatedRemainingSize;
        const availableSpace = this.getAvailableSpace();

        const canComplete = totalEstimatedSize < (this.quotaEstimate * this.safetyMargin);

        return {
            canComplete,
            estimatedSize: totalEstimatedSize,
            currentSize: currentDataSize,
            estimatedRemainingSize,
            availableSpace,
            usagePercentage: (totalEstimatedSize / this.quotaEstimate) * 100,
            estimatedMessagesRemaining: estimatedRemainingMessages,
            avgMessagesPerChunk,
            reason: canComplete ? 'Sufficient space' : 'Estimated to exceed storage quota'
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    getStorageReport() {
        const currentSize = this.getStorageSize();
        const availableSpace = this.getAvailableSpace();
        const usagePercentage = this.getUsagePercentage();

        return {
            currentSize,
            currentSizeFormatted: this.formatBytes(currentSize),
            availableSpace,
            availableSpaceFormatted: this.formatBytes(availableSpace),
            totalQuota: this.quotaEstimate,
            totalQuotaFormatted: this.formatBytes(this.quotaEstimate),
            usagePercentage: usagePercentage.toFixed(2),
            isNearLimit: usagePercentage > 70,
            isAtLimit: usagePercentage > 85
        };
    }

    attemptSave(key, data) {
        try {
            const dataString = JSON.stringify(data);
            if (!this.canStoreData(data)) {
                return {
                    success: false,
                    error: 'Data too large for available storage',
                    prediction: true
                };
            }
            sessionStorage.setItem(key, dataString);
            return { success: true };
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                return {
                    success: false,
                    error: 'Storage quota exceeded',
                    quotaError: true
                };
            }
            return {
                success: false,
                error: e.message
            };
        }
    }
}
