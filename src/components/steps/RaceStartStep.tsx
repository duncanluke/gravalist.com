import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Flag, Clock, Zap, Heart, Star } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { GoAnimation } from './components/GoAnimation';
import { getStartTime, formatCountdown, formatTime, formatTimeWithSeconds } from './utils/raceTimeUtils';
import { useAppState } from '../../hooks/useAppState';

interface RaceStartStepProps {
  onContinue: () => void;
  onFinish?: () => void;
}

export function RaceStartStep({ onContinue, onFinish }: RaceStartStepProps) {
  const { state } = useAppState();
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
  const raceHasStarted = currentTime >= startTime;

  if (showGoAnimation) {
    return <GoAnimation onComplete={onContinue} />;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-4">🏁</div>
        <h2 className="text-xl font-bold">Official Race Start</h2>
        <p className="text-muted-foreground">
          {raceHasStarted
            ? "The race has officially started! Your adventure begins now."
            : "Final countdown to race start. Get ready for the official signal!"
          }
        </p>
      </div>

      <Card className={raceHasStarted ? "border-success bg-success/10" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Flag className="w-5 h-5" />
              <span>Race Clock</span>
            </span>
            {raceHasStarted ? (
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
            {state.currentEvent || 'Race'} - Official Start Time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`text-center p-8 rounded-lg ${raceHasStarted
              ? "bg-success/20 border border-success/30"
              : "bg-primary/10 border border-primary/20"
            }`}>
            {raceHasStarted ? (
              <>
                <div className="text-4xl font-mono font-bold text-success mb-2 animate-pulse">
                  STARTED
                </div>
                <div className="text-sm text-success">
                  Race is officially live!
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl font-mono font-bold text-primary mb-2">
                  {formatCountdown(timeUntilStart)}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Until Official Start
                </div>
                <Button
                  onClick={() => setShowGoAnimation(true)}
                  variant="outline"
                  size="sm"
                  className="border-primary/50 hover:border-primary hover:bg-primary/10"
                >
                  Start Now
                </Button>
              </>
            )}
          </div>

          {!raceHasStarted && timeUntilStart < 60000 && (
            <Alert className="border-warning bg-warning/10">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Final minute!</strong> Take a deep breath. You're about to start an amazing adventure.
              </AlertDescription>
            </Alert>
          )}

          {raceHasStarted && (
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
                  <strong>Your adventure begins!</strong> The race is officially live. Trust yourself, enjoy the journey, and remember - you've got this!
                </AlertDescription>
              </Alert>
            </>
          )}

          {!raceHasStarted && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Almost time!</strong> You've prepared well for this moment. When that countdown hits zero, trust your training and enjoy every moment of your adventure.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="pt-4 space-y-3">
        <Button
          onClick={onContinue}
          className={`w-full ${raceHasStarted ? 'bg-success hover:bg-success/90' : 'bg-primary hover:bg-primary/90'}`}
          size="lg"
        >
          <Flag className="w-5 h-5 mr-2" />
          {raceHasStarted ? 'Start My Adventure!' : 'Start Ride'}
        </Button>

        {onFinish && raceHasStarted && (
          <Button
            onClick={onFinish}
            variant="outline"
            className="w-full"
            size="sm"
          >
            End Ride Here
          </Button>
        )}
      </div>

      {!raceHasStarted && (
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>The page will automatically update when the race starts</p>
            <p className="mt-1">Current time: {formatTimeWithSeconds(currentTime)}</p>
          </div>


        </div>
      )}
    </div>
  );
}