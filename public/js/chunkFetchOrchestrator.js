export class ChunkFetchOrchestrator {
    constructor() {
        this.isPaused = false;
        this.isCancelled = false;
        this.currentChunkIndex = 0;
        this.chunks = [];
        this.allMessages = [];
        this.startTime = null;
        this.completedChunks = 0;
        this.failedChunks = [];
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
        this.onErrorCallback = null;
        this.delayBetweenRequests = 1000;
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

            if (!this.isCancelled) {
                if (this.onCompleteCallback) {
                    this.onCompleteCallback({
                        success: true,
                        messages: this.allMessages,
                        totalMessages: this.allMessages.length,
                        chunks: this.chunks,
                        failedChunks: this.failedChunks,
                        elapsedTime: Date.now() - this.startTime
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

                    this.saveProgressToSession();
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

            if (this.onProgressCallback) {
                this.onProgressCallback({
                    totalChunks: this.chunks.length,
                    completedChunks: this.completedChunks,
                    currentChunk: null,
                    currentChunkIndex: i,
                    allMessages: this.allMessages,
                    chunks: this.chunks,
                    elapsedTime: Date.now() - this.startTime
                });
            }

            if (i < this.chunks.length - 1) {
                await this.sleep(this.delayBetweenRequests);
            }
        }
    }

    async fetchChunk(credentials, startDate, endDate) {
        const requestBody = {
            projectId: credentials.projectId,
            authToken: credentials.authToken,
            spaceUrl: credentials.spaceUrl,
            startDate: startDate,
            endDate: endDate
        };

        const response = await fetch('/.netlify/functions/fetch-messages-chunk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch chunk');
        }

        return await response.json();
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
                this.saveProgressToSession();

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
        this.currentChunkIndex = 0;
        this.chunks = [];
        this.allMessages = [];
        this.startTime = null;
        this.completedChunks = 0;
        this.failedChunks = [];
    }

    saveProgressToSession() {
        try {
            sessionStorage.setItem('chunkFetchProgress', JSON.stringify({
                chunks: this.chunks,
                allMessages: this.allMessages,
                completedChunks: this.completedChunks,
                failedChunks: this.failedChunks,
                startTime: this.startTime
            }));
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
