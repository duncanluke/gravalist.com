import { SessionManager } from '../utils/sessionManager';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { getAvailableEvents } from '../utils/onboardingFlow';
import React from 'react';
import { SimplifiedOnboardingLayout } from './SimplifiedOnboardingLayout';
import { StepProgressDisplay } from './StepProgressDisplay';
import { OnboardingStepRenderer } from './OnboardingStepRenderer';
import { createOnboardingFlow, getPrimaryActionForStep } from '../utils/onboardingFlow';
import { Button } from './ui/button';
import type { AppState, ViewMode } from '../App';

interface OnboardingRouterProps {
  state: AppState;
  onViewModeChange: (viewMode: ViewMode) => void;
  setState: (updates: Partial<AppState>) => void;
}

export function OnboardingRouter({
  state,
  onViewModeChange,
  setState
}: OnboardingRouterProps) {
  const { isAuthenticated, updateProfile, refreshProfile } = useAuth();
  const { events, updateStepProgress, getCurrentStepForEvent } = useEvents();
  const availableEvents = getAvailableEvents();
  const phases = createOnboardingFlow(state.currentStepId, state.currentEvent);

  // Track if email has been sent for this session to prevent duplicates
  const emailSentRef = React.useRef<Set<string>>(new Set());

  // AboutYou form state management
  const [aboutYouFormState, setAboutYouFormState] = React.useState<{
    isValid: boolean;
    isSubmitting: boolean;
    handleSubmit: () => void;
  }>({
    isValid: false,
    isSubmitting: false,
    handleSubmit: () => {}
  });

  // Auto-enable specific event flow if user is on step > 0 (continuing journey)
  React.useEffect(() => {
    if (state.currentStepId > 0 && !state.isInSpecificEventFlow && state.currentEvent) {
      console.log('🔄 Auto-enabling specific event flow for continuing user:', {
        currentStepId: state.currentStepId,
        currentEvent: state.currentEvent
      });
      setState({ isInSpecificEventFlow: true });
    }
  }, [state.currentStepId, state.isInSpecificEventFlow, state.currentEvent, setState]);

  // Helper function to get the correct phase for a step
  const getPhaseForStep = (stepId: number): 'before' | 'start' | 'end' => {
    if (stepId <= 9) return 'before';   // Steps 0-9 are "before" (registration)
    if (stepId <= 14) return 'start';   // Steps 10-14 are "start" 
    return 'end';                        // Steps 15-17 are "end"
  };

  // Sync database step progress with local session on component mount
  React.useEffect(() => {
    if (isAuthenticated && state.isInSpecificEventFlow && events.length > 0) {
      const currentEvent = events.find(e => e.name === state.currentEvent);
      if (currentEvent && state.currentEvent) {
        const databaseStep = getCurrentStepForEvent(currentEvent.id);
        const sessionStep = SessionManager.getCurrentStepForEvent(state.currentEvent);
        const currentStateStep = state.currentStepId;
        
        // Removed verbose debug log - step sync is working correctly
        
        // Use the highest step between database and session storage
        const correctStep = Math.max(databaseStep, sessionStep);
        
        if (correctStep > currentStateStep) {
          console.log('🔄 SYNCING to correct step:', {
            from: currentStateStep,
            to: correctStep,
            source: correctStep === databaseStep ? 'database' : 'session'
          });
          
          const correctPhase = getPhaseForStep(correctStep);
          setState({ 
            currentStepId: correctStep,
            currentPhase: correctPhase 
          });
          
          // Update session storage to match if needed
          if (correctStep > sessionStep && state.currentEvent) {
            SessionManager.updateStepProgress(correctStep, correctPhase, state.currentEvent);
          }
        }
      }
    }
  }, [isAuthenticated, state.isInSpecificEventFlow, events, state.currentEvent, getCurrentStepForEvent, setState]);

  // Registration is now handled in RegistrationAlmostCompleteStep (step 8)

  const handleStepChange = async (stepId: number) => {
    const targetPhase = phases.find(p => p.steps.some(s => s.id === stepId));
    const targetStep = targetPhase?.steps.find(s => s.id === stepId);
    
    if (targetStep && targetStep.status !== 'locked') {
      const correctPhase = getPhaseForStep(stepId);
      
      setState({ 
        currentStepId: stepId,
        currentPhase: correctPhase
      });
      
      // Always save session progress for this specific event
      if (state.currentEvent) {
        SessionManager.updateStepProgress(stepId, correctPhase, state.currentEvent);
      }
      
      // Save progress to database if authenticated and in specific event flow
      // Save for all steps after email collection (step 0) to ensure continuity
      if (isAuthenticated && state.isInSpecificEventFlow && stepId > 0) {
        // Try to find event in API events first, then fall back to static events list
        let currentEvent = events.find(e => e.name === state.currentEvent);
        
        if (!currentEvent) {
          // If API events aren't loaded yet, try to find in static events and create a minimal event object
          const staticEvent = availableEvents.find(e => e.name === state.currentEvent);
          if (staticEvent) {
            console.log('🔄 Using static event for progress saving until API events load:', staticEvent.name);
            // We need to get/create a proper event ID from the database
            // For now, let's use a deterministic approach or skip until events are properly loaded
            console.warn('⚠️ API events not loaded yet, will retry when events are available:', {
              requestedEvent: state.currentEvent,
              apiEventsCount: events.length,
              staticEventsCount: availableEvents.length,
              stepId
            });
            return; // Skip saving progress until API events are loaded
          }
        }
        
        if (currentEvent) {
          try {
            await updateStepProgress(currentEvent.id, {
              stepId: stepId,
              phase: correctPhase,
              stepData: { 
                title: targetStep.title,
                timestamp: new Date().toISOString()
              },
              isCompleted: false // Will be marked completed when user moves to next step
            });
          } catch (error) {
            console.error('❌ FAILED to save step progress:', { stepId, error: error.message });
          }
        }
      }
    }
  };

  const handleAboutYouSubmit = async (data: { firstName: string; lastName: string; city: string }) => {
    try {
      // Show loading toast immediately
      const loadingToastId = toast.loading('Updating your profile...');
      
      // CRITICAL FIX: REFRESH the session (not just GET it) to get a NEW valid token
      // getSession() returns cached (possibly expired) token
      // refreshSession() calls the API to get a NEW token
      console.log('🔄 REFRESHING session to get new token...');
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError || !freshSession?.access_token) {
        console.error('❌ Failed to refresh session:', sessionError);
        toast.dismiss(loadingToastId);
        toast.error('Session expired. Please sign in again.');
        return;
      }
      
      console.log('✅ Session refreshed successfully with new token');

      console.log('====================================');
      console.log('📧 FRONTEND - About You Submit (Step 3/18)');
      console.log('====================================');
      console.log('Data:', data);
      console.log('Event Name from state.currentEvent:', state.currentEvent || 'NOT PROVIDED');
      console.log('Is In Specific Event Flow:', state.isInSpecificEventFlow);
      console.log('====================================');

      // CRITICAL: Ensure we always have an event name
      // If currentEvent is not set, try to get it from session
      let eventName = state.currentEvent;
      
      if (!eventName) {
        // Try to get from session
        const session = SessionManager.getSession();
        eventName = session?.currentEvent;
        console.log('⚠️ WARNING: currentEvent not in state, trying session:', eventName);
      }
      
      if (!eventName) {
        console.error('❌ CRITICAL ERROR: No event name available for email!');
        console.error('State:', { currentEvent: state.currentEvent, isInSpecificEventFlow: state.isInSpecificEventFlow });
        console.error('Session:', SessionManager.getSession());
        toast.error('Unable to determine which ride you\'re registering for. Please start over from the ride page.');
        return;
      }

      // Import apiClient directly to use the specific about-you endpoint
      const { apiClient } = await import('../utils/supabase/client');
      
      // Use the specific About You endpoint which updates first_name, last_name, and city in the users table
      // Pass the current event name so the server can send the ride registration email
      const payload = {
        ...data,
        eventName: eventName // ✅ Now we're guaranteed to have an event name
      };
      
      console.log('📤 Sending to API with eventName:', payload);
      console.log('📤 Using fresh access token');
      
      // CRITICAL: Pass the fresh session token to the API call
      await apiClient.updateAboutYou(payload, freshSession.access_token);

      console.log('✅ API call completed successfully');

      // Save step data and proceed to next step
      SessionManager.saveStepData(state.currentStepId, {
        completedAt: new Date().toISOString(),
        stepTitle: 'About You',
        aboutYouData: data
      });
      
      // Refresh the profile to get updated data
      await refreshProfile();
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      toast.success('Profile updated!');
      
      // Auto-proceed to next step
      await handleNext();
    } catch (error) {
      console.error('❌ Error submitting About You information:', error);
      toast.error('Failed to save your information. Please try again.');
    }
  };

  const handleNext = async () => {
    console.log('🔵 handleNext called - Current Step:', state.currentStepId);
    console.log('🔵 isAuthenticated:', isAuthenticated);
    console.log('🔵 currentEvent:', state.currentEvent);
    
    const currentStep = phases.flatMap(p => p.steps).find(s => s.id === state.currentStepId);
    const currentPhase = phases.find(p => p.steps.some(s => s.id === state.currentStepId));
    
    // 🎯 SOFT REGISTRATION - Call at Step 1 (WelcomeStep) to connect user to event
    if (state.currentStepId === 1 && isAuthenticated && state.currentEvent) {
      const currentEvent = events.find(e => e.name === state.currentEvent);
      
      if (currentEvent) {
        // Check if we've already sent the email for this event in this session
        const emailKey = `${currentEvent.id}`;
        if (emailSentRef.current.has(emailKey)) {
          console.log('⏭️ Email already sent for this event, skipping...');
        } else {
          try {
            console.log('====================================');
            console.log('🎯 TRIGGERING SOFT REGISTRATION at Step 1');
            console.log('====================================');
            console.log('Event:', currentEvent.name);
            console.log('Event ID:', currentEvent.id);
            console.log('====================================');
            
            // Refresh session before API call
            console.log('🔄 Refreshing session for soft registration...');
            const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !freshSession?.access_token) {
              console.error('❌ Failed to get session for soft registration:', sessionError);
              toast.error('Session expired. Please refresh the page and try again.');
              return;
            }
            
            const { apiClient } = await import('../utils/supabase/client');
            const result = await apiClient.softRegisterForEvent(currentEvent.id);
            
            console.log('✅ Soft registration result:', result);
            
            if (result.success) {
              toast.success(`Connected to ${currentEvent.name}!`);
              
              // Mark that we're sending the email for this event
              emailSentRef.current.add(emailKey);
              
              // 📧 SEND REGISTRATION EMAIL (fire and forget - don't await)
              console.log('📧 Triggering registration email for:', currentEvent.name);
              (async () => {
                try {
                  const { supabase } = await import('../utils/supabase/client');
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session?.access_token) {
                    console.warn('⚠️ No session token for email');
                    return;
                  }
                  
                  const { projectId } = await import('../utils/supabase/info');
                  const supabaseUrl = `https://${projectId}.supabase.co`;
                  
                  const response = await fetch(
                    `${supabaseUrl}/functions/v1/make-server-91bdaa9f/send-ride-email/${currentEvent.id}`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`
                      }
                    }
                  );
                  
                  const emailResult = await response.json();
                  console.log(emailResult.success ? '✅ Email sent!' : '⚠️ Email failed:', emailResult.error);
                } catch (err) {
                  console.error('⚠️ Email error (non-critical):', err);
                }
              })();
            }
          } catch (error) {
            console.error('❌ Soft registration failed (non-critical):', error);
            // Don't block the flow - this is non-critical
            // User can still continue onboarding
          }
        }
      }
    }
    
    // Save current step completion
    SessionManager.saveStepData(state.currentStepId, {
      completedAt: new Date().toISOString(),
      stepTitle: currentStep?.title
    });

    // Mark current step as completed in database (for all authenticated steps after email collection)
    if (isAuthenticated && state.isInSpecificEventFlow && currentStep && state.currentStepId > 0) {
      const currentEvent = events.find(e => e.name === state.currentEvent);
      const correctPhase = getPhaseForStep(state.currentStepId);
      
      if (currentEvent) {
        try {
          await updateStepProgress(currentEvent.id, {
            stepId: state.currentStepId,
            phase: correctPhase,
            stepData: { 
              title: currentStep.title,
              completedAt: new Date().toISOString()
            },
            isCompleted: true
          });
        } catch (error) {
          console.error('❌ FAILED to mark step as completed:', { stepId: state.currentStepId, error: error.message });
        }
      }
    }

    const allSteps = phases.flatMap(p => p.steps);
    const currentIndex = allSteps.findIndex(s => s.id === state.currentStepId);
    const nextStep = allSteps[currentIndex + 1];
    
    if (nextStep) {
      await handleStepChange(nextStep.id);
    }
  };

  const handleBack = () => {
    const allSteps = phases.flatMap(p => p.steps);
    const currentIndex = allSteps.findIndex(s => s.id === state.currentStepId);
    const prevStep = allSteps[currentIndex - 1];
    
    if (prevStep) {
      handleStepChange(prevStep.id);
    }
  };

  const handleAboutYouFormStateChange = React.useCallback((
    isValid: boolean, 
    isSubmitting: boolean, 
    handleSubmit: () => void
  ) => {
    setAboutYouFormState({ isValid, isSubmitting, handleSubmit });
  }, []);

  // Get primary action for current step, including custom logic for AboutYou step
  const getPrimaryActionForCurrentStep = () => {
    if (state.currentStepId === 2) {
      // AboutYou step - use form's own submit handler
      return {
        label: aboutYouFormState.isSubmitting ? 'Saving...' : 'Continue',
        onClick: aboutYouFormState.handleSubmit,
        disabled: !aboutYouFormState.isValid || aboutYouFormState.isSubmitting
      };
    }
    return getPrimaryActionForStep(state.currentStepId, state.agreementsCompleted);
  };



  // Protection: Only show event selection if user is at step 0 AND not in specific event flow
  // Users on step > 0 are always continuing a journey and should see steps
  if (state.currentStepId === 0 && !state.isInSpecificEventFlow) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 p-8">
        <h2>Oh hello 👋</h2>
        <p className="text-muted-foreground">
          Looks like you wandered in here without picking an adventure first. No worries - happens to the best of us!
        </p>
        <p className="text-muted-foreground">
          You can check out our community rides to see if there are any locations and dates that work for you, or hop over to the leaderboard to see how to earn points and where you currently stand.
        </p>
        <div className="flex flex-col space-y-3 w-full max-w-xs">
          <Button 
            onClick={() => onViewModeChange('500-series')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Browse Community Rides
          </Button>
          <Button 
            onClick={() => onViewModeChange('leaderboard')}
            variant="outline"
            className="border-primary/20 text-foreground hover:bg-primary/10"
          >
            Check the Leaderboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SimplifiedOnboardingLayout
      phases={phases}
      currentPhase={state.currentPhase}
      currentStepId={state.currentStepId}
      currentRide={state.currentEvent}
      availableRides={availableEvents}
      onPhaseChange={(phase) => setState({ currentPhase: phase })}
      onStepChange={handleStepChange}
      onRideChange={(event) => setState({ currentEvent: event })}
      onBack={handleBack}
      onNext={handleNext}
      primaryAction={getPrimaryActionForCurrentStep()}
    >
      <StepProgressDisplay 
        currentStepId={state.currentStepId}
        currentPhase={state.currentPhase}
        currentEvent={state.currentEvent}
        isInSpecificEventFlow={state.isInSpecificEventFlow}
      />
      <OnboardingStepRenderer
        currentStepId={state.currentStepId}
        currentEvent={state.currentEvent}
        userEmail={state.userEmail}
        onNext={handleNext}
        onFinish={handleNext}
        onComplete={async () => {
          // Save final step completion before going to home
          await handleNext();
          onViewModeChange('home');
        }}
        onValidationChange={(completed) => setState({ agreementsCompleted: completed })}
        onSkipToStep={handleStepChange}
        onAboutYouSubmit={handleAboutYouSubmit}
        onAboutYouFormStateChange={handleAboutYouFormStateChange}
      />
    </SimplifiedOnboardingLayout>
  );
}