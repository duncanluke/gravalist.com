import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { EventProgressButton } from './EventProgressButton';
import { useEvents } from '../hooks/useEvents';
import { EventPageTemplate } from './EventPageTemplate';
import { Event } from '../utils/supabase/client';

interface Franschhoek500PageProps {
  onEnterEvent: () => void;
}

export function Franschhoek500Page({ onEnterEvent }: Franschhoek500PageProps) {
  const { events, loading } = useEvents();
  const [franschhoekEvent, setFranschhoekEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (events && events.length > 0) {
      const event = events.find(e =>
        e.name.toLowerCase().includes('franschhoek') ||
        e.slug?.toLowerCase().includes('franschhoek')
      );
      setFranschhoekEvent(event || null);
    }
  }, [events]);

  const descriptionContent = (
    <>
      <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground text-center">
        {franschhoekEvent?.description || "In the Western Cape of South Africa, where whispers of tales of centuries past are spoken, a different adventure unfolds. Welcome to the Gravalist Franschhoek 500 bikepacking event."}
      </p>
      <p className="text-lg text-muted-foreground mt-6 text-center">
        This isn’t your typical wine tour but a daring exploration of beautiful gravel roads. The challenge is a test of grit, determination, endurance, and skill. You must conquer testing terrain and dig deep to get the best of your ability. With only 150 km on the tarmac, the route is dusty, and the road is not always smooth.
      </p>
      <p className="text-lg text-muted-foreground mt-4 text-center">
        It will be a logistical challenge to ensure correct resupplying, know your route, and conserve your energy for the climbs that will rattle your legs. You will need to calculate your moves wisely. The distance is 500 km, and we only allow 13 participants to enter. The field is small, and nobody's adventure is going to be the same. The challenge is you vs you.
      </p>
    </>
  );

  const routeHighlightsContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
        <div className="h-48 bg-[url('/home-4.jpg')] bg-cover bg-center" />
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-4">Hemel-en-Aarde Valley</h3>
          <p className="text-muted-foreground leading-relaxed">
            Starting in Franschhoek, you will head down the hemel-en-aarde valley, passing through scenic vineyards and orchards before making your way to Stanford.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
        <div className="h-48 bg-[url('/home-1.jpg')] bg-cover bg-center" />
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-4">The Winding Journey</h3>
          <p className="text-muted-foreground leading-relaxed">
            From Stanford, the route will take you on a long and winding journey around the valley, passing through small towns and villages, and showcasing the natural beauty of the area.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
        <div className="h-48 bg-[url('/home-2.jpg')] bg-cover bg-center" />
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-4">Franschhoek Pass</h3>
          <p className="text-muted-foreground leading-relaxed">
            The final stretch takes you over the famous Franschhoek Pass, offering breathtaking views of the surrounding mountains and valleys. This challenging climb will test your stamina.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const getTags = () => {
    if (!franschhoekEvent?.event_tags) return ['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking'];
    const tags = franschhoekEvent.event_tags;
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        if (tags.startsWith('[')) return JSON.parse(tags);
      } catch (e) {}
      return tags.split(',').map(tag => tag.trim());
    }
    return ['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking'];
  };

  return (
    <EventPageTemplate
      title={franschhoekEvent?.name || "Franschhoek 500"}
      date={franschhoekEvent?.event_date ? new Date(franschhoekEvent.event_date).toLocaleDateString('en-GB') : "14th December 2025"}
      time={franschhoekEvent?.start_time || "06:00"}
      location={franschhoekEvent?.location || "Franschhoek, South Africa"}
      distance={loading ? '...' : (franschhoekEvent?.distance_km || 500)}
      tags={getTags()}
      heroImage="/home-4.jpg"
      descriptionContent={descriptionContent}
      routeHighlightsContent={routeHighlightsContent}
      actionComponent={
        <EventProgressButton 
          eventName="Franschhoek 500"
          onEnterEvent={onEnterEvent}
        />
      }
    />
  );
}