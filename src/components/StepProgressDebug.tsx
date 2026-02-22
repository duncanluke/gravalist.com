import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { SessionManager } from '../utils/sessionManager';
import { AlertCircle, Check, Clock, Database, Download, Upload, User, Smartphone } from 'lucide-react';

interface StepProgressDebugProps {
  eventName: string;
  eventId: string;
  currentStepId: number;
  isInSpecificEventFlow: boolean;
}

export function StepProgressDebug({ 
  eventName, 
  eventId, 
  currentStepId, 
  isInSpecificEventFlow 
}: StepProgressDebugProps) {
  const { 
    stepProgress, 
    getCurrentStepForEvent, 
    getEventProgress,
    isEventCompleted,
    fetchStepProgress,
    updateStepProgress 
  } = useEvents();
  const { isAuthenticated, user, profile } = useAuth();

  // Get session data
  const session = SessionManager.getSession();
  const sessionData = SessionManager.getAllSessionData();

  // Get database progress
  const databaseProgress = getEventProgress(eventId);
  const databaseCurrentStep = getCurrentStepForEvent(eventId);
  const isCompleted = isEventCompleted(eventId);

  // Get session step for this event
  const sessionStep = (session?.currentEvent === eventName && session?.currentStepId >= 0) 
    ? session.currentStepId 
    : -1;

  const handleRefreshProgress = async () => {
    await fetchStepProgress(eventId);
  };

  const handleTestSaveStep = async () => {
    if (!isAuthenticated) {
      alert('Must be authenticated to test step saving');
      return;
    }

    try {
      const result = await updateStepProgress(eventId, {
        stepId: currentStepId,
        phase: 'before',
        stepData: { 
          title: 'Debug Test Step',
          debugTest: true,
          timestamp: new Date().toISOString()
        },
        isCompleted: false
      });
      
      if (result.success) {
        alert('Test step save successful!');
        await fetchStepProgress(eventId);
      } else {
        alert(`Test step save failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Test step save error: ${error}`);
    }
  };

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader>
        <CardTitle className="text-yellow-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Step Progress Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Info */}
        <div>
          <h4 className="font-medium mb-2">Event Information</h4>
          <div className="text-sm space-y-1">
            <div>Event: <span className="font-mono">{eventName}</span></div>
            <div>Event ID: <span className="font-mono">{eventId}</span></div>
            <div>In Event Flow: <Badge variant={isInSpecificEventFlow ? "default" : "secondary"}>
              {isInSpecificEventFlow ? "Yes" : "No"}
            </Badge></div>
          </div>
        </div>

        <Separator />

        {/* Authentication Status */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Authentication Status
          </h4>
          <div className="text-sm space-y-1">
            <div>Authenticated: <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? "Yes" : "No"}
            </Badge></div>
            {isAuthenticated && (
              <>
                <div>User Email: <span className="font-mono">{user?.email}</span></div>
                <div>Profile ID: <span className="font-mono">{profile?.id || 'N/A'}</span></div>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Session Storage Data */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Session Storage (Local)
          </h4>
          <div className="text-sm space-y-1">
            <div>Session Current Step: <span className="font-mono">{sessionStep}</span></div>
            <div>Session Event: <span className="font-mono">{session?.currentEvent || 'None'}</span></div>
            <div>Session Phase: <span className="font-mono">{session?.currentPhase || 'None'}</span></div>
            <div>Session Steps Data: <span className="font-mono">
              {Object.keys(sessionData).filter(key => key.startsWith('step_')).length} steps
            </span></div>
          </div>
        </div>

        <Separator />

        {/* Database Progress */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database Progress
          </h4>
          <div className="text-sm space-y-1">
            <div>Database Current Step: <span className="font-mono">{databaseCurrentStep}</span></div>
            <div>Total DB Progress Records: <span className="font-mono">{databaseProgress.length}</span></div>
            <div>Event Completed: <Badge variant={isCompleted ? "default" : "secondary"}>
              {isCompleted ? "Yes" : "No"}
            </Badge></div>
          </div>
          
          {databaseProgress.length > 0 && (
            <div className="mt-2">
              <h5 className="font-medium text-xs mb-1">Progress Records:</h5>
              <div className="bg-muted/30 rounded p-2 max-h-32 overflow-y-auto">
                {databaseProgress.map((p, index) => (
                  <div key={index} className="text-xs flex items-center gap-2 py-1">
                    <span className="font-mono">Step {p.step_id}</span>
                    <span className="font-mono">({p.phase})</span>
                    {p.is_completed ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-yellow-500" />
                    )}
                    <span className="text-muted-foreground">
                      {p.completed_at ? new Date(p.completed_at).toLocaleTimeString() : 'In progress'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Current State Comparison */}
        <div>
          <h4 className="font-medium mb-2">State Comparison</h4>
          <div className="text-sm space-y-1">
            <div>App Current Step: <span className="font-mono">{currentStepId}</span></div>
            <div>Session Step: <span className="font-mono">{sessionStep}</span></div>
            <div>Database Step: <span className="font-mono">{databaseCurrentStep}</span></div>
            <div>Highest Step: <span className="font-mono">
              {Math.max(currentStepId, sessionStep, databaseCurrentStep)}
            </span></div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshProgress}
            className="flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Refresh DB Progress
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleTestSaveStep}
            disabled={!isAuthenticated}
            className="flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            Test Save Step
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              console.log('=== FULL DEBUG DUMP ===');
              console.log('Session:', session);
              console.log('Session Data:', sessionData);
              console.log('Database Progress:', databaseProgress);
              console.log('Events State:', stepProgress);
              console.log('Authentication:', { isAuthenticated, user, profile });
            }}
            className="flex items-center gap-1"
          >
            Console Log All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}