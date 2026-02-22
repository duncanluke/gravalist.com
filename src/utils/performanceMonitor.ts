/**
 * Performance Monitor - Tracks app performance metrics
 */

export class PerformanceMonitor {
  private static metrics: Record<string, number> = {};

  // Start timing an operation
  static startTiming(label: string): void {
    this.metrics[`${label}_start`] = performance.now();
  }

  // End timing and log the result
  static endTiming(label: string): number {
    const startTime = this.metrics[`${label}_start`];
    if (!startTime) {
      console.warn(`No start time found for ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    delete this.metrics[`${label}_start`];
    return duration;
  }

  // Log cache hit/miss
  static logCacheHit(resource: string, hit: boolean): void {
    console.log(`📦 Cache ${hit ? 'HIT' : 'MISS'}: ${resource}`);
  }

  // Log network request
  static logNetworkRequest(endpoint: string, cached: boolean = false): void {
    if (cached) {
      console.log(`🚀 Fast load (cached): ${endpoint}`);
    } else {
      console.log(`🌐 Network request: ${endpoint}`);
    }
  }

  // Log app initialization steps
  static logInitStep(step: string): void {
    console.log(`🔄 Init: ${step}`);
  }
}

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).PerformanceMonitor = PerformanceMonitor;
}