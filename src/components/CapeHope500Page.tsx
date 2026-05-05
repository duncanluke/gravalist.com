import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { apiClient, Event } from '../utils/supabase/client';
import { EventProgressButton } from './EventProgressButton';
import { EventPageTemplate } from './EventPageTemplate';

interface CapeHope500PageProps {
  onEnterEvent: () => void;
}

export function CapeHope500Page({ onEnterEvent }: CapeHope500PageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const { event: eventData } = await apiClient.getEvent('cape-hope-500');
        setEvent(eventData);
      } catch (err) {
        console.error('Failed to fetch event data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, []);

  const descriptionContent = (
    <>
      <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground text-center">
        {event?.description || "In the heart of Cape Town, where the salty breeze whispers tales of adventure, there lies an invitation to embark on a journey of a lifetime. The Cape Hope 500 starts here."}
      </p>
      <p className="text-lg text-muted-foreground mt-6 text-center">
        Ahead lies many challenges, a legendary route carved by pioneers long gone, their spirit of exploration echoing at every turn. You're not just a cyclist but an explorer, forging your path through the rich tapestry of Cape Town's landscape. The 500 km Cape Hope Route is designed to challenge all cyclists.
      </p>
      <p className="text-lg text-muted-foreground mt-4 text-center">
        Whatever journey you want to take, each of the participants will have a different experience. The Cape Hope 500 isn't just a race. It's an opportunity to write your own chapter in the annals of cycling history.
      </p>
    </>
  );

  const renderHighlights = () => {
    if (event?.event_highlights && event.event_highlights.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {event.event_highlights
            .sort((a, b) => a.highlight_order - b.highlight_order)
            .map((highlight, index) => {
              const bgs = ["bg-[url('/home-3.jpg')]", "bg-[url('/home-4.jpg')]", "bg-[url('/home-2.jpg')]"];
              const bg = bgs[index % bgs.length];
              return (
                <Card key={highlight.id} className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
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
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <div className="h-48 bg-[url('/home-2.jpg')] bg-cover bg-center" />
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Footprints wash away</h3>
            <p className="text-muted-foreground leading-relaxed">
              Beginning at the waterfront, riders set out with hope for a low tide, providing them with a narrow path to navigate the challenging first beach section that stretches all the way up the West Coast with Table Mountain's sunset as a breathtaking backdrop.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <div className="h-48 bg-[url('/home-3.jpg')] bg-cover bg-center" />
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Farmlands & Tulbagh</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sneak your way to Malmesbury and across up to Riebeek-Kasteel, then Tulbagh over to Paarl Rock. If you want a polished route with water stops and free massages, please stay away from this race. You might feel that farms and dogs don't want you around.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
          <div className="h-48 bg-[url('/home-4.jpg')] bg-cover bg-center" />
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Cape Gravel</h3>
            <p className="text-muted-foreground leading-relaxed">
              Fight the headwind all the way home. You'll need your light to see where you are going, but you might want to keep it on low to conserve energy for the arduous path back.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <EventPageTemplate
      title={event?.name || "Cape Hope 500"}
      date={event?.event_date ? new Date(event.event_date).toLocaleDateString('en-GB') : "14th November 2025"}
      time={event?.start_time || "06:00"}
      location={event?.location || "Cape Town, South Africa"}
      distance={loading ? '...' : (event?.distance_km || 500)}
      tags={event?.event_tags || ['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking']}
      heroImage="/home-2.jpg"
      descriptionContent={descriptionContent}
      routeHighlightsContent={renderHighlights()}
      actionComponent={
        <EventProgressButton 
          eventName="Cape Hope 500"
          onEnterEvent={onEnterEvent}
        />
      }
    />
  );
}