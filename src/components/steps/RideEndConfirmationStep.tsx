import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Trophy, CheckCircle, Heart, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface RideEndConfirmationStepProps {
  onContinue: () => void;
}

export function RideEndConfirmationStep({ onContinue }: RideEndConfirmationStepProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2>Incredible Achievement!</h2>
          <p className="text-muted-foreground">
            You've made it back! What an incredible journey you've just completed. Take a moment to soak this in—not everyone gets to experience what you just did.
          </p>
        </div>
      </div>



      {/* Confirmation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ready to Finish?</CardTitle>
          <CardDescription>
            Click Complete below to officially end your ride and celebrate your achievement
          </CardDescription>
        </CardHeader>
      </Card>



      <div className="text-center">

      </div>
    </div>
  );
}