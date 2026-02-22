/**
 * Cache Manager - Handles localStorage caching with expiration
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class CacheManager {
  private static readonly PREFIX = 'gravalist_cache_';
  
  // Cache durations in milliseconds
  static readonly DURATIONS = {
    USER_PROFILE: 5 * 60 * 1000, // 5 minutes
    EVENTS: 10 * 60 * 1000, // 10 minutes
    STEP_PROGRESS: 2 * 60 * 1000, // 2 minutes
    APP_STATE: 24 * 60 * 60 * 1000, // 24 hours
    AUTH_STATE: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  private static getKey(key: string): string {
    return `${this.PREFIX}${key}`;
  }

  static set<T>(key: string, data: T, duration: number): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + duration
      };
      localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache item:', key, error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) return null;

      const item: CacheItem<T> = JSON.parse(stored);
      
      // Check if expired
      if (Date.now() > item.expiry) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to get cached item:', key, error);
      this.remove(key);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('Failed to remove cached item:', key, error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  static isExpired(key: string): boolean {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) return true;

      const item: CacheItem<any> = JSON.parse(stored);
      return Date.now() > item.expiry;
    } catch (error) {
      return true;
    }
  }

  // Specific cache methods for common use cases
  static setUserProfile(profile: any): void {
    // Store profile with user-specific key based on email
    const userKey = profile?.email ? `user_profile_${profile.email}` : 'user_profile';
    this.set(userKey, profile, this.DURATIONS.USER_PROFILE);
    
    // Also store the current user email for reference
    if (profile?.email) {
      this.set('current_user_email', profile.email, this.DURATIONS.USER_PROFILE);
    }
  }

  static getUserProfile<T>(userEmail?: string): T | null {
    // Get profile for specific user email if provided
    if (userEmail) {
      return this.get<T>(`user_profile_${userEmail}`);
    }
    
    // Try to get current user's profile
    const currentEmail = this.get<string>('current_user_email');
    if (currentEmail) {
      return this.get<T>(`user_profile_${currentEmail}`);
    }
    
    // Fallback to legacy key for backwards compatibility
    return this.get<T>('user_profile');
  }
  
  static clearUserProfile(userEmail?: string): void {
    // Clear specific user's profile
    if (userEmail) {
      this.remove(`user_profile_${userEmail}`);
    }
    
    // Clear current user reference
    this.remove('current_user_email');
    
    // Also clear legacy key
    this.remove('user_profile');
  }

  static setEvents(events: any[]): void {
    this.set('events', events, this.DURATIONS.EVENTS);
  }

  static getEvents<T>(): T[] | null {
    return this.get<T[]>('events');
  }

  static invalidateEvents(): void {
    this.remove('events');
  }

  static setStepProgress(eventId: string, progress: any[]): void {
    this.set(`step_progress_${eventId}`, progress, this.DURATIONS.STEP_PROGRESS);
  }

  static getStepProgress<T>(eventId: string): T[] | null {
    return this.get<T[]>(`step_progress_${eventId}`);
  }

  static setAppState(state: any): void {
    // Only cache important persistent state
    const persistentState = {
      viewMode: state.viewMode,
      currentEvent: state.currentEvent,
      userEmail: state.userEmail,
      currentStepId: state.currentStepId,
      currentPhase: state.currentPhase,
      isInSpecificEventFlow: state.isInSpecificEventFlow
    };
    this.set('app_state', persistentState, this.DURATIONS.APP_STATE);
  }

  static getAppState<T>(): T | null {
    return this.get<T>('app_state');
  }

  static setAuthHint(hasAuth: boolean): void {
    this.set('auth_hint', { hasAuth }, this.DURATIONS.AUTH_STATE);
  }

  static getAuthHint(): { hasAuth: boolean } | null {
    return this.get<{ hasAuth: boolean }>('auth_hint');
  }
}