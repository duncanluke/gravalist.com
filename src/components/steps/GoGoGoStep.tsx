import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useAuth } from '../../hooks/useAuth';
import { useEvents } from '../../hooks/useEvents';
import { toast } from 'sonner@2.0.3';

interface GoGoGoStepProps {
  onContinue: () => void;
  currentEvent?: string;
}

export function GoGoGoStep({ onContinue, currentEvent }: GoGoGoStepProps) {
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [awardingPoints, setAwardingPoints] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const { isAuthenticated, awardPoints } = useAuth();
  const { events } = useEvents();

  useEffect(() => {
    // Show the continue button after animation completes
    const timer = setTimeout(() => {
      setShowContinueButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Award points when component mounts (authenticated users only)
  useEffect(() => {
    if (isAuthenticated && !pointsAwarded) {
      console.log('GoGoGoStep: Attempting to award points for authenticated user');
      handleAwardPoints();
    }
  }, [isAuthenticated, pointsAwarded]);

  const handleAwardPoints = async () => {
    console.log('GoGoGoStep: handleAwardPoints called', {
      isAuthenticated,
      pointsAwarded,
      currentEvent,
      eventsCount: events.length
    });

    if (!isAuthenticated) {
      console.log('GoGoGoStep: User not authenticated, skipping points award');
      return;
    }

    if (pointsAwarded) {
      console.log('GoGoGoStep: Points already awarded, skipping');
      return;
    }

    setAwardingPoints(true);

    try {
      // Award points for starting a route
      const currentEventObject = events.find(e => e.name === currentEvent);
      console.log('GoGoGoStep: Found event object:', {
        currentEvent,
        eventId: currentEventObject?.id,
        eventName: currentEventObject?.name
      });

      const result = await awardPoints(
        'route_start',
        currentEventObject?.id || undefined,
        'Started a route adventure'
      );

      console.log('GoGoGoStep: Award points result:', result);

      if (result.success) {
        toast.success(`🎉 You earned ${result.pointsAwarded || 100} points for starting your adventure!`);
        setPointsAwarded(true);
        console.log('GoGoGoStep: Points awarded successfully');
      } else {
        console.warn('GoGoGoStep: Failed to award points:', result.error);
        toast.error('Failed to award points, but you can continue your adventure!');
      }
    } catch (error) {
      console.error('GoGoGoStep: Error awarding points:', error);
      toast.error('Points system temporarily unavailable, but you can continue!');
    } finally {
      setAwardingPoints(false);
    }
  };

  const handleContinue = () => {
    onContinue();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card className="border-success bg-success/10">
        <CardContent className="p-8 text-center space-y-6">
          {/* Main GO GO GO animation */}
          <div className="space-y-4">
            <div className="text-6xl font-bold text-success animate-pulse">
              GO GO GO!
            </div>
            
            <div className="flex justify-center space-x-4 py-4">
              <span className="text-4xl animate-bounce delay-100">⚡</span>
              <span className="text-4xl animate-bounce delay-200">🚴</span>
              <span className="text-4xl animate-bounce delay-300">💨</span>
            </div>
          </div>

          {/* Motivational message */}
          <div className="space-y-3">
            <h2 className="text-success">Your adventure begins now!</h2>
            <p className="text-muted-foreground">
              The ride is officially live. Trust yourself, enjoy the journey, and remember...
            </p>
            <p className="text-sm text-success/80 italic">
              My tracking, my responsibility.
            </p>
          </div>

          {/* Success indicators */}
          {awardingPoints && (
            <div className="text-sm text-success/80">
              Awarding points...
            </div>
          )}

          {pointsAwarded && (
            <div className="text-sm text-success">
              ✅ Points awarded for starting your route!
            </div>
          )}

          {/* Continue button */}
          {showContinueButton && (
            <div className="pt-4 space-y-3">
              {/* Manual award button if points haven't been awarded yet */}
              {isAuthenticated && !pointsAwarded && !awardingPoints && (
                <Button 
                  onClick={handleAwardPoints}
                  variant="outline"
                  className="w-full border-success text-success hover:bg-success/10"
                  size="sm"
                >
                  Claim My Points! 🎉
                </Button>
              )}
              
              <Button 
                onClick={handleContinue}
                className="w-full bg-success hover:bg-success/90 text-success-foreground"
                size="lg"
              >
                Continue My Adventure
              </Button>
            </div>
          )}

          {!showContinueButton && (
            <div className="pt-4">
              <div className="text-sm text-muted-foreground">
                Get ready to ride...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}