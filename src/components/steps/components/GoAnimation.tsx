import React, { useState } from 'react';
import { Button } from '../../ui/button';

interface GoAnimationProps {
  onComplete: () => void;
}

export function GoAnimation({ onComplete }: GoAnimationProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  React.useEffect(() => {
    // Show confirmation button after initial animation
    const timer = setTimeout(() => setShowConfirmation(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartAdventure = () => {
    onComplete();
  };

  return (
    <div className="space-y-6 p-6 bg-success/10 rounded-lg border border-success/20">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-primary animate-pulse">
            GO GO GO!
          </h1>
          <p className="text-muted-foreground">
            Your ride is now live
          </p>
        </div>
        
        <div className="flex justify-center space-x-3 py-4">
          <span className="animate-bounce delay-100">⚡</span>
          <span className="animate-bounce delay-200">🚴</span>
          <span className="animate-bounce delay-300">💨</span>
        </div>
      </div>
      
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Good luck, be safe.</p>
        <p className="text-sm text-muted-foreground/80">
          Remember: My tracking, my responsibility.
        </p>
        
        {showConfirmation && (
          <Button 
            onClick={handleStartAdventure}
            className="w-full bg-success hover:bg-success/90"
            size="lg"
          >
            Start My Adventure!
          </Button>
        )}
      </div>
    </div>
  );
}