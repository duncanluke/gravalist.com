import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { apiClient, supabase } from './utils/supabase/client';
import { useEvents } from './hooks/useEvents';
import { useAuth } from './hooks/useAuth';
import { toast } from 'sonner@2.0.3';
import { projectId } from './utils/supabase/info';

// Debug component to test GPX file functionality
export function DebugGPX() {
  const { events, loading } = useEvents();
  const { isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [storageDebug, setStorageDebug] = useState<any>(null);
  const [testingStorage, setTestingStorage] = useState(false);

  useEffect(() => {
    if (!loading && events.length > 0) {
      console.log('All events:', events);
      const eventsWithGpx = events.filter(e => e.gpx_file_path);
      console.log('Events with GPX files:', eventsWithGpx);
      setDebugInfo({
        totalEvents: events.length,
        eventsWithGpx: eventsWithGpx.length,
        eventsWithGpxDetails: eventsWithGpx.map(e => ({
          id: e.id,
          name: e.name,
          gpx_file_path: e.gpx_file_path,
          gpx_file_name: e.gpx_file_name,
          gpx_file_size: e.gpx_file_size
        }))
      });
    }
  }, [events, loading]);

  const testStorageDebug = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to test storage');
      return;
    }

    setTestingStorage(true);
    try {
      // Use the apiClient to make the request with proper authentication
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/debug/gpx-storage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setStorageDebug(result.debug);
      console.log('Storage debug result:', result);
      toast.success('Storage debug info loaded');
    } catch (error) {
      console.error('Error testing storage:', error);
      toast.error(`Storage test failed: ${error.message}`);
    } finally {
      setTestingStorage(false);
    }
  };

  const getAuthToken = async (): Promise<string> => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error('Authentication required');
    }
    return data.session.access_token;
  };

  const testGpxDownload = async (eventId: string) => {
    try {
      console.log('Testing GPX download for event:', eventId);
      const result = await apiClient.getGpxDownloadUrl(eventId);
      console.log('Download URL result:', result);
      toast.success('Got download URL successfully!');
      
      // Try to download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error testing GPX download:', error);
      toast.error(`Download failed: ${error.message}`);
    }
  };

  if (loading) return <div>Loading events...</div>;

  return (
    <div>Debug component removed</div>
  );
}