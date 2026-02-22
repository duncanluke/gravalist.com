import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, MapPin, Route, Mountain, TreePine, Award } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { Event } from '../utils/supabase/client';
// Using the same event image as placeholder - can be updated with event-specific image later
import logoImage from '@/assets/logo.png';

interface DynamicEventPageProps {
  eventSlug: string;
  onEnterEvent: (eventName: string) => void;
}

export function DynamicEventPage({ eventSlug, onEnterEvent }: DynamicEventPageProps) {
  const { events, loading, error } = useEvents();
  const [event, setEvent] = useState<Event | null>(null);

  // Find the event in the database by slug
  useEffect(() => {
    if (events && events.length > 0) {
      console.log('🔍 DynamicEventPage - Searching for event:', {
        eventSlug,
        availableEvents: events.map(e => ({ 
          name: e.name, 
          slug: e.slug, 
          generatedSlug: e.name.toLowerCase().replace(/\s+/g, '-'),
          nameWithDashes: e.name.toLowerCase().replace(/\s+/g, '-')
        }))
      });
      
      const foundEvent = events.find(e => {
        // Try multiple matching strategies
        const eventSlugFromName = e.name.toLowerCase().replace(/\s+/g, '-');
        const eventSlugFromSlug = e.slug?.toLowerCase();
        const inputSlugNormalized = eventSlug.toLowerCase();
        
        // Also try matching the name directly (in case eventSlug is the full name)
        const eventNameNormalized = e.name.toLowerCase();
        
        const matches = (
          // Direct slug match
          eventSlugFromSlug === inputSlugNormalized ||
          // Generated slug from name match
          eventSlugFromName === inputSlugNormalized ||
          // Try with spaces instead of dashes
          e.name.toLowerCase().replace(/\s+/g, ' ') === inputSlugNormalized.replace(/-/g, ' ') ||
          // Exact name match (case insensitive)
          e.name.toLowerCase() === inputSlugNormalized.replace(/-/g, ' ') ||
          // Direct name match (in case eventSlug is the full event name)
          eventNameNormalized === inputSlugNormalized ||
          // Exact name match (case sensitive)
          e.name === eventSlug
        );
        
        if (matches) {
          console.log('✅ DynamicEventPage - Found matching event:', {
            eventName: e.name,
            eventSlug: e.slug,
            inputSlug: eventSlug
          });
        }
        
        return matches;
      });
      
      console.log('DynamicEventPage - Event search result:', {
        eventSlug,
        foundEvent: foundEvent ? { id: foundEvent.id, name: foundEvent.name, slug: foundEvent.slug } : null
      });
      
      setEvent(foundEvent || null);
    }
  }, [events, eventSlug]);

  // Format date for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    });
  };

  // Format time for display
  const formatEventTime = (timeString: string | undefined) => {
    if (!timeString) return '06:00'; // fallback
    return timeString.slice(0, 5); // Get HH:MM from HH:MM:SS
  };

  // Get event tags as badges
  const getEventTags = (tags: string[]) => {
    return tags.length > 0 ? tags : ['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking'];
  };

  // Get icon for tag
  const getTagIcon = (tag: string) => {
    const lowerTag = tag.toLowerCase();
    if (lowerTag === 'unsupported') return Award;
    if (lowerTag === 'ultracycling') return Route;
    if (lowerTag === 'gravel') return Mountain;
    if (lowerTag === 'bikepacking') return TreePine;
    return Route; // default
  };

  // Generate fallback description based on event name and location
  const getFallbackDescription = (eventName: string, location?: string) => {
    const locationName = location?.split(',')[0] || eventName.split(' ')[0];
    return `Experience the challenge and beauty of ${locationName} as you embark on this epic ultra-distance cycling adventure. Navigate through stunning landscapes and test your endurance on this unforgettable route.`;
  };

  // Generate fallback route highlights
  const getFallbackHighlights = (eventName: string, location?: string) => {
    const locationName = location?.split(',')[0] || eventName.split(' ')[0];
    return [
      {
        title: `${locationName} Landscape`,
        description: `Discover the unique terrain and natural beauty that makes ${locationName} a premier cycling destination, with varied landscapes that challenge and inspire.`
      },
      {
        title: 'Epic Route',
        description: `Navigate through carefully selected roads and paths that showcase the best of the region while providing the ultimate ultra-distance cycling challenge.`
      },
      {
        title: 'Personal Achievement',
        description: `Push your limits and achieve something extraordinary on this self-supported adventure that will test your endurance and reward your determination.`
      }
    ];
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load event details</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Handle event not found - show error toast and redirect to home
  useEffect(() => {
    if (!loading && !event && events && events.length > 0) {
      console.log('⚠️ DynamicEventPage - Event not found, but not redirecting');
      // Don't redirect - just keep showing loading state
      // The event might load on next render
    }
  }, [loading, event, events, eventSlug]);

  // Event not found state - just show loading instead of error
  if (!loading && !event && events && events.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Final safety check - if no event, show loading
  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  const eventTags = getEventTags(event.event_tags);
  const fallbackHighlights = getFallbackHighlights(event.name, event.location);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="py-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src={logoImage} 
                alt={`${event.name} Symbol`} 
                className="h-24 w-auto"
              />
            </div>
            
            <h1 className="mb-4">{event.name}</h1>
            
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Badge variant="outline" className="text-foreground border-border">
                <Calendar className="w-4 h-4 mr-2" />
                {formatEventDate(event.event_date)}
              </Badge>
              {event.start_time && (
                <Badge variant="outline" className="text-foreground border-border">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatEventTime(event.start_time)}
                </Badge>
              )}
              {event.location && (
                <Badge variant="outline" className="text-foreground border-border">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.location}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {eventTags.map((tag, index) => {
                const isFirstTag = index === 0;
                const IconComponent = getTagIcon(tag);
                
                return (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className={isFirstTag ? "text-primary border-primary bg-primary/10" : "text-foreground border-border"}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="prose prose-invert max-w-none mb-12">
            <p className="text-center mb-8">
              {event.description || getFallbackDescription(event.name, event.location)}
            </p>
          </div>

          <div className="text-center mb-12">
            <Button 
              size="lg" 
              onClick={() => onEnterEvent(event.name)}
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Register
            </Button>
          </div>
        </div>
      </div>

      {/* Route Section */}
      <div className="py-12">
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="mb-6">Route</h2>
            <p className="mb-6">
              Journey through landscapes that challenge and inspire, where every pedal stroke takes you closer to an unforgettable ultra-distance cycling achievement.
            </p>
            
            <p className="mb-4">
              This self-supported adventure invites you to explore at your own pace while pushing your limits on carefully selected routes that showcase the natural beauty and unique challenges of the region.
            </p>
            
            <p className="mb-6">
              Whether you're chasing personal records or simply seeking an epic adventure, this route offers the perfect combination of scenic beauty and physical challenge that defines ultra-distance cycling at its finest.
            </p>
            
            <p>
              Ready to embark on this incredible journey? Prepare for an experience that will test your endurance and reward you with memories that last a lifetime.
            </p>
          </CardContent>
        </Card>

        {/* Route Highlights */}
        <div className="mb-12">
          <h2 className="mb-8 text-center">Route Highlights</h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            {event.event_highlights && event.event_highlights.length > 0 ? (
              // Use database highlights if available
              event.event_highlights
                .sort((a, b) => a.highlight_order - b.highlight_order)
                .slice(0, 3) // Show max 3 highlights to maintain layout
                .map((highlight) => (
                  <Card key={highlight.id}>
                    <CardContent className="p-6">
                      <h3 className="mb-4">{highlight.title}</h3>
                      <p>{highlight.description || 'Discover the beauty and challenge of this route section.'}</p>
                    </CardContent>
                  </Card>
                ))
            ) : (
              // Fallback to generated highlights if no database highlights
              fallbackHighlights.map((highlight, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="mb-4">{highlight.title}</h3>
                    <p>{highlight.description}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Event Details */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="mb-4">{eventTags.join(' ')}</h2>
              <div className="text-4xl font-bold text-primary mb-2">
                {event.distance_km ? `${event.distance_km}km` : '500km'}
              </div>
              <p className="text-muted-foreground">
                {event.difficulty_level ? `${event.difficulty_level} adventure` : 'Unsupported adventure'}
              </p>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-center">
                No aid stations, no route markings—just you and your bike. Follow the GPX route or make it your own. Choose your challenge: ride solo and chase the record or tour with friends before the cut-off.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <div className="text-center">
          <Button 
            size="lg" 
            onClick={() => onEnterEvent(event.name)}
            className="px-8 py-3 mb-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Register
          </Button>
          <p className="text-sm text-muted-foreground">
            Begin your personalized 3-phase preparation for this epic ride
          </p>
        </div>
      </div>
    </div>
  );
}