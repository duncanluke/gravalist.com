import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Brain, Users } from 'lucide-react';


interface WelcomeStepProps {
  eventName: string;
  onContinue: () => void;
  eventId?: string;
}

export function WelcomeStep({ eventName, onContinue, eventId }: WelcomeStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p>
          Stop. Take a breath. You've made it here—which means you're serious about stepping into the adventure of unsupported ultracycling. Well done. Most people don't make it this far.
        </p>
        
        <p>
          This onboarding guide is here to simplify what you need: how to prepare, how to show up, and how to take on the challenge—whether you're riding solo, touring with others, or joining on a shared start date.
        </p>
        
        <p>
          But let's be clear: this is a self-supported ride. There are no aid stations, no route markings, and no safety net. We don't provide support, we don't control the route conditions, and we don't take responsibility for what happens out there. Your safety and your experience are entirely in your hands.
        </p>
        
        <p>
          What we do provide is the opportunity: the route, the framework, and the community of riders who share the same hunger for adventure. Show up, ride, and leave your own story for others to follow.
        </p>
      </div>
    </div>
  );
}