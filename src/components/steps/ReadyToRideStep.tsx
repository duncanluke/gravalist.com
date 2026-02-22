import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, Users, MapPin } from 'lucide-react';
import { EventParticipant } from '../../utils/supabase/client';
import { useAuth } from '../../hooks/useAuth';

interface ReadyToRideStepProps {
  eventName: string;
  participants: EventParticipant[];
  loading: boolean;
  onContinue: () => void;
  showRegistrationSuccess?: boolean;
  pointsAwarded?: number;
}

export function ReadyToRideStep({ 
  eventName, 
  participants, 
  loading, 
  onContinue, 
  showRegistrationSuccess = true, 
  pointsAwarded = 50 
}: ReadyToRideStepProps) {
  const { profile } = useAuth();
  
  // Removed duplicate points awarding - points are already awarded in RegistrationAlmostCompleteStep

  // Format participants data
  const readyRiders = participants.filter(rider => rider.status === 'ready');
  const preparingRiders = participants.filter(rider => rider.status === 'preparing');

  // Helper function to get initials for a rider name
  const getInitials = (name: string) => {
    if (name === 'Unknown User') return 'U';
    return name.split(' ').map(n => n[0]).join('');
  };

  // Format join time to be more user-friendly
  const formatJoinTime = (joinedAt: string) => {
    const joinDate = new Date(joinedAt);
    const now = new Date();
    const diffMs = now.getTime() - joinDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h2>You're All Set!</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Your preparation is complete! You have two options:
            </p>
            <p>
              <strong>Ride with the community:</strong> Join on the scheduled date and start together at 6:00 AM.
            </p>
            <p>
              <strong>Ride on your own time:</strong> Start whenever it works for you — no countdown, no waiting. Just click Start when you're ready.
            </p>
            <p>
              Take a breath — you've got this.
            </p>
          </div>
        </div>
      </div>

      {/* Community Status Card */}


      {/* Onboarding Completion Badge - Removed to prevent duplicate points */}

      {/* Riders List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Roll Call</h3>
          <Badge variant="outline" className="text-xs">
            {participants.length} {participants.length === 1 ? 'rider' : 'riders'}
          </Badge>
        </div>

        <div className="space-y-3">
          {loading ? (
            // Loading state
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                        <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-5 w-12 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : participants.length === 0 ? (
            // Empty state
            <Card className="p-6 text-center border-primary/20 bg-primary/5">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">You're the first member to sign up!</h3>
                  <p className="text-xs text-muted-foreground">
                    Be the pioneer for your community. Others will join as word spreads about this event.
                  </p>

                </div>
              </div>
            </Card>
          ) : (
            // Participants list
            <>
              {/* Ready Riders */}
              {readyRiders.map((rider, index) => (
                <Card key={`ready-${rider.email}-${index}`} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {getInitials(rider.name)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{rider.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {profile?.city || 'City not provided'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">

                    </div>
                  </div>
                </Card>
              ))}

              {/* Preparing Riders */}
              {preparingRiders.map((rider, index) => (
                <Card key={`preparing-${rider.email}-${index}`} className="p-3 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          {getInitials(rider.name)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{rider.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {profile?.city || 'City not provided'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        Preparing
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Event Day Instructions */}
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="space-y-3 text-center">
          <h3 className="font-semibold text-sm text-primary">Ready When You Are</h3>
          <p className="text-xs text-muted-foreground">
            Click Continue below to proceed to the start phase. You can begin immediately or wait for the community ride date — it's your choice.
          </p>
          <div className="pt-2">
            <Button 
              onClick={onContinue}
              className="w-full"
              size="lg"
            >
              Continue to Start
            </Button>
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="p-4 bg-muted/30 border-muted">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">What's Next?</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• Click Continue whenever you're ready to start</p>
            <p>• You'll take a starting photo</p>
            <p>• Begin tracking your ride</p>
            <p>• Remember: My tracking, my responsibility</p>
          </div>
        </div>
      </Card>
    </div>
  );
}