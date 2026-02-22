import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, Check, Lock, Clock, Circle } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  status: 'done' | 'active' | 'pending' | 'locked';
}

interface AllStepsModalProps {
  open: boolean;
  onClose: () => void;
  currentStep: number;
  onStepSelect: (step: number) => void;
}

export function AllStepsModal({ open, onClose, currentStep, onStepSelect }: AllStepsModalProps) {
  const allSteps: Step[] = [
    { id: 1, title: 'Welcome', description: 'Introduction and sign in', status: 'done' },
    { id: 2, title: 'Choose Ride', description: 'Select your ultra ride', status: 'done' },
    { id: 3, title: 'Pay & Unlock', description: 'Complete payment to continue', status: 'done' },
    { id: 4, title: 'Ride Details', description: 'Read important ride information', status: 'active' },
    { id: 5, title: 'Agreements', description: 'Sign waivers and legal documents', status: 'pending' },
    { id: 6, title: 'Onboarding Form', description: 'Emergency contacts and medical info', status: 'pending' },
    { id: 7, title: 'Racemap Connect', description: 'Set up live tracking', status: 'pending' },
    { id: 8, title: 'Ready Check', description: 'Final preparation checklist', status: 'pending' },
    { id: 9, title: 'Start', description: 'Begin your journey', status: 'locked' },
    { id: 10, title: 'Finish', description: 'Complete your ride', status: 'locked' },
  ];

  const getStatusIcon = (status: string, isActive: boolean) => {
    if (status === 'done') {
      return <Check className="h-4 w-4 text-[#33D17A]" />;
    }
    if (status === 'locked') {
      return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
    if (isActive) {
      return <Circle className="h-4 w-4 text-primary fill-primary" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'done') {
      return <Badge className="bg-[#33D17A] text-black">Done</Badge>;
    }
    if (status === 'locked') {
      return <Badge variant="secondary" className="bg-muted text-muted-foreground">Locked</Badge>;
    }
    if (isActive) {
      return <Badge className="bg-primary text-primary-foreground">Active</Badge>;
    }
    return <Badge variant="outline" className="border-border">Pending</Badge>;
  };

  const handleStepClick = (step: Step) => {
    if (step.status !== 'locked') {
      onStepSelect(step.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-card border-border h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>All Steps</DialogTitle>
          <DialogDescription>
            View and navigate to any step in your onboarding journey. Completed steps are unlocked and accessible.
          </DialogDescription>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" className="absolute right-4 top-4 p-1">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {allSteps.map((step) => {
            const isActive = step.id === currentStep;
            const isClickable = step.status !== 'locked';
            
            return (
              <div 
                key={step.id}
                className={`p-4 rounded-lg border transition-all duration-150 ${
                  isActive 
                    ? 'border-primary bg-primary/5' 
                    : isClickable 
                      ? 'border-border hover:border-primary/50 cursor-pointer' 
                      : 'border-border opacity-60 cursor-not-allowed'
                }`}
                onClick={() => handleStepClick(step)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStatusIcon(step.status, isActive)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm truncate">{step.title}</h3>
                      {getStatusBadge(step.status, isActive)}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-border">
          <Button 
            onClick={onClose} 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}