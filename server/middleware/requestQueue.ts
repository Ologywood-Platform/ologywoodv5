/**
 * Graceful Request Queuing System
 * Queues requests when at capacity instead of rejecting them
 * Users never see this - requests just take slightly longer
 */

import { EventEmitter } from 'events';

export interface QueuedRequest {
  id: string;
  userId: string;
  endpoint: string;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
  execute: () => Promise<any>;
}

export class RequestQueue extends EventEmitter {
  private queue: QueuedRequest[] = [];
  private processing: Set<string> = new Set();
  private maxConcurrent: number;
  private maxQueueSize: number;

  constructor(maxConcurrent: number = 100, maxQueueSize: number = 1000) {
    super();
    this.maxConcurrent = maxConcurrent;
    this.maxQueueSize = maxQueueSize;
  }

  /**
   * Add request to queue
   * Returns immediately - processing happens in background
   */
  async enqueue(request: QueuedRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check if queue is full (graceful degradation)
      if (this.queue.length >= this.maxQueueSize) {
        // Instead of rejecting, execute immediately with slight delay
        // This prevents queue overflow while still serving the user
        setTimeout(() => {
          request
            .execute()
            .then(resolve)
            .catch(reject);
        }, 100);
        return;
      }

      // Add to queue with callback
      const queuedReq = {
        ...request,
        resolve,
        reject,
      };

      this.queue.push(queuedReq as any);
      this.process();
    });
  }

  /**
   * Process queue - runs in background
   * Respects tier-based concurrency limits
   */
  private async process(): Promise<void> {
    while (this.queue.length > 0 && this.processing.size < this.maxConcurrent) {
      const request = this.getNextRequest();
      if (!request) break;

      this.processing.add(request.id);

      try {
        const result = await request.execute();
        (request as any).resolve(result);
      } catch (error) {
        (request as any).reject(error);
      } finally {
        this.processing.delete(request.id);
        this.process(); // Continue processing
      }
    }
  }

  /**
   * Get next request based on priority
   */
  private getNextRequest(): QueuedRequest | null {
    // Sort by priority: high > normal > low
    const priorityOrder = { high: 0, normal: 1, low: 2 };

    this.queue.sort(
      (a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        a.timestamp - b.timestamp
    );

    const request = this.queue.shift();
    return request || null;
  }

  /**
   * Get queue stats (for monitoring, not shown to users)
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent,
      utilizationPercent: Math.round(
        (this.processing.size / this.maxConcurrent) * 100
      ),
    };
  }

  /**
   * Get estimated wait time for a request
   * Used internally for prioritization
   */
  getEstimatedWaitTime(priority: 'high' | 'normal' | 'low'): number {
    const avgProcessingTime = 50; // ms
    const requestsAhead = this.queue.filter(
      (r) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[r.priority] <= priorityOrder[priority];
      }
    ).length;

    return requestsAhead * avgProcessingTime;
  }

  /**
   * Clear queue (emergency only)
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Shutdown gracefully
   */
  async shutdown(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.processing.size === 0 && this.queue.length === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
}

/**
 * Global request queue instance
 */
let globalQueue: RequestQueue | null = null;

/**
 * Initialize global queue
 */
export function initializeRequestQueue(
  maxConcurrent?: number,
  maxQueueSize?: number
): RequestQueue {
  if (!globalQueue) {
    globalQueue = new RequestQueue(maxConcurrent, maxQueueSize);
  }
  return globalQueue;
}

/**
 * Get global queue instance
 */
export function getRequestQueue(): RequestQueue {
  if (!globalQueue) {
    globalQueue = new RequestQueue();
  }
  return globalQueue;
}

/**
 * Express middleware for request queuing
 * Transparently queues requests when needed
 */
export function requestQueueMiddleware() {
  const queue = getRequestQueue();

  return async (req: any, res: any, next: any) => {
    const stats = queue.getStats();

    // If under capacity, proceed immediately
    if (stats.processing < stats.maxConcurrent && stats.queueLength === 0) {
      return next();
    }

    // Queue the request
    const requestId = `${Date.now()}-${Math.random()}`;
    const priority = req.user ? 'high' : 'normal'; // Authenticated users get priority

    try {
      await queue.enqueue({
        id: requestId,
        userId: req.user?.id || 'anonymous',
        endpoint: req.path,
        priority,
        timestamp: Date.now(),
        execute: async () => {
          next();
          return new Promise((resolve) => {
            res.on('finish', resolve);
          });
        },
      });
    } catch (error) {
      console.error('[RequestQueue] Error queuing request:', error);
      next();
    }
  };
}

/**
 * TRPC middleware for request queuing
 */
export function requestQueueTrpcMiddleware() {
  const queue = getRequestQueue();

  return async (opts: any) => {
    const { next, ctx } = opts;
    const requestId = `${Date.now()}-${Math.random()}`;
    const priority = ctx.user ? 'high' : 'normal';

    return queue.enqueue({
      id: requestId,
      userId: ctx.user?.id || 'anonymous',
      endpoint: opts.path,
      priority,
      timestamp: Date.now(),
      execute: () => next(),
    });
  };
}
