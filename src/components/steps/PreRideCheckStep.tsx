import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Heart } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { SessionManager } from '../../utils/sessionManager';
import { useAuth } from '../../hooks/useAuth';
import { useEvents } from '../../hooks/useEvents';
import { toast } from 'sonner@2.0.3';

interface PreRideCheckStepProps {
  onContinue: () => void;
  onFinish?: () => void;
}

export function PreRideCheckStep({ onContinue, onFinish }: PreRideCheckStepProps) {
  const { isAuthenticated } = useAuth();
  const { updateStepProgress, events } = useEvents();
  const [notes, setNotes] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation logic
  const isNotesValid = notes.length >= 40 && notes.length <= 600;
  const canSubmit = isNotesValid;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setShowValidationError(true);
      return;
    }
    
    setIsSubmitting(true);
    setShowValidationError(false);
    
    try {
      // Get current event and step info from session
      const session = SessionManager.getSession();
      const currentEvent = session?.currentEvent;
      const currentStepId = session?.currentStep || 12; // PreRideCheckStep is step 12
      
      // Save step data with notes
      const stepData = {
        notes: notes.trim(),
        completedAt: new Date().toISOString(),
        stepTitle: 'Pre-Ride Check'
      };
      
      // Save to session storage
      SessionManager.saveStepData(currentStepId, stepData);
      
      // Save to database if authenticated and in specific event flow
      if (isAuthenticated && currentEvent) {
        const eventObject = events.find(e => e.name === currentEvent);
        if (eventObject) {
          try {
            await updateStepProgress(eventObject.id, {
              stepId: currentStepId,
              phase: 'start',
              stepData: stepData,
              isCompleted: true
            });
            console.log('✅ Pre-ride check data saved to database:', stepData);
          } catch (error) {
            console.error('❌ Failed to save pre-ride check to database:', error);
            // Don't block the user from continuing
          }
        }
      }
      
      onContinue();
    } catch (error) {
      console.error('Error submitting pre-ride check:', error);
      toast.error('Failed to save your pre-ride check. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Pre-Ride Check</span>
          </CardTitle>
          <CardDescription>
            Take a moment to capture your thoughts before the ride
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notes Section */}
          <div className="space-y-3">
            <label className="block">
              Write your thoughts about the ride ahead *
            </label>
            
            <Textarea
              placeholder="How are you feeling about the ride ahead? Any excitement, nerves, or thoughts you want to capture..."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (showValidationError) setShowValidationError(false);
              }}
              className={`min-h-[120px] border-2 transition-colors ${
                showValidationError && !isNotesValid
                  ? 'border-destructive focus:border-destructive'
                  : 'border-primary/40 focus:border-primary'
              }`}
              required
              minLength={40}
              maxLength={600}
            />
            
            {/* Validation Feedback */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {notes.length < 40 ? (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-muted"></span>
                      <span>Write at least a full thought (40+ characters)</span>
                    </div>
                  ) : notes.length > 600 ? (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <span className="w-2 h-2 rounded-full bg-destructive"></span>
                      <span>Too long - keep it concise</span>
                    </div>
                  ) : notes.length > 280 ? (
                    <div className="flex items-center gap-1 text-sm text-warning">
                      <span className="w-2 h-2 rounded-full bg-warning"></span>
                      <span>Getting lengthy - consider wrapping up</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-success">
                      <span className="w-2 h-2 rounded-full bg-success"></span>
                      <span>Perfect length for reflection</span>
                    </div>
                  )}
                </div>
                <span className={`text-xs ${
                  notes.length < 40 ? 'text-muted-foreground' :
                  notes.length > 600 ? 'text-destructive' :
                  notes.length > 280 ? 'text-warning' :
                  'text-success'
                }`}>
                  {notes.length}/600
                </span>
              </div>
              
              {notes.length > 0 && notes.length < 40 && (
                <p className="text-xs text-muted-foreground">
                  Capture something your future self will recognize as true about this moment.
                </p>
              )}
              
              {showValidationError && !isNotesValid && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertDescription className="text-destructive">
                    {notes.length < 40 
                      ? "Please write at least 40 characters to capture your thoughts properly."
                      : "Please keep your reflection under 600 characters."
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </div>
  );
}