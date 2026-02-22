import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Heart, MessageSquare, Star, CheckCircle, AlertCircle, Share } from 'lucide-react';
import { SessionManager } from '../../utils/sessionManager';
import { useAuth } from '../../hooks/useAuth';
import { useEvents } from '../../hooks/useEvents';
import { toast } from 'sonner@2.0.3';

interface PostRideReflectionStepProps {
  onContinue: () => void;
  onFinish: () => void;
}

export function PostRideReflectionStep({ onContinue }: PostRideReflectionStepProps) {
  const { isAuthenticated } = useAuth();
  const { updateStepProgress, events } = useEvents();
  const [reflection, setReflection] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [validationError, setValidationError] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation logic
  const minCharacters = 40;
  const isReflectionValid = reflection.trim().length >= minCharacters;
  const isRatingValid = rating > 0;
  const isFormValid = isReflectionValid && isRatingValid;

  const handleReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setReflection(value);
    
    if (showValidation) {
      if (value.trim().length < minCharacters) {
        setValidationError(`Please share more about your personal journey (minimum ${minCharacters} characters)`);
      } else {
        setValidationError('');
      }
    }
  };

  const saveReflectionData = async () => {
    try {
      // Get current event and step info from session
      const session = SessionManager.getSession();
      const currentEvent = session?.currentEvent;
      const currentStepId = session?.currentStep || 16; // PostRideReflectionStep is step 16
      
      // Save step data with rating and reflection
      const stepData = {
        rating: rating,
        reflection: reflection.trim(),
        completedAt: new Date().toISOString(),
        stepTitle: 'Post-Ride Reflection'
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
              phase: 'end',
              stepData: stepData,
              isCompleted: true
            });
            console.log('✅ Post-ride reflection data saved to database:', stepData);
          } catch (error) {
            console.error('❌ Failed to save post-ride reflection to database:', error);
            // Don't block the user from continuing
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving reflection data:', error);
      toast.error('Failed to save your reflection. Please try again.');
      return false;
    }
  };

  const handleSubmit = async () => {
    setShowValidation(true);
    
    if (!isRatingValid) {
      setValidationError('Please rate your experience with us');
      return;
    }
    
    if (!isReflectionValid) {
      setValidationError(`Please share more about your personal journey (minimum ${minCharacters} characters)`);
      return;
    }
    
    setValidationError('');
    setIsSubmitting(true);
    
    try {
      const success = await saveReflectionData();
      if (success) {
        toast.success('Thank you for sharing your reflection!');
        onContinue();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">

        
        <div>
          <h1>Post-Ride Reflection</h1>
          <p className="text-muted-foreground mt-2">
            Your rating and reflection will be shared with the broader community to inspire future riders.
          </p>
        </div>
      </div>

      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-6 space-y-6">
          {/* 5-Star Rating */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">How did we do?</h3>
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoveredRating(starValue)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      starValue <= (hoveredRating || rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground hover:text-primary/60'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && "We'll do better next time"}
                {rating === 2 && "Thanks for the feedback"}
                {rating === 3 && "Good to know, we'll keep improving"}
                {rating === 4 && "Great! We're glad you enjoyed it"}
                {rating === 5 && "Amazing! Thank you for the perfect rating"}
              </p>
            )}
          </div>

          {/* Reflection Text */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Through the challenges you faced during the ultra endurance experience, what was the most surprising discovery you made about yourself?</h3>

            <Textarea
              value={reflection}
              onChange={handleReflectionChange}
              placeholder="Describe your personal breakthroughs, mental resilience moments, physical discoveries, and how this experience changed your perspective on your own capabilities..."
              className={`min-h-24 bg-input-background focus:border-primary transition-colors ${
                showValidation && !isReflectionValid 
                  ? 'border-destructive' 
                  : 'border-muted-foreground/20'
              }`}
              maxLength={500}
            />
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                {showValidation && !isReflectionValid && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    <span>Minimum {minCharacters} characters required</span>
                  </div>
                )}
                {isReflectionValid && (
                  <div className="flex items-center gap-1 text-success">
                    <CheckCircle className="w-3 h-3" />
                    <span>Great reflection!</span>
                  </div>
                )}
              </div>
              <div className={`text-muted-foreground ${
                reflection.length < minCharacters ? 'text-muted-foreground' : 
                reflection.length >= minCharacters ? 'text-success' : 'text-muted-foreground'
              }`}>
                {reflection.length}/500 characters
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Error Display */}
      {validationError && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{validationError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="space-y-3">
        <Button
          onClick={handleSubmit}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={(showValidation && !isFormValid) || isSubmitting}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Your insights help inspire and guide other riders in the community
        </p>
      </div>

    </div>
  );
}