import React from 'react';
import { Card, CardContent } from './ui/card';
import { useEvents } from '../hooks/useEvents';
import { useEventHighlights } from '../hooks/useEventHighlights';
import { EventProgressButton } from './EventProgressButton';
import { EventPageTemplate } from './EventPageTemplate';

interface Sedgefield500PageProps {
  onEnterEvent: () => void;
}

export function Sedgefield500Page({ onEnterEvent }: Sedgefield500PageProps) {
  const { events } = useEvents();

  const sedgefieldEvent = events.find(event =>
    event.name === 'Sedgefield 500' ||
    event.name.toLowerCase().includes('sedgefield')
  );

  const { highlights: eventHighlights, loading: highlightsLoading } = useEventHighlights(sedgefieldEvent?.id);

  const descriptionContent = (
    <>
      <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground text-center">
        {sedgefieldEvent?.description || "The Garden Route of the Western Cape in South Africa hosts the Sedgefield 500. On this epic journey, you will enjoy unparalleled natural beauty that very few places can offer."}
      </p>
      <p className="text-lg text-muted-foreground mt-6 text-center">
        {sedgefieldEvent?.long_description || "Every twist and turn gives something special, offering mixed landscapes that very few places in the world can compare to. From the sandy beaches of the Indian Ocean to the lush forests of the South Africa Garden route, there’s always something to enjoy, and the surroundings change as you progress kilometer after kilometer. The rugged terrain, steep climbs, and challenging descents will push you to your limits, but with each pedal stroke, you will feel a sense of accomplishment."}
      </p>
      <p className="text-lg text-muted-foreground mt-4 text-center">
        With a maximum limit of only 13 participants and a route made by a local expert, it will give you the best of the region and test you like no other ride. You might be there for a long weekend of riding or there to race to the finish. Choose your challenge.
      </p>
    </>
  );

  const renderHighlights = () => {
    const highlights = eventHighlights.length > 0 ? eventHighlights : [
      {
        title: "The Montagu Pass & Outeniqua Pass",
        description: "The Montagu Pass is a challenging climb, with an elevation gain of 800 meters over a distance of 11 kilometers, featuring 126 bends. The Outeniqua Pass is visually wider and less steep but offers spectacular views of the surrounding landscape, including the Kaaimans River Gorge."
      },
      {
        title: "Seven Passes Gravel",
        description: "A historic route that winds its way through the Outeniqua Mountains, connecting Knysna and George. Along the way, you'll encounter stunning vistas, mountain streams, lush forests, and historic landmarks that make this Road a beloved icon."
      },
      {
        title: "De Vlugt down and up",
        description: "The De Vlugt gravel road pass is a scenic drive connecting Uniondale and Willowmore. Known for gorgeous natural beauty, it offers panoramic views of the surrounding mountains and valleys. The road is mostly gravel and challenging to navigate, making it a true remote bikepacking highlight."
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {highlights.map((highlight, index) => {
          const bgs = ["bg-[url('/home-1.jpg')]", "bg-[url('/home-2.jpg')]", "bg-[url('/home-3.jpg')]"];
          const bg = bgs[index % bgs.length];

          return (
            <Card key={index} className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <div className={`h-48 ${bg} bg-cover bg-center`} />
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">{highlight.title}</h3>
                <div className="text-muted-foreground leading-relaxed">
                  {highlight.description?.split('\n\n').map((para, i) => <p key={i} className="mb-2">{para}</p>)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const getTags = () => {
    if (!sedgefieldEvent?.event_tags) return ['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking'];
    const tags = sedgefieldEvent.event_tags;
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
      title={sedgefieldEvent?.name || "Sedgefield 500"}
      date={sedgefieldEvent?.event_date ? new Date(sedgefieldEvent.event_date).toLocaleDateString('en-GB') : "12th October 2024"}
      time={sedgefieldEvent?.time || "06:00"}
      location={sedgefieldEvent?.location || "Sedgefield, South Africa"}
      distance={sedgefieldEvent?.distance_km || 500}
      tags={getTags()}
      heroImage="/home-3.jpg"
      descriptionContent={descriptionContent}
      routeHighlightsContent={renderHighlights()}
      actionComponent={
        <EventProgressButton 
          eventName="Sedgefield 500"
          onEnterEvent={onEnterEvent}
        />
      }
    />
  );
}