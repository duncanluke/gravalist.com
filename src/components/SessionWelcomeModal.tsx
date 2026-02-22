import React from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { CheckCircle, User } from 'lucide-react';

interface SessionWelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  onStartFresh: () => void;
  sessionSummary: {
    email: string;
    currentStep: number;
    currentPhase: string;
    currentEvent: string;
    lastActive: string;
    stepProgress: number;
  };
}

export function SessionWelcomeModal({ 
  open, 
  onClose, 
  onContinue, 
  onStartFresh, 
  sessionSummary 
}: SessionWelcomeModalProps) {
  const getStepTitle = (stepNumber: number) => {
    const stepTitles = {
      0: 'Email Collection',
      1: 'Welcome',
      2: 'Understand Event',
      3: 'Download Route',
      4: 'Equipment Checklist',
      5: 'Accept Terms',
      6: 'Medical Insurance',
      7: 'Block Tracking',
      8: 'Ready to Ride',
      9: 'Start',
      10: 'Starting Photo',
      11: 'Pre-Ride Check',
      12: 'Ride Start',
      13: 'Record Finish',
      14: 'Finish Photo',
      15: 'Post-Ride Reflection',
      16: 'Share Results'
    };
    return stepTitles[stepNumber as keyof typeof stepTitles] || `Step ${stepNumber}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Welcome Back!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{sessionSummary.email}</span>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Progress</span>
              <Badge variant="secondary">{sessionSummary.stepProgress}% Complete</Badge>
            </div>
            
            <div className="space-y-2">
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${sessionSummary.stepProgress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">

                <span className="font-medium">{sessionSummary.currentEvent}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phase:</span>
                <span className="font-medium capitalize">{sessionSummary.currentPhase}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Step:</span>
                <span className="font-medium">{getStepTitle(sessionSummary.currentStep)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button 
              onClick={onContinue}
              className="w-full"
            >
              Continue from Step {sessionSummary.currentStep}
            </Button>
            
            <Button 
              variant="outline"
              onClick={onStartFresh}
              className="w-full"
            >
              Start Fresh
            </Button>
          </div>


        </div>
      </DialogContent>
    </Dialog>
  );
}