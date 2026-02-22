import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Download, MapPin, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { useAppState } from '../../hooks/useAppState';
import { apiClient } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface RouteDownloadStepProps {
  onContinue: () => void;
}

export function RouteDownloadStep({ onContinue }: RouteDownloadStepProps) {
  const { events, refreshEvents } = useEvents();
  const { state } = useAppState();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Force refresh events on component mount to get latest data
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);
  
  // Find the current event from the events list using the current event name from state
  const currentEvent = events.find(event => event.name === state.currentEvent);
  
  // Debug logging
  console.log('RouteDownloadStep Debug:', {
    stateCurrentEvent: state.currentEvent,
    eventsCount: events.length,
    currentEvent: currentEvent,
    gpxFilePath: currentEvent?.gpx_file_path,
    gpxFileName: currentEvent?.gpx_file_name,
    eventNames: events.map(e => e.name)
  });

  const handleDownload = async () => {
    if (!currentEvent) {
      toast.error('No event selected');
      return;
    }

    if (!currentEvent.gpx_file_path) {
      toast.error('No GPX file available for this event');
      return;
    }

    setIsDownloading(true);
    
    try {
      // Get download URL from server
      const { downloadUrl, fileName } = await apiClient.getGpxDownloadUrl(currentEvent.id);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('GPX file downloaded successfully!');
    } catch (error) {
      console.error('Error downloading GPX file:', error);
      toast.error('Failed to download GPX file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshEvents();
      toast.success('Events refreshed');
    } catch (error) {
      toast.error('Failed to refresh events');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
      </div>

      <Card className="p-6 space-y-4">
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
              Uploaded: {new Date(currentEvent.gpx_file_uploaded_at).toLocaleDateString()}
            </p>
          )}
        </div>
        
        {currentEvent?.gpx_file_path ? (
          <div className="space-y-3">
            <Button 
              onClick={handleDownload}
              className="w-full"
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


          </div>
        ) : (
          <div className="text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No GPX file available for this event yet
              </p>
              <p className="text-xs text-muted-foreground">
                The event organizer hasn't uploaded a route file yet. You can continue and check back later.
              </p>
              {/* Debug info */}
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-2">
                Debug: Event "{state.currentEvent}" | Found: {currentEvent ? 'Yes' : 'No'} | Events loaded: {events.length}
                {currentEvent && (
                  <div>GPX Path: {currentEvent.gpx_file_path || 'None'}</div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={onContinue}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Continue Without File
              </Button>
              <Button 
                onClick={handleRefresh}
                variant="ghost"
                className="w-full"
                size="sm"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Events
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="bg-muted/30 border border-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          💡 Load this file into your GPS device or navigation app before starting the event.
        </p>
      </div>

    </div>
  );
}