import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { useEvents } from '../hooks/useEvents';
import { Event, supabase } from '../utils/supabase/client';
import { EventProgressButton } from './EventProgressButton';
import { EventPageTemplate } from './EventPageTemplate';

interface DynamicEventPageProps {
  eventSlug: string;
  onEnterEvent: (eventName: string) => void;
  onNavigateToUpgrade?: () => void;
}

export function DynamicEventPage({ eventSlug, onEnterEvent }: DynamicEventPageProps) {
  const { events, loading, error } = useEvents();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    let startTime = Date.now();
    let sent = false;

    return () => {
      if (event && !sent) {
        sent = true;
        const viewDurationSeconds = Math.round((Date.now() - startTime) / 1000);
        
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && viewDurationSeconds > 3) {
            supabase.functions.invoke('marketing', {
              body: { action: 'track-view', eventId: event.id, viewDurationSeconds }
            }).catch(e => console.error("Could not track view", e));
          }
        });
      }
    };
  }, [event]);

  useEffect(() => {
    if (events && events.length > 0) {
      const foundEvent = events.find(e => {
        const inputSlug = eventSlug.toLowerCase();
        return (
          e.slug?.toLowerCase() === inputSlug ||
          e.name.toLowerCase().replace(/\s+/g, '-') === inputSlug ||
          e.name.toLowerCase() === inputSlug.replace(/-/g, ' ')
        );
      });
      setEvent(foundEvent || null);
    }
  }, [events, eventSlug]);

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{loading ? 'Loading event details...' : 'Event not found'}</p>
        </div>
      </div>
    );
  }

  const getFallbackDescription = () => {
    const locationName = event.location?.split(',')[0] || event.name.split(' ')[0];
    return `Experience the challenge and beauty of ${locationName} as you embark on this epic ultra-distance cycling adventure. Navigate through stunning landscapes and test your endurance on this unforgettable route.`;
  };

  const descriptionContent = (
    <>
      <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground text-center">
        {event.description || getFallbackDescription()}
      </p>
      <p className="text-lg text-muted-foreground mt-6 text-center">
        Journey through landscapes that challenge and inspire, where every pedal stroke takes you closer to an unforgettable ultra-distance cycling achievement. This self-supported adventure invites you to explore at your own pace while pushing your limits.
      </p>
    </>
  );

  const fallbackHighlights = [
    {
      title: "Epic Landscape",
      description: "Discover the unique terrain and natural beauty that makes this a premier cycling destination, with varied landscapes that challenge and inspire."
    },
    {
      title: 'Challenging Route',
      description: "Navigate through carefully selected roads and paths that showcase the best of the region while providing the ultimate ultra-distance cycling challenge."
    },
    {
      title: 'Personal Achievement',
      description: "Push your limits and achieve something extraordinary on this self-supported adventure that will test your endurance and reward your determination."
    }
  ];

  const highlights = event.event_highlights?.length ? event.event_highlights : fallbackHighlights;

  const routeHighlightsContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {highlights
        .sort((a, b) => (a.highlight_order || 0) - (b.highlight_order || 0))
        .slice(0, 3)
        .map((highlight, index) => {
          const bgs = ["bg-[url('/home-2.jpg')]", "bg-[url('/home-3.jpg')]", "bg-[url('/home-4.jpg')]"];
          const bg = bgs[index % bgs.length];

          return (
            <Card key={index} className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <div className={`h-48 ${bg} bg-cover bg-center`} />
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">{highlight.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {highlight.description || 'Discover the beauty and challenge of this route section.'}
                </p>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );

  const getTags = () => {
    if (!event.event_tags) return ['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking'];
    if (Array.isArray(event.event_tags)) return event.event_tags;
    if (typeof event.event_tags === 'string') {
      try {
        if (event.event_tags.startsWith('[')) return JSON.parse(event.event_tags);
      } catch (e) {}
      return event.event_tags.split(',').map(t => t.trim());
    }
    return ['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking'];
  };

  return (
    <EventPageTemplate
      title={event.name}
      date={event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB') : "Date TBA"}
      time={event.start_time || "06:00"}
      location={event.location || "Location TBA"}
      distance={event.distance_km || 500}
      tags={getTags()}
      heroImage="/home-1.jpg"
      descriptionContent={descriptionContent}
      routeHighlightsContent={routeHighlightsContent}
      actionComponent={
        <EventProgressButton 
          eventName={event.name}
          onEnterEvent={() => onEnterEvent(event.name)}
        />
      }
    />
  );
}