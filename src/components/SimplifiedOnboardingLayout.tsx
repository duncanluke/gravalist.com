import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface SubStep {
  id: number;
  title: string;
  description: string;
  status: 'done' | 'active' | 'pending' | 'locked';
}

interface Phase {
  id: 'before' | 'starting' | 'after';
  title: string;
  description: string;
  steps: SubStep[];
}

interface Ride {
  name: string;
  location: string;
  date: string;
}

interface SimplifiedOnboardingLayoutProps {
  phases: Phase[];
  currentPhase: 'before' | 'starting' | 'after';
  currentStepId: number;
  currentRide: string;
  availableRides: Ride[];
  onPhaseChange: (phase: 'before' | 'starting' | 'after') => void;
  onStepChange: (stepId: number) => void;
  onRideChange: (rideName: string) => void;
  onBack: () => void;
  onNext: () => void;
  onFinish?: () => void;
  children: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

export function SimplifiedOnboardingLayout({
  phases,
  currentPhase,
  currentStepId,
  currentRide,
  availableRides,
  onPhaseChange,
  onStepChange,
  onRideChange,
  onBack,
  onNext,
  onFinish,
  children,
  primaryAction
}: SimplifiedOnboardingLayoutProps) {
  const currentPhaseData = phases.find(p => p.id === currentPhase);
  const currentStep = currentPhaseData?.steps.find(s => s.id === currentStepId);
  const allSteps = phases.flatMap(p => p.steps);
  const currentIndex = allSteps.findIndex(s => s.id === currentStepId);
  const isFirstStep = currentStepId === 0; // Email step is always first
  const isLastStep = currentIndex === allSteps.length - 1;
  
  // Swipe detection state
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwipeActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipeActive) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - touchStartX.current);
    const deltaY = Math.abs(currentY - touchStartY.current);
    
    // If vertical scroll is more significant, disable swipe
    if (deltaY > deltaX) {
      setIsSwipeActive(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwipeActive) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX.current - touchEndX;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left - go to next step
        if (!isLastStep) {
          onNext();
        }
      } else {
        // Swipe right - go to previous step
        if (!isFirstStep) {
          onBack();
        }
      }
    }
    
    setIsSwipeActive(false);
  };

  return (
    <div className="relative">
      {/* Main Container with Border */}
      <div className="flex flex-col bg-card border border-border/60 rounded-lg overflow-hidden shadow-lg mb-20 min-h-[600px] md:min-h-[700px] h-auto max-h-[calc(100vh-10rem)] md:max-h-[calc(100vh-12rem)]">
        {/* Header - Hide for email collection step */}
        {currentStepId !== 0 && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{currentRide}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {availableRides.map((ride) => (
                    <DropdownMenuItem
                      key={ride.name}
                      onClick={() => onRideChange(ride.name)}
                      className="flex flex-col items-start py-3"
                    >
                      <div className="font-medium">{ride.name}</div>
                      <div className="text-sm text-muted-foreground">{ride.location}</div>
                      <div className="text-xs text-muted-foreground">{ride.date}</div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Current Phase Steps - Hide for email collection step */}
        {currentPhaseData && currentStepId !== 0 && (
          <div className="p-4 border-b border-border">
            <div className="space-y-3">
              {/* Top row: Step title and navigation */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {currentStep && (
                    <div className="text-base font-medium text-foreground">
                      {currentStepId === 5 ? 'Liability, Waiver, Assumption of Risk, and Indemnity Agreement' : currentStepId === 6 ? 'Medical Insurance' : currentStepId === 17 ? 'Your Digital Patch' : currentStep.title}
                    </div>
                  )}
                </div>
                

              </div>
              
              {/* Bottom row: Overall progress bar and phase/step info */}
              <div className="space-y-2">
                {/* Overall Progress Bar */}
                <div className="w-full bg-muted/30 rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${Math.round(((allSteps.findIndex(s => s.id === currentStepId) + 1) / allSteps.length) * 100)}%` 
                    }}
                  />
                </div>
                
                {/* Progress Info */}
                <div className="flex items-center justify-between text-xs">
                  <div className="text-muted-foreground">
                    <span className="font-medium">{currentPhaseData.title}</span>
                    {currentStep && (
                      <span className="ml-1">
                        • {currentStepId === 5 ? 'Liability Agreement' : currentStepId === 6 ? 'Medical Insurance' : currentStepId === 17 ? 'Digital Patch' : currentStep.title}
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    Step {allSteps.findIndex(s => s.id === currentStepId) + 1} of {allSteps.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 relative scrollbar-hide"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {children}
          

        </div>
      </div>
      
      {/* Fixed Bottom Navigation - Hide for email collection step */}
      {currentStepId !== 0 && (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm md:max-w-lg p-4 bg-card border-t border-border z-40 border-l border-r border-border/60 rounded-t-lg shadow-lg" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isFirstStep}
              className="flex items-center gap-2 border-border hover:bg-muted min-w-[80px]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Button
              onClick={() => {
                if (currentStepId === 18) {
                  // Navigate to leaderboard for the Digital Patch step
                  window.dispatchEvent(new CustomEvent('navigateToLeaderboard'));
                } else {
                  (primaryAction?.onClick || onNext)();
                }
              }}
              disabled={primaryAction?.disabled || (isLastStep && currentStepId !== 18)}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {primaryAction?.label || (currentStepId === 18 ? 'See the Leaderboard' : isLastStep ? 'Complete' : 'Continue')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}