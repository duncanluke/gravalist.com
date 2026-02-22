import { useCallback, useRef } from 'react';
import { AppState } from '../types/app';
import { useEvents } from './useEvents';
import { SessionManager } from '../utils/sessionManager';
import { getPhaseForStep, resolveStartStep } from '../utils/onboardingHelpers';
import { handleOnboardingError, OnboardingErrors } from '../utils/errorHandler';

interface UseSimplifiedEventNavigationProps {
  userEmail: string;
  setState: (updates: Partial<AppState>) => void;
  isAuthenticated: boolean;
}

interface PendingAction {
  type: 'joinEvent';
  eventName: string;
}

/**
 * Simplified event navigation hook with single entry point and clear flow.
 * 
 * This replaces the complex useEventNavigation hook with a simpler API:
 * - Single `joinEvent()` function handles all cases
 * - Database is the source of truth for progress
 * - Clear error handling with user-friendly messages
 * - No complex state flags or dual tracking
 */
export function useSimplifiedEventNavigation({
  userEmail,
  setState,
  isAuthenticated
}: UseSimplifiedEventNavigationProps) {
  const { events, getCurrentStepForEvent, fetchStepProgress } = useEvents();
  
  // Store pending action to resume after authentication
  const pendingAction = useRef<PendingAction | null>(null);

  /**
   * Single entry point to join/resume an event journey.
   * Handles both new users and returning users seamlessly.
   */
  const joinEvent = useCallback(async (eventName: string) => {
    try {
      // Step 1: Validate event exists
      const event = events.find(e => e.name === eventName);
      
      if (!event) {
        throw OnboardingErrors.eventNotFound(eventName);
      }

      // Step 2: Check authentication
      if (!isAuthenticated) {
        // Store the intent to resume after auth
        pendingAction.current = { type: 'joinEvent', eventName };
        
        // Trigger auth modal
        const authEvent = new CustomEvent('requestAuth', {
          detail: { mode: 'signup' }
        });
        window.dispatchEvent(authEvent);
        
        // Store pending email in state for pre-fill
        setState({ 
          currentEvent: eventName,
          pendingAuthEmail: userEmail 
        });
        
        return;
      }

      // Step 3: Fetch latest progress from database (source of truth)
      let dbStep = 0;
      
      try {
        await fetchStepProgress(event.id);
        dbStep = getCurrentStepForEvent(event.id);
      } catch (error) {
        // Non-critical: we can continue with step 0
        console.warn('Could not fetch progress, starting fresh:', error);
      }

      // Step 4: Resolve starting point
      const startStep = resolveStartStep(dbStep);
      const startPhase = getPhaseForStep(startStep);

      // Step 5: Update session cache (write-through)
      SessionManager.updateStepProgress(startStep, startPhase, eventName);

      // Step 6: Navigate to onboarding
      setState({
        currentEvent: eventName,
        currentStepId: startStep,
        currentPhase: startPhase,
        viewMode: 'onboarding'
      });

    } catch (error) {
      handleOnboardingError(error);
    }
  }, [events, isAuthenticated, userEmail, fetchStepProgress, getCurrentStepForEvent, setState]);

  /**
   * Resume pending action after successful authentication.
   * Call this after auth modal closes with success.
   */
  const resumePendingAction = useCallback(async () => {
    if (pendingAction.current && isAuthenticated) {
      const action = pendingAction.current;
      pendingAction.current = null; // Clear pending action
      
      if (action.type === 'joinEvent') {
        await joinEvent(action.eventName);
      }
    }
  }, [isAuthenticated, joinEvent]);

  return {
    joinEvent,
    resumePendingAction
  };
}
