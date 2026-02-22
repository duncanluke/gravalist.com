import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Flag, Clock, Zap, Heart, Star } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { GoAnimation } from './components/GoAnimation';
import { getStartTime, formatCountdown, formatTime, formatTimeWithSeconds } from './utils/rideTimeUtils';

interface RideStartStepProps {
  onContinue: () => void;
  onFinish?: () => void;
}

export function RideStartStep({ onContinue, onFinish }: RideStartStepProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showGoAnimation, setShowGoAnimation] = useState(false);

  const startTime = getStartTime();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      if (now >= startTime && !showGoAnimation) {
        setShowGoAnimation(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, showGoAnimation]);

  const timeUntilStart = startTime.getTime() - currentTime.getTime();
  const rideHasStarted = currentTime >= startTime;

  if (showGoAnimation) {
    return <GoAnimation onComplete={onContinue} />;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card className={rideHasStarted ? "border-success bg-success/10" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Flag className="w-5 h-5" />
              <span>Ride Clock</span>
            </span>
            {rideHasStarted ? (
              <Badge className="bg-success text-success-foreground animate-pulse">
                LIVE
              </Badge>
            ) : (
              <Badge variant="outline" className="font-mono">
                {formatTime(startTime)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Utrecht 500 - Official Start Time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`text-center p-8 rounded-lg relative ${
            rideHasStarted 
              ? "bg-success/20 border border-success/30" 
              : "bg-primary/10 border border-primary/20"
          }`}>
            {rideHasStarted ? (
              <>
                <div className="text-4xl font-mono font-bold text-success mb-2 animate-pulse">
                  STARTED
                </div>
                <div className="text-sm text-success">
                  Ride is officially live!
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl font-mono font-bold text-primary mb-2">
                  {formatCountdown(timeUntilStart)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Until Official Start
                </div>
                {/* Developer Bypass Button */}

              </>
            )}
          </div>

          {!rideHasStarted && timeUntilStart < 60000 && (
            <Alert className="border-warning bg-warning/10">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Final minute!</strong> Take a deep breath. You're about to start an amazing adventure.
              </AlertDescription>
            </Alert>
          )}

          {rideHasStarted && (
            <>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-center space-x-2 p-4 bg-success/20 rounded-lg">
                  <Star className="w-5 h-5 text-success" />
                  <div className="text-center">
                    <div className="font-medium text-success">Official Start</div>
                    <div className="text-sm text-success/80">{formatTime(startTime)}</div>
                  </div>
                </div>
              </div>

              <Alert className="border-success bg-success/10">
                <Heart className="h-4 w-4" />
                <AlertDescription>
                  <strong>Your adventure begins!</strong> The ride is officially live. Trust yourself, enjoy the journey, and remember - you've got this!
                </AlertDescription>
              </Alert>
            </>
          )}

          {!rideHasStarted && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p>
                    <strong>Almost time!</strong> You've prepared well for this moment. When that countdown hits zero, trust your training and enjoy every moment of your adventure.
                  </p>
                  <Button 
                    onClick={onContinue}
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    Start Now (Bypass Timer)
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {rideHasStarted && (
        <div className="pt-4 space-y-3">
          <Button 
            onClick={onContinue}
            className="w-full bg-success hover:bg-success/90"
            size="lg"
          >
            <Flag className="w-5 h-5 mr-2" />
            Start My Adventure!
          </Button>
          

        </div>
      )}


    </div>
  );
}