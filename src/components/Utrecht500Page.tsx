import React from 'react';
import { useEvents } from '../hooks/useEvents';
import { EventProgressButton } from './EventProgressButton';
import { EventPageTemplate } from './EventPageTemplate';
import { Card, CardContent } from './ui/card';

interface Utrecht500PageProps {
  onEnterEvent: () => void;
}

export function Utrecht500Page({ onEnterEvent }: Utrecht500PageProps) {
  const { events, loading: eventsLoading } = useEvents();
  
  // Find the Utrecht 500 event from the database
  const utrecht500Event = events.find(event => 
    event.name === 'Utrecht 500' || event.slug === 'utrecht-500'
  );

  const descriptionContent = (
    <>
      <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground text-center">
        Pedal your way through serene forests, picturesque dijks, and iconic landmarks as you traverse the diverse terrain of the Dutch countryside.
      </p>
      <p className="text-lg text-muted-foreground mt-6 text-center">
        With each mile, you'll uncover hidden gems and unforgettable vistas that will leave you in awe. Whether you're a seasoned ultra cyclist or a first-time participant, this event is your chance to push past your limits and achieve something extraordinary.
      </p>
      <p className="text-lg text-muted-foreground mt-4 text-center">
        With fellow riders and the thrill of the open road, you'll discover what you're truly capable of. Are you ready to embark on this epic cycling odyssey through the Netherlands?
      </p>
    </>
  );

  const routeHighlightsContent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
        <div className="h-48 bg-[url('/home-2.jpg')] bg-cover bg-center" />
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-4">Enkhuizen</h3>
          <p className="text-muted-foreground leading-relaxed">
            Pedal back in time to the charming port town of Enkhuizen, where every cobblestone street tells a story of seafaring adventures and maritime glory.
            Cycle along scenic coastal routes, where the sparkling waters of the IJsselmeer beckon and the salty sea breeze invigorates your senses.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
        <div className="h-48 bg-[url('/home-3.jpg')] bg-cover bg-center" />
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-4">Amsterdam</h3>
          <p className="text-muted-foreground leading-relaxed">
            Saddle up and explore the vibrant city of Amsterdam. Discover why it is renowned as one of the most bike-friendly cities in the world. As you pedal through charming streets, you'll be greeted by picturesque row houses, bustling markets, and quaint cafes.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
        <div className="h-48 bg-[url('/home-4.jpg')] bg-cover bg-center" />
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-4">National Park Veluwezoom</h3>
          <p className="text-muted-foreground leading-relaxed">
            Enjoy an unforgettable cycling adventure in the heart of Veluwezoom, where dense woodlands, rolling hills, meandering streams, and diverse wildlife await your exploration. Let the tranquil beauty of the park wash over you as you ride through its pristine landscapes.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <EventPageTemplate
      title="Utrecht 500"
      date="19th September 2025"
      time="06:00"
      location="Utrecht, The Netherlands"
      distance={eventsLoading ? '...' : (utrecht500Event?.distance_km || 500)}
      tags={['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking']}
      heroImage="/home-1.jpg"
      descriptionContent={descriptionContent}
      routeHighlightsContent={routeHighlightsContent}
      actionComponent={
        <EventProgressButton 
          eventName="Utrecht 500"
          onEnterEvent={onEnterEvent}
        />
      }
    />
  );
}