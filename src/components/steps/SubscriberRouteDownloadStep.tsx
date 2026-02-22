import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Download, MapPin, FileText, Lock, Crown, Check, ArrowRight } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { useAppState } from '../../hooks/useAppState';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface SubscriberRouteDownloadStepProps {
  onContinue: () => void;
}

export function SubscriberRouteDownloadStep({ onContinue }: SubscriberRouteDownloadStepProps) {
  const { events, refreshEvents } = useEvents();
  const { state } = useAppState();
  const { profile } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Force refresh events on component mount
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);
  
  // Find the current event
  const currentEvent = events.find(event => event.name === state.currentEvent);
  
  // Check subscription status
  const isSubscriber = profile?.is_premium_subscriber && profile?.subscription_status === 'active';
  
  const handleDownload = async () => {
    if (!currentEvent) {
      toast.error('No event selected');
      return;
    }

    if (!currentEvent.gpx_file_path) {
      toast.error('No GPX file available for this event');
      return;
    }

    if (!isSubscriber) {
      toast.error('Subscription required to download route files');
      return;
    }

    setIsDownloading(true);
    
    try {
      const { downloadUrl, fileName } = await apiClient.getGpxDownloadUrl(currentEvent.id);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('GPX file downloaded successfully!');
    } catch (error: any) {
      console.error('Error downloading GPX file:', error);
      
      // Check if it's a subscription error
      if (error?.message?.includes('Subscription required') || error?.statusCode === 403) {
        toast.error('Active subscription required to download routes', {
          description: 'Please upgrade to access route files',
          duration: 5000
        });
      } else {
        toast.error('Failed to download GPX file. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpgrade = () => {
    // Store the current event in localStorage to return after upgrade
    if (state.currentEvent) {
      localStorage.setItem('gravalist_return_to_event', state.currentEvent);
      localStorage.setItem('gravalist_return_step', state.currentStepId.toString());
    }
    
    // Navigate to upgrade page using the app's view mode system
    // This ensures we stay within the app, not a hard page reload
    const upgradeEvent = new CustomEvent('navigateToUpgrade', { 
      detail: { returnToOnboarding: true } 
    });
    window.dispatchEvent(upgradeEvent);
  };

  // If user is NOT a subscriber, show upgrade gate
  if (!isSubscriber) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2>Subscriber Access Required</h2>
          <p className="text-muted-foreground">
            Route files are available to subscribers only
          </p>
        </div>

        {/* Preview Card (Locked) */}
        <Card className="p-6 space-y-4 relative overflow-hidden border-primary/30">
          {/* Lock overlay */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center space-y-2">
              <Lock className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm font-medium">Subscribe to Download</p>
            </div>
          </div>

          {/* Preview content (blurred) */}
          <div className="text-center space-y-2 opacity-50">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3>{currentEvent?.gpx_file_name || `${currentEvent?.name || 'Route'}.gpx`}</h3>
            <p className="text-sm text-muted-foreground">
              Official route file with waypoints and checkpoints
            </p>
          </div>
        </Card>

        {/* Subscription Benefits */}
        <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3>Gravalist Subscription</h3>
              <p className="text-sm text-muted-foreground">Join the community</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Download all route files</p>
                <p className="text-sm text-muted-foreground">
                  Access GPX files for any route, anytime
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Community leaderboard</p>
                <p className="text-sm text-muted-foreground">
                  Track your progress and compete with others
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Ride whenever you want</p>
                <p className="text-sm text-muted-foreground">
                  No schedules, ride at your own pace
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Discord community access</p>
                <p className="text-sm text-muted-foreground">
                  Connect with fellow riders, share tips
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-primary/20">
            <Button 
              onClick={handleUpgrade}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              <Crown className="h-4 w-4 mr-2" />
              Become a Subscriber
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Skip Option */}
        <div className="text-center">
          <Button 
            onClick={onContinue}
            variant="ghost"
            className="text-muted-foreground"
          >
            Skip for Now
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            You can subscribe later to download routes
          </p>
        </div>
      </div>
    );
  }

  // If user IS a subscriber, show download interface
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <h2>Download Your Route</h2>
        <p className="text-muted-foreground">
          Get the official GPX file for your GPS device
        </p>
      </div>

      <Card className="p-6 space-y-4 border-primary/30">
        <div className="text-center space-y-2">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3>{currentEvent?.gpx_file_name || `${currentEvent?.name || 'Route'}.gpx`}</h3>
          <p className="text-sm text-muted-foreground">
            Official route file with waypoints and checkpoints
          </p>
          {currentEvent?.gpx_file_size && (
            <p className="text-xs text-muted-foreground">
              File size: {(currentEvent.gpx_file_size / 1024).toFixed(1)} KB
            </p>
          )}
          {currentEvent?.gpx_file_uploaded_at && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(currentEvent.gpx_file_uploaded_at).toLocaleDateString()}
            </p>
          )}
        </div>
        
        {currentEvent?.gpx_file_path ? (
          <div className="space-y-3">
            <Button 
              onClick={handleDownload}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download GPX File
                </>
              )}
            </Button>

            <Button 
              onClick={onContinue}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No GPX file available for this event yet
            </p>
            <Button 
              onClick={onContinue}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Continue Without File
            </Button>
          </div>
        )}
      </Card>

      {/* Subscriber Badge */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Crown className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Active Subscriber</p>
          <p className="text-xs text-muted-foreground">
            Thank you for supporting Gravalist
          </p>
        </div>
      </div>

      <div className="bg-muted/30 border border-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          💡 Load this file into your GPS device or navigation app before starting the event.
        </p>
      </div>
    </div>
  );
}