import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar, MapPin, UserMinus, RefreshCw, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../utils/supabase/client';
import { WithdrawEventModal } from './modals/WithdrawEventModal';
import { toast } from 'sonner@2.0.3';
import { useEvents } from '../hooks/useEvents';
import { SessionManager } from '../utils/sessionManager';
import { supabase } from '../utils/supabase/client';

interface Registration {
  id: string;
  event_id: string;
  registration_status: 'registered' | 'withdrawn' | 'completed' | 'in_progress';
  registered_at: string;
  event: {
    id: string;
    name: string;
    event_date?: string;
    location?: string;
    distance_km?: number;
  };
}

interface MyRegistrationsCardProps {
  onEnterEvent?: (eventName: string) => void;
}

export function MyRegistrationsCard({ onEnterEvent }: MyRegistrationsCardProps) {
  const { isAuthenticated, user, profile, session, loading: authLoading } = useAuth();
  const { getCurrentStepForEvent, isEventCompleted } = useEvents();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; name: string } | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const fetchRegistrations = async () => {
    // Wait for auth to finish loading first
    if (authLoading) {
      console.log('MyRegistrationsCard - Auth still loading, waiting...');
      return;
    }

    // Comprehensive checks before attempting fetch
    if (!isAuthenticated) {
      console.log('MyRegistrationsCard - Not authenticated, skipping fetch');
      setLoading(false);
      return;
    }

    if (!user?.email) {
      console.log('MyRegistrationsCard - No user email, skipping fetch');
      setLoading(false);
      return;
    }

    if (!session) {
      console.log('MyRegistrationsCard - No session, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      // Get fresh session to ensure token is valid
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      // Handle refresh token errors gracefully
      if (sessionError) {
        // Check if it's a refresh token error
        if (sessionError.message?.includes('Refresh Token') || sessionError.message?.includes('refresh_token')) {
          console.log('MyRegistrationsCard - Refresh token invalid/expired, user needs to re-authenticate');
          setLoading(false);
          setRegistrations([]);
          return;
        }
        
        console.log('MyRegistrationsCard - Could not get fresh session:', sessionError?.message);
        setLoading(false);
        return;
      }
      
      if (!freshSession?.access_token) {
        console.log('MyRegistrationsCard - No access token in fresh session');
        setLoading(false);
        return;
      }

      const accessToken = freshSession.access_token;

      console.log('MyRegistrationsCard - Fetching registrations for user:', user.email);
      console.log('MyRegistrationsCard - Using fresh session:', {
        hasSession: !!freshSession,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken.length,
        userEmail: freshSession.user?.email,
        userId: freshSession.user?.id,
        tokenPreview: accessToken.substring(0, 20) + '...'
      });
      
      // Decode the JWT to see what's in it
      try {
        const tokenParts = accessToken.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('MyRegistrationsCard - JWT Payload:', {
          email: payload.email,
          sub: payload.sub,
          exp: new Date(payload.exp * 1000).toISOString()
        });
      } catch (e) {
        console.error('MyRegistrationsCard - Could not decode JWT:', e);
      }
      
      // Verify the token belongs to the correct user
      if (freshSession.user?.email !== user.email) {
        console.error('MyRegistrationsCard - TOKEN MISMATCH!', {
          expectedEmail: user.email,
          tokenEmail: freshSession.user?.email,
          message: 'The session token belongs to a different user! You need to log out and log back in.'
        });
        toast.error(`Session mismatch detected. Please log out and log back in as ${user.email}`);
        setLoading(false);
        return;
      }
      
      const data = await apiClient.getUserRegistrations(accessToken);
      console.log('MyRegistrationsCard - Registrations fetched successfully:', data.length, 'registrations');
      console.log('MyRegistrationsCard - Full registration data:', JSON.stringify(data, null, 2));
      
      // Debug: Log each registration's structure
      data.forEach((reg, index) => {
        console.log(`MyRegistrationsCard - Registration ${index}:`, {
          id: reg.id,
          event_id: reg.event_id,
          status: reg.registration_status,
          hasEventObject: !!reg.event,
          eventData: reg.event
        });
      });
      
      // CRITICAL FIX: The API returns 'events' (plural) but our interface expects 'event' (singular)
      // Normalize the data structure
      const normalizedData = data.map((reg: any) => ({
        ...reg,
        event: reg.events || reg.event // Use 'events' if available, fallback to 'event'
      }));
      
      setRegistrations(normalizedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load registrations';
      
      // Silently handle authentication errors - these are expected during login/session establishment
      // Check this FIRST before any logging
      if (errorMessage.includes('Authentication') || 
          errorMessage.includes('sign in') || 
          errorMessage.includes('401') || 
          errorMessage.includes('Invalid or expired token') ||
          errorMessage.includes('Refresh Token') ||
          errorMessage.includes('refresh_token')) {
        console.log('MyRegistrationsCard - Authentication not ready yet, will retry when session is established');
        setRegistrations([]);
        setLoading(false);
        return;
      }
      
      // Only log non-authentication errors as actual errors
      console.error('MyRegistrationsCard - Error fetching registrations:', error);
      console.error('MyRegistrationsCard - Full error details:', {
        error,
        errorType: typeof error,
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Set empty registrations on error
      setRegistrations([]);
      
      // Only show non-authentication errors
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Early return if not authenticated - don't even try to fetch
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    // Wait for auth to finish loading
    if (authLoading) {
      console.log('MyRegistrationsCard - Auth is loading, waiting before fetch');
      return;
    }

    // Only fetch if we have all required authentication pieces
    if (user?.email && session?.access_token) {
      // Validate token format before even attempting to fetch
      const tokenParts = session.access_token.split('.');
      if (tokenParts.length !== 3 || session.access_token.length < 20) {
        console.log('MyRegistrationsCard - Invalid token format, waiting for valid session');
        setLoading(false);
        return;
      }
      
      // Add a small delay to ensure session is fully established
      const timer = setTimeout(() => {
        fetchRegistrations();
      }, 150);
      
      return () => clearTimeout(timer);
    } else {
      // Missing required data - just stop loading
      console.log('MyRegistrationsCard - Not ready to fetch:', {
        isAuthenticated,
        hasEmail: !!user?.email,
        hasAccessToken: !!session?.access_token,
        authLoading
      });
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user?.email, session?.access_token]);

  const handleWithdrawClick = (eventId: string, eventName: string) => {
    setSelectedEvent({ id: eventId, name: eventName });
    setWithdrawModalOpen(true);
  };

  const handleWithdrawSuccess = () => {
    fetchRegistrations(); // Refresh the list
  };

  const getUserProgress = (eventId: string, eventName: string) => {
    const currentStep = getCurrentStepForEvent(eventId);
    const completed = isEventCompleted(eventId);
    
    // Check session for additional context (for events in progress)
    const session = SessionManager.getSession();
    const sessionStep = (session?.currentEvent === eventName && session?.currentStepId >= 0) 
      ? session.currentStepId 
      : -1;
    
    // Use the higher of database step or session step
    let actualStep = currentStep;
    if (sessionStep >= 0) {
      actualStep = Math.max(currentStep, sessionStep);
    }
    
    // Don't show progress if user hasn't started (step 0 or below and not completed)
    if (actualStep <= 0 && !completed) return null;
    
    // Total steps: 0-18 = 19 steps total
    const totalSteps = 19;
    
    return {
      currentStep: actualStep,
      totalSteps,
      isCompleted: completed || actualStep >= 18,
      progressPercent: Math.min((actualStep / (totalSteps - 1)) * 100, 100)
    };
  };

  const handleContinueRide = (eventName: string) => {
    if (onEnterEvent) {
      onEnterEvent(eventName);
    } else {
      // Dispatch custom event to navigate to onboarding
      window.dispatchEvent(new CustomEvent('enterEvent', { detail: { eventName } }));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Registered Rides</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const activeRegistrations = registrations.filter(r => r.registration_status === 'registered' || r.registration_status === 'in_progress');
  const withdrawnRegistrations = registrations.filter(r => r.registration_status === 'withdrawn');
  const completedRegistrations = registrations.filter(r => r.registration_status === 'completed');

  if (registrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Registered Rides</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 space-y-3">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium">No registrations yet</p>
            <p className="text-sm text-muted-foreground">
              Join a ride to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Registered Rides</CardTitle>
          <Button
            onClick={fetchRegistrations}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Registrations */}
          {activeRegistrations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Active ({activeRegistrations.length})</h3>
              <div className="space-y-3">
                {activeRegistrations.map((registration) => {
                  const progress = getUserProgress(registration.event.id, registration.event.name);
                  
                  return (
                  <Card key={registration.id} className="border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                          <div className="flex-1 space-y-2 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <h4 className="font-medium">{registration.event.name}</h4>
                            </div>
                            
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {registration.event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{registration.event.location}</span>
                                </div>
                              )}
                              {registration.event.distance_km && (
                                <div className="flex items-center gap-2">
                                  <span>Distance: {registration.event.distance_km} km</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Registered {new Date(registration.registered_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleWithdrawClick(registration.event.id, registration.event.name)}
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 w-full sm:w-auto"
                          >
                            <UserMinus className="h-4 w-4" />
                            Withdraw
                          </Button>
                        </div>

                        {/* Progress Bar and Continue Button - Always show for registered rides */}
                        <div className="space-y-2">
                          {progress && progress.currentStep > 0 && (
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.progressPercent}%` }}
                              />
                            </div>
                          )}
                          
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContinueRide(registration.event.name);
                            }}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {progress?.isCompleted ? 'View Registration' : 'Continue Registration'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Registrations */}
          {completedRegistrations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Completed ({completedRegistrations.length})</h3>
              <div className="space-y-3">
                {completedRegistrations.map((registration) => (
                  <Card key={registration.id} className="border-green-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <h4 className="font-medium">{registration.event.name}</h4>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Withdrawn Registrations */}
          {withdrawnRegistrations.length > 0 && (
            <div className="space-y-3">
              <div className="space-y-3">
                {/* Withdrawn registrations section removed - redundant with HomePage CTAs */}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && (
        <WithdrawEventModal
          open={withdrawModalOpen}
          onClose={() => {
            setWithdrawModalOpen(false);
            setSelectedEvent(null);
          }}
          eventId={selectedEvent.id}
          eventName={selectedEvent.name}
          onWithdrawSuccess={handleWithdrawSuccess}
        />
      )}
    </>
  );
}