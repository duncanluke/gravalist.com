import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { HelpCircle, Users, ArrowLeft } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  status: 'done' | 'active' | 'pending' | 'locked';
}

interface OnboardingLayoutProps {
  currentStep: number;
  steps: Step[];
  onStepChange: (step: number) => void;
  onBack: () => void;
  onNext: () => void;
  onHelp: () => void;
  onRidersList: () => void;
  onAllSteps: () => void;
  children: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  showSkip?: boolean;
  onSkip?: () => void;
}

export function OnboardingLayout({
  currentStep,
  steps,
  onStepChange,
  onBack,
  onNext,
  onHelp,
  onRidersList,
  onAllSteps,
  children,
  primaryAction,
  secondaryAction,
  showSkip,
  onSkip
}: OnboardingLayoutProps) {
  const visibleSteps = steps.slice(0, 8); // Show max 8 chips

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col max-w-[390px] mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold text-primary">Gravalist</div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs px-2 py-1">
            Community event—no organisers
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRidersList}
            className="p-2 hover:bg-muted"
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onHelp}
            className="p-2 hover:bg-muted"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Step Navigation */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {visibleSteps.map((step) => (
            <StepChip
              key={step.id}
              step={step}
              isActive={step.id === currentStep}
              onClick={() => onStepChange(step.id)}
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={onAllSteps}
            className="ml-2 whitespace-nowrap text-xs border-border hover:bg-muted"
          >
            All Steps
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground">
          Step {currentStep} of {steps.length}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4">
        <div className="bg-card rounded-lg border border-border p-6 h-full min-h-[400px]">
          {children}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={secondaryAction?.onClick || onBack}
            className="flex items-center gap-2 border-border hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            {secondaryAction?.label || 'Back'}
          </Button>
          
          <Button
            onClick={primaryAction?.onClick || onNext}
            disabled={primaryAction?.disabled}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {primaryAction?.label || 'Next'}
          </Button>
          
          {showSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Skip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepChipProps {
  step: Step;
  isActive: boolean;
  onClick: () => void;
}

function StepChip({ step, isActive, onClick }: StepChipProps) {
  const getChipStyles = () => {
    if (step.status === 'done') {
      return 'bg-[#33D17A] text-black';
    }
    if (isActive) {
      return 'bg-primary text-primary-foreground';
    }
    if (step.status === 'locked') {
      return 'bg-muted text-muted-foreground cursor-not-allowed';
    }
    return 'bg-muted text-foreground hover:bg-muted/80';
  };

  return (
    <button
      onClick={step.status !== 'locked' ? onClick : undefined}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 ${getChipStyles()}`}
      disabled={step.status === 'locked'}
    >
      {step.title}
    </button>
  );
}