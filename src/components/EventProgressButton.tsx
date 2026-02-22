import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { SessionManager } from '../utils/sessionManager';
import { createOnboardingFlow } from '../utils/onboardingFlow';

interface EventProgressButtonProps {
  eventName: string;
  onEnterEvent: () => void;
}

export function EventProgressButton({ eventName, onEnterEvent }: EventProgressButtonProps) {
  const { isAuthenticated } = useAuth();
  const { events, getCurrentStepForEvent } = useEvents();
  
  // Find the event and check progress
  const event = events.find(e => e.name === eventName);
  let hasProgress = false;
  let currentStepId = 1;
  let currentPhase: 'before' | 'start' | 'end' = 'before';
  let progressPercentage = 0;
  let isCompleted = false;
  
  if (event && isAuthenticated) {
    // Check database progress
    const dbStep = getCurrentStepForEvent(event.id);
    
    // Check session progress for this specific event
    const sessionStep = SessionManager.getCurrentStepForEvent(eventName);
    
    // Use the higher step number if both are valid
    const actualStep = Math.max(dbStep, sessionStep);
    
    if (actualStep > 0) {
      hasProgress = true;
      currentStepId = actualStep;
      
      // Determine phase from step number
      if (currentStepId >= 15) {
        currentPhase = 'end';
      } else if (currentStepId >= 10) {
        currentPhase = 'start';
      } else {
        currentPhase = 'before';
      }
      
      // Check if completed (step 18 is the final step in the 19-step flow: 0-18)
      isCompleted = currentStepId >= 18;
      
      // Calculate progress percentage
      const phases = createOnboardingFlow(currentStepId, eventName);
      const allSteps = phases.flatMap(p => p.steps);
      const currentIndex = allSteps.findIndex(s => s.id === currentStepId);
      progressPercentage = Math.round(((currentIndex + 1) / allSteps.length) * 100);
    }
  }
  
  const getButtonLabel = () => {
    if (isCompleted) return 'View Completion';
    
    // Show phase-specific labels for in-progress rides
    if (currentPhase === 'register') return 'Start Registration';
    if (currentPhase === 'start_line') return 'Continue to Start Line';
    if (currentPhase === 'end') return 'Complete Registration';
    
    return 'Continue Registration';
  };
  
  const getProgressText = () => {
    const phases = createOnboardingFlow(currentStepId, eventName);
    const currentPhaseData = phases.find(p => p.id === currentPhase);
    const currentStep = currentPhaseData?.steps.find(s => s.id === currentStepId);
    
    if (!currentPhaseData || !currentStep) return null;
    
    return {
      phase: currentPhaseData.title,
      step: currentStepId === 5 ? 'Liability Agreement' : 
            currentStepId === 6 ? 'Medical Insurance' : 
            currentStepId === 17 ? 'Digital Patch' : 
            currentStep.title,
      percentage: progressPercentage
    };
  };
  
  const progressInfo = hasProgress ? getProgressText() : null;
  
  return (
    <div className="text-center space-y-4">
      {/* Progress display for authenticated users with progress */}
      {hasProgress && progressInfo && (
        <div className="max-w-md mx-auto space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Progress</span>
            <Badge variant="outline" className="text-xs">
              {progressInfo.percentage}% Complete
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted/30 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressInfo.percentage}%` }}
            />
          </div>
          
          {/* Current Phase/Step */}
          <div className="text-center text-sm space-y-1">
            <div className="font-medium text-foreground">{progressInfo.phase}</div>
            <div className="text-muted-foreground">{progressInfo.step}</div>
          </div>
        </div>
      )}
      
      {/* Action Button */}
      <div>
        <Button 
          size="lg" 
          onClick={onEnterEvent}
          className="px-8 py-3 mb-4 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {getButtonLabel()}
        </Button>
        
        {/* Subtitle */}
        <p className="text-sm text-muted-foreground">
          {hasProgress ? 
            "Pick up where you left off in your personalized preparation" :
            "Begin your personalized 3-phase preparation for this epic ride"
          }
        </p>
      </div>
    </div>
  );
}