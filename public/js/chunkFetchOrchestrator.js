import { StorageMonitor } from './storageMonitor.js';

export class ChunkFetchOrchestrator {
    constructor() {
        this.isPaused = false;
        this.isCancelled = false;
        this.isStorageLimitReached = false;
        this.currentChunkIndex = 0;
        this.chunks = [];
        this.allMessages = [];
        this.startTime = null;
        this.completedChunks = 0;
        this.failedChunks = [];
        this.skippedChunks = [];
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
        this.onErrorCallback = null;
        this.onStorageLimitCallback = null;
        this.delayBetweenRequests = 1000;
        this.storageMonitor = new StorageMonitor();
        this.lastCompletedChunkDate = null;
    }

    splitIntoWeeks(startDate, endDate) {
        const weeks = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        let currentStart = new Date(start);

        while (currentStart <= end) {
            let currentEnd = new Date(currentStart);
            currentEnd.setDate(currentEnd.getDate() + 6);

            if (currentEnd > end) {
                currentEnd = new Date(end);
            }

            weeks.push({
                start: this.formatDate(currentStart),
                end: this.formatDate(currentEnd),
                status: 'pending',
                messageCount: 0,
                error: null
            });

            currentStart.setDate(currentStart.getDate() + 7);
        }

        return weeks;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async startFetch(credentials, startDate, endDate) {
        this.reset();
        this.startTime = Date.now();
        this.chunks = this.splitIntoWeeks(startDate, endDate);

        if (this.onProgressCallback) {
            this.onProgressCallback({
                totalChunks: this.chunks.length,
                completedChunks: 0,
                currentChunk: null,
                allMessages: [],
                chunks: this.chunks,
                elapsedTime: 0
            });
        }

        try {
            await this.processChunks(credentials);

            if (!this.isCancelled && !this.isStorageLimitReached) {
                if (this.onCompleteCallback) {
                    this.onCompleteCallback({
                        success: true,
                        messages: this.allMessages,
                        totalMessages: this.allMessages.length,
                        chunks: this.chunks,
                        failedChunks: this.failedChunks,
                        skippedChunks: this.skippedChunks,
                        isStorageLimitReached: this.isStorageLimitReached,
                        lastCompletedDate: this.lastCompletedChunkDate,
                        elapsedTime: Date.now() - this.startTime,
                        storageReport: this.storageMonitor.getStorageReport()
                    });
                }
            }
        } catch (error) {
            if (this.onErrorCallback) {
                this.onErrorCallback({
                    error: error.message,
                    chunks: this.chunks,
                    failedChunks: this.failedChunks
                });
            }
        }
    }

    async processChunks(credentials) {
        for (let i = 0; i < this.chunks.length; i++) {
            if (this.isCancelled) {
                break;
            }

            while (this.isPaused) {
                await this.sleep(500);
                if (this.isCancelled) {
                    return;
                }
            }

            this.currentChunkIndex = i;
            const chunk = this.chunks[i];
            chunk.status = 'in-progress';

            if (this.onProgressCallback) {
                this.onProgressCallback({
                    totalChunks: this.chunks.length,
                    completedChunks: this.completedChunks,
                    currentChunk: chunk,
                    currentChunkIndex: i,
                    allMessages: this.allMessages,
                    chunks: this.chunks,
                    elapsedTime: Date.now() - this.startTime
                });
            }

            try {
                const result = await this.fetchChunk(credentials, chunk.start, chunk.end);

                if (result.success) {
                    chunk.status = 'completed';
                    chunk.messageCount = result.data.length;
                    this.allMessages.push(...result.data);
                    this.completedChunks++;
                    this.lastCompletedChunkDate = chunk.end;

                    const storagePrediction = this.storageMonitor.predictStorageNeeded(
                        this.allMessages,
                        i,
                        this.chunks.length
                    );

                    if (!storagePrediction.canComplete && i < this.chunks.length - 1) {
                        this.isStorageLimitReached = true;

                        for (let j = i + 1; j < this.chunks.length; j++) {
                            this.chunks[j].status = 'skipped';
                            this.chunks[j].error = 'Storage limit reached';
                            this.skippedChunks.push({
                                index: j,
                                chunk: this.chunks[j],
                                reason: 'Storage limit predicted to be exceeded'
                            });
                        }

                        if (this.onStorageLimitCallback) {
                            this.onStorageLimitCallback({
                                storagePrediction,
                                messages: this.allMessages,
                                messagesRetrieved: this.allMessages.length,
                                completedChunks: this.completedChunks,
                                totalChunks: this.chunks.length,
                                lastCompletedDate: this.lastCompletedChunkDate,
                                skippedChunks: this.skippedChunks,
                                chunks: this.chunks,
                                failedChunks: this.failedChunks
                            });
                        }

                        break;
                    }
                } else {
                    throw new Error(result.error || 'Unknown error');
                }
            } catch (error) {
                chunk.status = 'failed';
                chunk.error = error.message;
                this.failedChunks.push({
                    index: i,
                    chunk: chunk,
                    error: error.message
                });
            }

            const storageReport = this.storageMonitor.getStorageReport();

            if (this.onProgressCallback) {
                this.onProgressCallback({
                    totalChunks: this.chunks.length,
                    completedChunks: this.completedChunks,
                    currentChunk: null,
                    currentChunkIndex: i,
                    allMessages: this.allMessages,
                    chunks: this.chunks,
                    elapsedTime: Date.now() - this.startTime,
                    storageReport
                });
            }

            if (this.isStorageLimitReached) {
                break;
            }

            if (i < this.chunks.length - 1) {
                await this.sleep(this.delayBetweenRequests);
            }
        }
    }

    async fetchChunk(credentials, startDate, endDate) {
        let allMessages = [];
        let nextPageUri = null;
        let hasMore = true;

        while (hasMore) {
            const requestBody = {
                projectId: credentials.projectId,
                authToken: credentials.authToken,
                spaceUrl: credentials.spaceUrl,
                startDate: startDate,
                endDate: endDate,
                nextPageUri: nextPageUri
            };

            const response = await fetch('/.netlify/functions/fetch-messages-chunk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const error = await response.json();
                        errorMessage = error.error || errorMessage;
                    } else {
                        const text = await response.text();
                        errorMessage = text || errorMessage;
                    }
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            if (result.success && result.data) {
                allMessages.push(...result.data);
                hasMore = result.hasMore;
                nextPageUri = result.nextPageUri;
            } else {
                hasMore = false;
            }

            if (hasMore) {
                await this.sleep(500);
            }
        }

        return {
            success: true,
            data: allMessages,
            count: allMessages.length
        };
    }

    async retryFailedChunk(credentials, chunkIndex) {
        if (chunkIndex < 0 || chunkIndex >= this.chunks.length) {
            throw new Error('Invalid chunk index');
        }

        const chunk = this.chunks[chunkIndex];
        chunk.status = 'in-progress';
        chunk.error = null;

        if (this.onProgressCallback) {
            this.onProgressCallback({
                totalChunks: this.chunks.length,
                completedChunks: this.completedChunks,
                currentChunk: chunk,
                currentChunkIndex: chunkIndex,
                allMessages: this.allMessages,
                chunks: this.chunks,
                elapsedTime: Date.now() - this.startTime
            });
        }

        try {
            const result = await this.fetchChunk(credentials, chunk.start, chunk.end);

            if (result.success) {
                chunk.status = 'completed';
                chunk.messageCount = result.data.length;
                this.allMessages.push(...result.data);
                this.completedChunks++;

                this.failedChunks = this.failedChunks.filter(f => f.index !== chunkIndex);
                this.lastCompletedChunkDate = chunk.end;

                if (this.onProgressCallback) {
                    this.onProgressCallback({
                        totalChunks: this.chunks.length,
                        completedChunks: this.completedChunks,
                        currentChunk: null,
                        currentChunkIndex: chunkIndex,
                        allMessages: this.allMessages,
                        chunks: this.chunks,
                        elapsedTime: Date.now() - this.startTime
                    });
                }

                return { success: true };
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            chunk.status = 'failed';
            chunk.error = error.message;

            if (this.onProgressCallback) {
                this.onProgressCallback({
                    totalChunks: this.chunks.length,
                    completedChunks: this.completedChunks,
                    currentChunk: null,
                    currentChunkIndex: chunkIndex,
                    allMessages: this.allMessages,
                    chunks: this.chunks,
                    elapsedTime: Date.now() - this.startTime
                });
            }

            return { success: false, error: error.message };
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    cancel() {
        this.isCancelled = true;
        this.clearSessionData();
    }

    reset() {
        this.isPaused = false;
        this.isCancelled = false;
        this.isStorageLimitReached = false;
        this.currentChunkIndex = 0;
        this.chunks = [];
        this.allMessages = [];
        this.startTime = null;
        this.completedChunks = 0;
        this.failedChunks = [];
        this.skippedChunks = [];
        this.lastCompletedChunkDate = null;
    }

    saveProgressToSession() {
        try {
            const minimalProgress = {
                chunkStatus: this.chunks.map(c => ({
                    start: c.start,
                    end: c.end,
                    status: c.status,
                    messageCount: c.messageCount
                })),
                completedChunks: this.completedChunks,
                totalMessages: this.allMessages.length,
                startTime: this.startTime
            };
            sessionStorage.setItem('chunkFetchProgress', JSON.stringify(minimalProgress));
        } catch (e) {
            console.warn('Failed to save progress to session storage:', e);
        }
    }

    clearSessionData() {
        try {
            sessionStorage.removeItem('chunkFetchProgress');
        } catch (e) {
            console.warn('Failed to clear session storage:', e);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    onProgress(callback) {
        this.onProgressCallback = callback;
    }

    onComplete(callback) {
        this.onCompleteCallback = callback;
    }

    onError(callback) {
        this.onErrorCallback = callback;
    }

    onStorageLimit(callback) {
        this.onStorageLimitCallback = callback;
    }

    getEstimatedTimeRemaining() {
        if (!this.startTime || this.completedChunks === 0) {
            return null;
        }

        const elapsed = Date.now() - this.startTime;
        const avgTimePerChunk = elapsed / this.completedChunks;
        const remainingChunks = this.chunks.length - this.completedChunks;
        const estimated = avgTimePerChunk * remainingChunks;

        return Math.round(estimated / 1000);
    }

    formatElapsedTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}
