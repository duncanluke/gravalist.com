import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { SessionManager } from '../utils/sessionManager';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';

interface StepProgressDisplayProps {
  currentStepId: number;
  currentPhase: string;
  currentEvent: string;
  isInSpecificEventFlow: boolean;
}

export function StepProgressDisplay({ 
  currentStepId, 
  currentPhase, 
  currentEvent, 
  isInSpecificEventFlow 
}: StepProgressDisplayProps) {
  const { isAuthenticated, user } = useAuth();
  const { events, getCurrentStepForEvent } = useEvents();
  
  // Get session data
  const session = SessionManager.getSession();
  
  // Get database step
  const currentEventObj = events.find(e => e.name === currentEvent);
  const databaseStep = currentEventObj ? getCurrentStepForEvent(currentEventObj.id) : null;
  
  return (
    <Card className="mb-4 bg-muted/50 border-muted">
      <CardContent className="p-0 h-0 overflow-hidden">

      </CardContent>
    </Card>
  );
}