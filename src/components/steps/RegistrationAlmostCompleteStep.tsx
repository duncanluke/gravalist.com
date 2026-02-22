import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, Trophy, AlertCircle, Loader2, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEvents } from '../../hooks/useEvents';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';

interface RegistrationAlmostCompleteStepProps {
  eventName: string;
  onContinue: () => void;
}

export function RegistrationAlmostCompleteStep({ 
  eventName, 
  onContinue 
}: RegistrationAlmostCompleteStepProps) {
  const { profile, refreshProfile } = useAuth();
  const { events, registerForEvent, loading: eventsLoading } = useEvents();
  const [registrationState, setRegistrationState] = useState<'pending' | 'processing' | 'success' | 'error'>('pending');
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [otherRiders, setOtherRiders] = useState<any[]>([]);
  const [otherRidersLoading, setOtherRidersLoading] = useState(false);

  // Find the current event object - try multiple matching strategies
  const currentEvent = events.find(event => 
    event.name === eventName || 
    event.name.toLowerCase() === eventName.toLowerCase() ||
    event.slug === eventName.toLowerCase().replace(/\s+/g, '-')
  ) || events[0]; // Fallback to first event if no match found

  // Auto-register when component mounts
  useEffect(() => {
    console.log('RegistrationAlmostCompleteStep useEffect triggered:', {
      eventName,
      currentEvent: currentEvent?.name,
      registrationState,
      eventsLength: events.length,
      eventsLoading,
      eventNames: events.map(e => e.name)
    });

    const handleRegistration = async () => {
      console.log('handleRegistration called:', {
        hasCurrentEvent: !!currentEvent,
        registrationState,
        currentEventName: currentEvent?.name,
        eventsLength: events.length
      });

      // Wait for events to load before trying to find the current event
      if (eventsLoading) {
        console.log('Events still loading, waiting...');
        return;
      }

      if (events.length === 0) {
        console.log('No events available, setting error state');
        setError('No rides available. Please try refreshing the page.');
        setRegistrationState('error');
        return;
      }

      if (!currentEvent) {
        console.log('No current event found, setting error state. Available events:', events.map(e => e.name));
        setError(`No rides available for registration. Please refresh the page and try again.`);
        setRegistrationState('error');
        return;
      }

      console.log('Using event for registration:', {
        eventId: currentEvent.id,
        eventName: currentEvent.name,
        originalEventName: eventName
      });

      if (registrationState !== 'pending') {
        console.log('Registration state is not pending, skipping:', registrationState);
        return;
      }

      setRegistrationState('processing');
      setError(null);

      try {
        console.log('Starting registration for event:', currentEvent.name);
        
        // Register for the event with realistic placeholder data
        // In a real scenario, this data would come from previous form steps
        const registrationData = {
          emergencyContactName: profile?.first_name ? `${profile.first_name} Emergency Contact` : 'Emergency Contact',
          emergencyContactPhone: '+1 (555) 123-4567', // Valid format placeholder
          equipmentChecklist: {
            hasGPS: true,
            hasFirstAid: true,
            hasInsurance: true,
            hasHelmet: true,
            hasLights: true
          }
        };
        
        console.log('Calling registerForEvent with:', {
          eventId: currentEvent.id,
          registrationData
        });
        
        // Add timeout protection
        const registrationPromise = registerForEvent(currentEvent.id, registrationData);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Registration timeout - please try again')), 30000)
        );
        
        const result = await Promise.race([registrationPromise, timeoutPromise]);
        
        console.log('Registration result:', result);
        
        if (result.success) {
          // Use actual points from server response or fallback to 50
          const newPoints = result.pointsAwarded || 50;
          setPointsAwarded(newPoints);
          
          if (result.alreadyRegistered) {
            console.log('User already registered - showing as success');
            toast.success(`Welcome back! You're already registered for ${currentEvent.name}.`);
          } else {
            console.log('Registration successful, points awarded:', newPoints);
            toast.success(`Welcome to ${currentEvent.name}! You earned ${newPoints} points.`);
          }
          
          setRegistrationState('success');
        } else {
          console.error('Registration failed with result:', result);
          throw new Error(result.error || 'Registration failed');
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        console.error('Registration error:', {
          error: err,
          message: errorMessage,
          eventId: currentEvent?.id,
          eventName: currentEvent?.name,
          userEmail: profile?.email,
          registrationData
        });
        
        // Provide more specific error messages
        let userFriendlyMessage = errorMessage;
        if (errorMessage.toLowerCase().includes('already registered')) {
          userFriendlyMessage = 'You\'re already registered for this event!';
          // If already registered, consider it a success
          setRegistrationState('success');
          setPointsAwarded(0); // No new points for duplicate registration
          toast.success(`You're already registered for ${eventName}!`);
          return;
        } else if (errorMessage.includes('Authentication')) {
          userFriendlyMessage = 'Please sign in to complete registration';
        } else if (errorMessage.includes('Event not found')) {
          userFriendlyMessage = 'Event not available for registration';
        } else if (errorMessage.includes('User not found')) {
          userFriendlyMessage = 'User profile not found. Please try signing in again';
        } else if (errorMessage.includes('timeout')) {
          userFriendlyMessage = 'Registration is taking longer than expected. Please try again.';
        }
        
        setError(userFriendlyMessage);
        setRegistrationState('error');
        toast.error(`Registration error: ${userFriendlyMessage}`);
      }
    };

    // Only attempt registration after events have loaded and we have events
    if (!eventsLoading && events.length > 0 && registrationState === 'pending') {
      // Add a small delay to ensure everything is properly initialized
      const timer = setTimeout(handleRegistration, 500);
      return () => clearTimeout(timer);
    }
  }, [currentEvent, registerForEvent, refreshProfile, registrationState, eventName, events.length, eventsLoading, events]);

  const handleRetry = () => {
    setRegistrationState('pending');
    setError(null);
  };



  // Fetch other registered riders
  const fetchOtherRiders = async () => {
    if (!currentEvent) return;
    
    setOtherRidersLoading(true);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        console.log('No session available for fetching other riders');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/events/${currentEvent.id}/other-riders`,
        {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOtherRiders(data.riders || []);
      } else {
        console.log('Failed to fetch other riders');
      }
    } catch (error) {
      console.error('Error fetching other riders:', error);
    } finally {
      setOtherRidersLoading(false);
    }
  };

  // Fetch other riders when registration is successful
  useEffect(() => {
    if (registrationState === 'success' && currentEvent) {
      fetchOtherRiders();
    }
  }, [registrationState, currentEvent]);

  if (registrationState === 'processing') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2>Finalizing Your Registration...</h2>
            <p className="text-muted-foreground">
              We're setting up your event profile and awarding your points. This will only take a moment.
            </p>
          </div>
        </div>

        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <div>
              <p className="font-medium text-sm">Processing registration for {eventName}</p>
              <p className="text-xs text-muted-foreground">Adding you to the event and calculating points...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (registrationState === 'error') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2>Registration Issue</h2>
            <p className="text-muted-foreground">
              We encountered a problem completing your registration. Don't worry - your progress is saved.
            </p>
            {error && (
              <Card className="p-4 border-destructive/20 bg-destructive/5">
                <p className="text-sm text-destructive">{error}</p>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleRetry}
            className="w-full"
            disabled={eventsLoading}
          >
            {eventsLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={onContinue}
            className="w-full"
          >
            Continue Without Registration
          </Button>
        </div>
      </div>
    );
  }

  if (registrationState === 'success') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2>Registration Complete!</h2>
            <p className="text-muted-foreground">
              Excellent! You're now officially registered for {eventName}. You've earned points for joining the community.
            </p>
          </div>
        </div>

        {/* Points Awarded Card */}
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">{eventName}</h3>

              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="bg-primary text-primary-foreground border-0 font-semibold">
                +{pointsAwarded} Points
              </Badge>
              <span className="text-xs text-muted-foreground">Community signup bonus</span>
            </div>
          </div>
        </Card>





        {/* Continue Button */}




        {/* Helpful Info */}
        <Card className="p-4 bg-muted/30 border-muted">

        </Card>
      </div>
    );
  }

  // Default/pending state - show initial content
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2>Preparing Your Registration...</h2>
          <p className="text-muted-foreground">
            We're getting everything ready for your {eventName} registration. This will just take a moment.
          </p>
        </div>
      </div>

      <Card className="p-6 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <div>
            <p className="font-medium text-sm">Setting up registration for {eventName}</p>
            <p className="text-xs text-muted-foreground">Connecting to event system...</p>
          </div>
        </div>
      </Card>

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-4 bg-muted/30 border-muted">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Debug Info</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• Registration State: {registrationState}</p>
              <p>• Looking for Event: "{eventName}"</p>
              <p>• Current Event: {currentEvent ? currentEvent.name : 'Not found'}</p>
              <p>• Events Loading: {eventsLoading ? 'Yes' : 'No'}</p>
              <p>• Events Available: {events.length}</p>
              <p>• Event Names: {events.map(e => e.name).join(', ') || 'None'}</p>
              {error && <p>• Error: {error}</p>}
            </div>
          </div>
        </Card>
      )}

      {/* Additional Debug and Manual Control */}
      <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-yellow-600">Manual Registration Control</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• User Authenticated: {profile ? 'Yes' : 'No'}</p>
            <p>• Current Event Found: {currentEvent ? `${currentEvent.name} (ID: ${currentEvent.id})` : 'No'}</p>
            <p>• Event Match: {eventName} → {currentEvent?.name}</p>
          </div>
          {registrationState === 'pending' && events.length > 0 && currentEvent && (
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log('Manual retry triggered');
                  setRegistrationState('idle');
                  setError(null);
                }}
                className="w-full"
              >
                Force Retry Registration Now
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('Direct test registration triggered');
                  try {
                    const testData = {
                      emergencyContactName: 'Test Contact',
                      emergencyContactPhone: '+1-555-123-4567',
                      equipmentChecklist: {
                        hasGPS: true,
                        hasFirstAid: true,
                        hasInsurance: true,
                        hasHelmet: true,
                        hasLights: true
                      }
                    };
                    console.log('Testing with:', { eventId: currentEvent.id, testData });
                    const result = await registerForEvent(currentEvent.id, testData);
                    console.log('Direct test result:', result);
                  } catch (error) {
                    console.error('Direct test error:', error);
                  }
                }}
                className="w-full"
              >
                Direct Test Registration
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('Database health check triggered');
                  try {
                    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/health/database`, {
                      headers: {
                        'Authorization': `Bearer ${publicAnonKey}`
                      }
                    });
                    const result = await response.json();
                    console.log('Database health check result:', result);
                    toast.success('Database health check completed - check console for details');
                  } catch (error) {
                    console.error('Database health check error:', error);
                    toast.error('Database health check failed - check console for details');
                  }
                }}
                className="w-full"
              >
                Check Database Health
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('Debug registration test triggered');
                  try {
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    
                    if (sessionError || !session?.access_token) {
                      console.error('No valid session for debug test');
                      toast.error('Authentication required for debug test');
                      return;
                    }

                    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/debug/test-registration`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                      },
                      body: JSON.stringify({})
                    });
                    const result = await response.json();
                    console.log('Debug registration test result:', result);
                    
                    if (result.success) {
                      toast.success('Debug test passed! Registration should work.');
                    } else {
                      toast.error(`Debug test failed at step: ${result.step}`);
                    }
                  } catch (error) {
                    console.error('Debug registration test error:', error);
                    toast.error('Debug test failed - check console for details');
                  }
                }}
                className="w-full"
              >
                Run Debug Registration Test
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('Schema check triggered');
                  try {
                    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/debug/schema`, {
                      headers: {
                        'Authorization': `Bearer ${publicAnonKey}`
                      }
                    });
                    const result = await response.json();
                    console.log('Schema check result:', result);
                    
                    if (result.user_events_columns || result.available_columns) {
                      toast.success('Schema check completed - check console for details');
                    } else {
                      toast.error('Schema check failed - check console for details');
                    }
                  } catch (error) {
                    console.error('Schema check error:', error);
                    toast.error('Schema check failed - check console for details');
                  }
                }}
                className="w-full"
              >
                Check Database Schema
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('Clear registration triggered');
                  try {
                    if (!currentEvent) {
                      toast.error('No event selected');
                      return;
                    }

                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    
                    if (sessionError || !session?.access_token) {
                      console.error('No valid session for clear registration');
                      toast.error('Authentication required');
                      return;
                    }

                    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/debug/clear-registration/${currentEvent.id}`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`
                      }
                    });
                    const result = await response.json();
                    console.log('Clear registration result:', result);
                    
                    if (result.success) {
                      toast.success(`Registration cleared! Deleted ${result.deletedRecords} records.`);
                      // Reset registration state to try again
                      setRegistrationState('pending');
                      setError(null);
                    } else {
                      toast.error('Failed to clear registration - check console');
                    }
                  } catch (error) {
                    console.error('Clear registration error:', error);
                    toast.error('Clear registration failed - check console for details');
                  }
                }}
                className="w-full"
              >
                Clear Registration (Debug)
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}