/**
 * App Initialization Helper
 * Simplified - no longer needed for app initialization
 */

export class AppInitializer {
  // Kept for compatibility but no longer actively used
  static isInitialized(): boolean {
    return true // Always return true since we don't use forced initialization
  }
  
  static markAsInitialized(): void {
    // No-op - initialization is handled by App component directly
  }
  
  static getInitTime(): number {
    return 0
  }
  
  static reset(): void {
    // No-op
  }
}