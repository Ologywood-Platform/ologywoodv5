/**
 * Performance Optimization Utilities
 * Includes lazy loading, image optimization, and caching strategies
 */

/**
 * Lazy load images with Intersection Observer
 */
export function setupLazyLoadImages() {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers that don't support IntersectionObserver
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      (img as HTMLImageElement).src = (img as HTMLImageElement).dataset.src || '';
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px'
  });

  const images = document.querySelectorAll('img[data-src]');
  images.forEach(img => imageObserver.observe(img));
}

/**
 * Cache API responses with configurable TTL
 */
export class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern: string) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Debounce function for optimizing frequent events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for rate-limiting events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Prefetch resources for faster loading
 */
export function prefetchResource(url: string, type: 'script' | 'style' | 'image' = 'script') {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = type;
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' = 'script') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = type;
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Measure performance metrics
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return null;
    }

    const duration = (end || performance.now()) - start;
    
    return duration;
  }

  getMetrics() {
    if (!window.performance.getEntriesByType) return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
      domComplete: navigation.domComplete - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart
    };
  }

  logMetrics() {
    const metrics = this.getMetrics();
    if (metrics) {
    }
  }
}

/**
 * Optimize bundle by lazy loading routes
 */
export function lazyLoadRoute(importFunc: () => Promise<any>) {
  return importFunc;
}

/**
 * Service Worker registration for offline support
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

/**
 * Network information monitoring
 */
export function monitorNetworkStatus() {
  if (!('connection' in navigator)) {
    
    return;
  }

  const connection = (navigator as any).connection;

  const logNetworkStatus = () => {
  };

  connection.addEventListener('change', logNetworkStatus);
  logNetworkStatus();
}

/**
 * Compress and optimize images
 */
export function optimizeImageUrl(url: string, width: number, quality: number = 80): string {
  // This would typically use a CDN like Cloudinary or Imgix
  // For now, return the original URL
  return url;
}

/**
 * Batch API requests to reduce network calls
 */
export class RequestBatcher {
  private queue: Array<{ key: string; promise: Promise<any> }> = [];
  private batchSize: number;
  private batchDelay: number;
  private timeout: NodeJS.Timeout | null = null;

  constructor(batchSize: number = 10, batchDelayMs: number = 50) {
    this.batchSize = batchSize;
    this.batchDelay = batchDelayMs;
  }

  add<T>(key: string, request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        key,
        promise: request().then(resolve).catch(reject)
      });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  private flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    // Process batched requests
    this.queue = [];
  }
}

export const performanceCache = new ResponseCache(300); // 5 minute cache
export const performanceMonitor = new PerformanceMonitor();
