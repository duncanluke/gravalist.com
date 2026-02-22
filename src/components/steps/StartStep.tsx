import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, Calendar, Coffee, Heart, Settings, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { getStartTime, getStartButtonTime, formatCountdown, formatTime } from './utils/rideTimeUtils';
import { useAuth } from '../../hooks/useAuth';
import { useEvents } from '../../hooks/useEvents';
import { SessionManager } from '../../utils/sessionManager';
import { toast } from 'sonner@2.0.3';

interface StartStepProps {
  onContinue: () => void;
  onFinish?: () => void;
}

export function StartStep({ onContinue, onFinish }: StartStepProps) {
  const { awardPoints } = useAuth();
  const { events, currentEvent, loading: eventsLoading } = useEvents();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [devOverride, setDevOverride] = useState(false);
  const [startPointsAwarded, setStartPointsAwarded] = useState(false);

  // Get the current event - prioritize currentEvent from useEvents, fallback to session
  const session = SessionManager.getSession();
  const sessionEventName = session?.lastActiveEvent;
  
  // Find the event data - first try currentEvent from useEvents, then by name from session
  const currentEventData = currentEvent || 
    (sessionEventName ? events.find(event => event.name === sessionEventName) : null) ||
    (events.length > 0 ? events[0] : null); // fallback to first event if available
  
  // Format the event date for display
  const formatEventDate = (eventDate: string) => {
    const date = new Date(eventDate);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get display text for the event
  const getEventDisplayText = () => {
    if (eventsLoading) {
      return 'Loading ride details...';
    }
    
    if (!currentEventData) {
      return 'Ride details unavailable';
    }
    
    return `${currentEventData.name} - ${formatEventDate(currentEventData.event_date)}`;
  };

  const startTime = getStartTime();
  const startButtonTime = getStartButtonTime(startTime);

  // Calculate time values
  const timeUntilStart = startTime.getTime() - currentTime.getTime();
  const timeUntilStartButton = startButtonTime.getTime() - currentTime.getTime();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Award points when start time is reached
  useEffect(() => {
    const awardStartPoints = async () => {
      if (timeUntilStart <= 0 && !startPointsAwarded && awardPoints) {
        try {
          const result = await awardPoints('route_start', undefined, 'Started tracking route at official start time');
          if (result.success) {
            setStartPointsAwarded(true);
            toast.success(`🚀 GO GO GO! You earned ${result.pointsAwarded} points for starting your route!`);
          }
        } catch (error) {
          console.error('Error awarding start points:', error);
          // Still mark as awarded to prevent retries
          setStartPointsAwarded(true);
        }
      }
    };

    awardStartPoints();
  }, [timeUntilStart, startPointsAwarded, awardPoints]);
  
  const canStart = currentTime >= startButtonTime || devOverride;
  const rideHasStarted = currentTime >= startTime;

  if (rideHasStarted) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">🏁</div>
          <h2>Time to Ride!</h2>
          <p className="text-muted-foreground">
            The community start time has passed. Click Continue to begin your ride preparations.
          </p>
        </div>

        <Card className="p-6 bg-primary/10 border-primary/20">
          <div className="text-center space-y-4">
            <h3 className="font-semibold text-primary">Ready to Begin</h3>
            <p className="text-sm text-muted-foreground">
              Proceed to take your starting photo and begin your adventure.
            </p>
            <Button onClick={onContinue} className="w-full" size="lg">
              Continue to Start
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Official Start</span>
            </span>
            <Badge variant="outline" className="font-mono">
              {formatTime(startTime)}
            </Badge>
          </CardTitle>
          <CardDescription>
            {getEventDisplayText()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-8 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="text-5xl font-mono font-bold text-primary mb-2">
              {timeUntilStart <= 0 ? "GO GO GO!" : formatCountdown(timeUntilStart)}
            </div>
            <div className="text-sm text-muted-foreground">
              {timeUntilStart <= 0 ? "Community Ride Started!" : "Until Official Start Time"}
            </div>
          </div>

          {/* Start Options */}
          <div className="space-y-3">
            <Button 
              onClick={onContinue} 
              className="w-full"
              size="lg"
              disabled={!canStart && !devOverride}
            >
              {timeUntilStart <= 0 ? "Continue to Start" : canStart ? "Begin Pre-Ride Checklist" : "Waiting for Start Window"}
            </Button>
            
            {timeUntilStart > 0 && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">or</p>
                <Button 
                  onClick={onContinue} 
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Skip Countdown & Start on My Own Time
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comfort Message */}
      <div className="pt-4">
        <div className="p-6 border-2 border-primary rounded-lg bg-primary/5 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium text-primary">Your Ride, Your Schedule</h3>
          </div>
          
          <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
            <p>
              The countdown shows when the community starts together, but you're not required to wait. This is unsupported ultracycling — you take responsibility for your own ride.
            </p>
            
            <p>
              Want to join at the official time? The countdown is here for you. Ready to start now? Skip ahead. There's no organizer to check you in because this ride is entirely yours. Just you, your ride, and the road ahead.
            </p>
          </div>
        </div>



        {/* Hidden Dev Override Controls */}
        <div className="flex justify-end mt-4">
          {!canStart && !devOverride && (
            <button
              onClick={() => setDevOverride(true)}
              className="w-3 h-3 bg-warning/20 hover:bg-warning/40 rounded-full border border-warning/30 opacity-30 hover:opacity-100 transition-opacity"
              title="Dev Override: Enable Final Check Window"
            />
          )}
          
          {devOverride && (
            <button
              onClick={() => setDevOverride(false)}
              className="w-3 h-3 bg-warning hover:bg-warning/80 rounded-full border border-warning opacity-80 hover:opacity-100 transition-opacity"
              title="Dev Override Active: Click to disable"
            />
          )}
        </div>
      </div>
    </div>
  );
}