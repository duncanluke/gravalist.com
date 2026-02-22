import { useCallback } from 'react';
import { SessionManager } from '../utils/sessionManager';
import { EventName, ViewMode, AppState } from '../types/app';
import { EVENT_VIEW_MODE_MAP, STEP_IDS } from '../constants/app';
import { useEvents } from './useEvents';

interface UseEventNavigationProps {
  userEmail: string;
  setState: (updates: Partial<AppState>) => void;
  isAuthenticated: boolean;
}

export function useEventNavigation({ userEmail, setState, isAuthenticated }: UseEventNavigationProps) {
  const { events, getCurrentStepForEvent, fetchStepProgress, loading: eventsLoading, fetchEvents } = useEvents();
  
  // Helper function to get view mode for any event
  const getEventViewMode = useCallback((eventName: string): ViewMode => {
    // First check if it's a hardcoded event with a specific view mode
    if (eventName in EVENT_VIEW_MODE_MAP) {
      return EVENT_VIEW_MODE_MAP[eventName as EventName];
    }
    
    // For new events, generate a view mode from the event name
    // e.g., "Clarens 500" → "clarens-500"
    const viewMode = eventName.toLowerCase().replace(/\s+/g, '-') as ViewMode;
    return viewMode;
  }, []);

  const handleEventSelect = useCallback(async (eventNameOrSlug: string) => {
    console.log('🔍 EVENT SELECT - Starting:', { eventNameOrSlug });
    
    // Get the event view mode - works whether event is in database or not
    const viewMode = getEventViewMode(eventNameOrSlug);
    
    // Check if user has progress (only if authenticated)
    let hasProgress = false;
    let resumeStep = STEP_IDS.WELCOME;
    let resumePhase = 'before';
    
    if (userEmail && isAuthenticated) {
      // Try to find event in database for progress check
      const event = events.find(e => {
        const eventSlug = e.slug || e.name.toLowerCase().replace(/\s+/g, '-');
        const inputSlug = eventNameOrSlug.toLowerCase().replace(/\s+/g, '-');
        
        return e.name === eventNameOrSlug || 
               e.name.toLowerCase() === eventNameOrSlug.toLowerCase() || 
               eventSlug === inputSlug || 
               e.slug === eventNameOrSlug;
      });
      
      if (event) {
        // Fetch latest progress
        try {
          await fetchStepProgress(event.id);
        } catch (error) {
          console.warn('Failed to fetch step progress:', error);
        }
        
        // Check database progress
        const dbStep = getCurrentStepForEvent(event.id);
        
        // Check session progress
        const sessionStep = SessionManager.getCurrentStepForEvent(eventNameOrSlug);
        
        // Use the higher step number
        let actualStep = Math.max(dbStep, sessionStep);
        
        // Only consider it as progress if user has gone beyond WELCOME
        if (actualStep >= 1) {
          hasProgress = true;
          resumeStep = actualStep;
          
          // Determine phase from step number
          if (resumeStep >= 15) {
            resumePhase = 'end';
          } else if (resumeStep >= 10) {
            resumePhase = 'start';
          } else {
            resumePhase = 'before';
          }
        }
      }
    }
    
    if (hasProgress) {
      // User has progress, go to onboarding to continue
      console.log('✅ EVENT SELECT - User has progress, going to onboarding');
      setState({
        currentEvent: eventNameOrSlug,
        isInSpecificEventFlow: true,
        currentStepId: resumeStep,
        currentPhase: resumePhase,
        viewMode: 'onboarding'
      });
      // Scroll to top when entering onboarding
      window.scrollTo(0, 0);
    } else {
      // No progress or not authenticated - show event details page
      console.log('✅ EVENT SELECT - Navigating to event page:', viewMode);
      setState({
        currentEvent: eventNameOrSlug,
        isInSpecificEventFlow: false,
        viewMode: viewMode
      });
      // Scroll to top when viewing event details
      window.scrollTo(0, 0);
    }
  }, [userEmail, setState, events, getCurrentStepForEvent, isAuthenticated, fetchStepProgress, getEventViewMode]);

  const handleEnterEvent = useCallback(async (eventName: string) => {
    setState({ 
      currentEvent: eventName,
      isInSpecificEventFlow: true 
    });

    // If user is not authenticated, trigger auth modal
    if (!isAuthenticated) {
      // Dispatch custom event to request authentication
      const authEvent = new CustomEvent('requestAuth', { 
        detail: { mode: 'signup' } 
      });
      window.dispatchEvent(authEvent);
      return;
    }

    // User is authenticated, proceed with onboarding
    if (userEmail) {
      // Initialize variables for resume logic
      let resumeStep = STEP_IDS.WELCOME;
      let resumePhase: 'before' | 'start' | 'end' = 'before';
      
      // Get the current events list (or fetch if needed)
      let currentEvents = events;
      
      // Check if events are loaded
      if (currentEvents.length === 0) {
        console.warn('⚠️ ENTER EVENT - No events loaded yet, trying to fetch events...');
        try {
          const result = await fetchEvents();
          console.log('✅ ENTER EVENT - Events fetch result:', result);
          // If fetch failed or no events, proceed with default
          if (!result.success || !result.events || result.events.length === 0) {
            console.error('❌ ENTER EVENT - No events available after fetch, proceeding with default');
            setState({
              currentStepId: STEP_IDS.WELCOME,
              currentPhase: 'before',
              viewMode: 'onboarding'
            });
            return;
          }
          // Use the freshly fetched events
          currentEvents = result.events;
          console.log('🔄 ENTER EVENT - Using freshly fetched events:', currentEvents.length);
        } catch (error) {
          console.error('❌ ENTER EVENT - Failed to fetch events:', error);
          setState({
            currentStepId: STEP_IDS.WELCOME,
            currentPhase: 'before',
            viewMode: 'onboarding'
          });
          return;
        }
      }
      
      // Find the event and check progress from database
      const event = currentEvents.find(e => 
        e.name.toLowerCase() === eventName.toLowerCase() || 
        e.slug === eventName.toLowerCase()
      );
      
      if (!event) {
        console.log('⚠️ ENTER EVENT - Event not found (events may still be loading)');
        return;
      }
      
      if (event) {
        // First, ensure we have the latest progress data for this event
        try {
          await fetchStepProgress(event.id);
        } catch (error) {
          console.warn('Failed to fetch step progress, using cached/session data:', error);
        }
        
        // Check database progress (now should be fresh)
        const dbStep = getCurrentStepForEvent(event.id);
        
        // Check session progress for this specific event
        const sessionStep = SessionManager.getCurrentStepForEvent(eventName);
        
        // Use the higher step number if both are valid
        let actualStep = Math.max(dbStep, sessionStep);
        
        // For event-specific flows:
        // - If actualStep > 1, user has made progress beyond welcome, resume there
        // - If actualStep = 1, user is on welcome step, resume there  
        // - If actualStep = 0, user hasn't started, begin at welcome step
        
        if (actualStep > 1) {
          resumeStep = actualStep;
          // Determine phase from step number (Registration: 0-9, Start: 10-14, End: 15-17)
          if (resumeStep >= 15) {
            resumePhase = 'end';
          } else if (resumeStep >= 10) {
            resumePhase = 'start';
          } else {
            resumePhase = 'before';
          }
        } else if (actualStep === 1) {
          resumeStep = 1; // WELCOME step
          resumePhase = 'before';
        } else {
          // actualStep is 0 or no progress - start at WELCOME for event-specific flows
          resumeStep = STEP_IDS.WELCOME; // This is step 1
          resumePhase = 'before';
          // Initialize event session for first time
          SessionManager.initializeEventSession(eventName);
        }
        
        console.log('🚀 ENTER EVENT - Setting state:', {
          currentStepId: resumeStep,
          currentPhase: resumePhase,
          viewMode: 'onboarding'
        });
        
        setState({
          currentStepId: resumeStep,
          currentPhase: resumePhase,
          viewMode: 'onboarding'
        });
        
        // Scroll to top when entering event
        window.scrollTo(0, 0);
      }
    }
  }, [userEmail, setState, isAuthenticated, events, getCurrentStepForEvent, fetchStepProgress, fetchEvents]);

  return {
    handleEventSelect,
    handleEnterEvent
  };
}