/**
 * Background Sync Utility - Handles background data synchronization
 */

import { apiClient } from './supabase/client';
import { CacheManager } from './cacheManager';

export class BackgroundSync {
  private static syncIntervals: Set<NodeJS.Timeout> = new Set();
  private static isSyncing = false;

  // Start background sync for authenticated users
  static startSync() {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    console.log('Starting background sync...');

    // Sync profile every 5 minutes
    const profileInterval = setInterval(() => {
      this.syncProfile();
    }, 5 * 60 * 1000);

    // Sync events every 10 minutes
    const eventsInterval = setInterval(() => {
      this.syncEvents();
    }, 10 * 60 * 1000);

    this.syncIntervals.add(profileInterval);
    this.syncIntervals.add(eventsInterval);
  }

  // Stop background sync
  static stopSync() {
    this.syncIntervals.forEach(interval => clearInterval(interval));
    this.syncIntervals.clear();
    this.isSyncing = false;
    console.log('Stopped background sync');
  }

  // Sync user profile in background
  private static async syncProfile() {
    try {
      // Only sync if profile exists in cache (user is likely authenticated)
      const cachedProfile = CacheManager.getUserProfile();
      if (!cachedProfile) return;

      const { user: profile } = await apiClient.getUserProfile();
      CacheManager.setUserProfile(profile);
      
      // Dispatch custom event to notify components of profile update
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profile }));
    } catch (error) {
      console.log('Background profile sync failed:', error);
    }
  }

  // Sync events in background
  private static async syncEvents() {
    try {
      const { events } = await apiClient.getEvents();
      CacheManager.setEvents(events);
      
      // Dispatch custom event to notify components of events update
      window.dispatchEvent(new CustomEvent('eventsUpdated', { detail: events }));
    } catch (error) {
      console.log('Background events sync failed:', error);
    }
  }

  // Sync step progress for a specific event
  static async syncStepProgress(eventId: string) {
    try {
      const { progress } = await apiClient.getStepProgress(eventId);
      CacheManager.setStepProgress(eventId, progress);
      
      // Dispatch custom event to notify components of progress update
      window.dispatchEvent(new CustomEvent('stepProgressUpdated', { detail: { eventId, progress } }));
    } catch (error) {
      console.log('Step progress sync failed:', error);
    }
  }

  // Force sync all data immediately
  static async forceSyncAll() {
    try {
      await Promise.allSettled([
        this.syncProfile(),
        this.syncEvents()
      ]);
    } catch (error) {
      console.log('Force sync failed:', error);
    }
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    BackgroundSync.stopSync();
  });
}