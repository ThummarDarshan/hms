/**
 * Frontend Performance Utilities
 * Debouncing, throttling, and memoization helpers
 */

/**
 * Debounce - Delays function execution until user stops calling it
 * Useful for: Search, filter, resize events
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
 * Throttle - Limits function execution to once per interval
 * Useful for: Scroll, mousemove events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize - Caches function results based on arguments
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch API calls - Combines multiple API requests into one
 */
export async function batchApiCall(
  urls: string[],
  fetchFn: (url: string) => Promise<any>
): Promise<any[]> {
  // Remove duplicates
  const uniqueUrls = [...new Set(urls)];

  // Fetch all in parallel
  const promises = uniqueUrls.map(url => 
    fetchFn(url).catch(err => ({ error: err, url }))
  );

  return Promise.all(promises);
}

/**
 * Request Queue - Serialize async requests to avoid race conditions
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.process();
      }
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
      }
    }

    this.isProcessing = false;
  }
}

/**
 * React Hook for debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React Hook for throttled callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledRef = React.useRef(throttle(callback, delay));

  React.useEffect(() => {
    throttledRef.current = throttle(callback, delay);
  }, [callback, delay]);

  return throttledRef.current as T;
}
