import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, MapPin, Route, Mountain, TreePine, Award } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useEventHighlights } from '../hooks/useEventHighlights';
import { EventProgressButton } from './EventProgressButton';
// Using the same event image as placeholder - can be updated with event-specific image later
import logoImage from '@/assets/logo.png';

interface Sedgefield500PageProps {
  onEnterEvent: () => void;
}

export function Sedgefield500Page({ onEnterEvent }: Sedgefield500PageProps) {
  const { events } = useEvents();

  // Find the Sedgefield 500 event in the database
  const sedgefieldEvent = events.find(event =>
    event.name === 'Sedgefield 500' ||
    event.name.toLowerCase().includes('sedgefield')
  );

  // Fetch event highlights from database
  const { highlights: eventHighlights, loading: highlightsLoading } = useEventHighlights(sedgefieldEvent?.id);

  // Use event highlights from database, with fallback data
  const routeHighlights = eventHighlights.length > 0
    ? eventHighlights.map(highlight => ({
      title: highlight.title,
      description: highlight.description
    }))
    : [
      {
        title: "The Montagu Pass (Gravel) and Outeniqua Pass (Tar)",
        description: "The Montagu Pass and Outeniqua Pass are two historic mountain passes located in the Western Cape region of South Africa, on the Garden Route. The Montagu Pass is a challenging climb, with an elevation gain of 800 meters over a distance of 11 kilometers. It features 126 bends, some of which are sharp hairpin turns, and the road surface is often steep and narrow. The Outeniqua Pass is visually wider and less steep but offers spectacular views of the surrounding landscape, including the Kaaimans River Gorge and coastline."
      },
      {
        title: "Seven Passes Gravel",
        description: "The 7 Passes Road is a historic route that winds its way through the Outeniqua Mountains, connecting the towns of Knysna and George. The road gets its name from the seven mountain passes that it crosses, each with its unique features and challenges. Along the way, you will encounter stunning vistas, mountain streams, and lush forests, as well as the historic bridges and landmarks that have made the 7 Passes Road a beloved icon of the Western Cape."
      },
      {
        title: "De Vlugt down and up",
        description: "The De Vlugt gravel road pass (R339) is a scenic drive connecting Uniondale and Willowmore. It took Thomas Bain four years to build the pass. It is known for its stunning natural beauty, offering panoramic views of the surrounding mountains and valleys. The road is mostly gravel and challenging to navigate, making it a true remote bikepacking highlight."
      }
    ];

  // Parse event tags from database if available
  const eventTags = sedgefieldEvent?.event_tags
    ? (() => {
      const tags = sedgefieldEvent.event_tags;

      // Check if it's already an array
      if (Array.isArray(tags)) {
        return tags;
      }

      // If it's a string, check if it's JSON or comma-separated
      if (typeof tags === 'string') {
        // Try JSON first
        if (tags.startsWith('[') && tags.endsWith(']')) {
          try {
            return JSON.parse(tags);
          } catch {
            // If JSON parsing fails, fall through to comma-separated handling
          }
        }

        // Handle comma-separated string
        return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }

      // Fallback
      return ['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking'];
    })()
    : ['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking'];

  // Format date from database
  const formatEventDate = (dateString: string) => {
    if (!dateString) return '12th October 2024';
    const date = new Date(dateString);
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
      day === 2 || day === 22 ? 'nd' :
        day === 3 || day === 23 ? 'rd' : 'th';
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day}${suffix} ${month} ${year}`;
  };

  // Format time from database
  const formatEventTime = (timeString: string) => {
    if (!timeString) return '06:00';
    return timeString;
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="py-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src={logoImage}
                alt="Sedgefield 500 Symbol"
                className="h-24 w-auto"
              />
            </div>

            <h1 className="mb-4">{sedgefieldEvent?.name || 'Sedgefield 500'}</h1>

            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Badge variant="outline" className="text-foreground border-border">
                <Calendar className="w-4 h-4 mr-2" />
                {formatEventDate(sedgefieldEvent?.event_date || '')}
              </Badge>
              <Badge variant="outline" className="text-foreground border-border">
                <Clock className="w-4 h-4 mr-2" />
                {formatEventTime(sedgefieldEvent?.time || '')}
              </Badge>
              <Badge variant="outline" className="text-foreground border-border">
                <MapPin className="w-4 h-4 mr-2" />
                {sedgefieldEvent?.location || 'Sedgefield, South Africa'}
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {eventTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={index === 0 ? "text-primary border-primary bg-primary/10" : "text-foreground border-border"}
                >
                  {index === 0 && <Award className="w-4 h-4 mr-2" />}
                  {index === 1 && <Route className="w-4 h-4 mr-2" />}
                  {index === 2 && <Mountain className="w-4 h-4 mr-2" />}
                  {index === 3 && <TreePine className="w-4 h-4 mr-2" />}
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="prose prose-invert max-w-none mb-12">
            <p className="text-center mb-8">
              {sedgefieldEvent?.description || "The Garden Route of the Western Cape in South Africa hosts the Sedgefield 500. On this epic journey, you will enjoy unparalleled natural beauty that very few places can offer. Every twist and turn gives something special, offering mixed landscapes that very few places in the world can compare to. From the sandy beaches of the Indian Ocean to the lush forests of the South Africa Garden route, there’s always something to enjoy, and the surroundings change as you progress kilometer after kilometer."}
            </p>

            {sedgefieldEvent?.long_description && (
              <p className="text-center mb-8">
                {sedgefieldEvent.long_description}
              </p>
            )}
          </div>

          <div className="mb-12">
            <EventProgressButton
              eventName="Sedgefield 500"
              onEnterEvent={onEnterEvent}
            />
          </div>
        </div>
      </div>

      {/* Route Section */}
      <div className="py-12">
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="mb-6">Route</h2>
            {sedgefieldEvent?.route_description ? (
              <div className="whitespace-pre-line">
                {sedgefieldEvent.route_description}
              </div>
            ) : (
              <>
                <p className="mb-6">
                  The Sedgefield 500 ultra gravel bikepacking race across the Garden Route is an epic journey of endurance and discovery that will leave you inspired and in awe of the natural beauty of South Africa.
                </p>

                <p className="mb-4">
                  This incredible race takes you through some of the most breathtaking scenery on the planet, from lush forests to pristine beaches, and everything in between. As you cycle your way through the Garden Route, you will encounter challenges that will test your physical and mental limits.
                </p>

                <p className="mb-4">
                  The rugged terrain, steep climbs, and challenging descents will push you to your limits, but with each pedal stroke, you will feel a sense of accomplishment and satisfaction that can only be gained through perseverance and determination.
                </p>

                <p className="mb-6">
                  With a maximum limit of only 13 participants and a route made by a local expert, it will give you the best of the region and test you like no other ride. You might be there for a long weekend of riding or there to race to the finish. Choose your challenge.
                </p>

                <p>
                  No matter what brings you to the Sedgefield 500, it is much more than just a bike ride. It’s an odyssey of endurance and a journey of self-discovery in South Africa. It will leave you inspired, invigorated, and changed forever!
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Route Highlights */}
        <div className="mb-12">
          <h2 className="mb-8 text-center">Route Highlights</h2>

          <div className="flex gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
            {routeHighlights.map((highlight, index) => (
              <Card key={index} className="w-80 flex-shrink-0 snap-start md:w-auto">
                <CardContent className="p-6">
                  <h3 className="mb-4">{highlight.title}</h3>
                  <p className="whitespace-pre-line">
                    {highlight.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Event Details */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="mb-4">{eventTags.join(' ')}</h2>
              <div className="text-4xl font-bold text-primary mb-2">{sedgefieldEvent?.distance || '500km'}</div>
              <p className="text-muted-foreground">{eventTags[0] || 'Unsupported'} adventure</p>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-center">
                {sedgefieldEvent?.event_rules || "No aid stations, no route markings—just you and your bike. Follow the GPX route or make it your own. Choose your challenge: ride solo and chase the record or tour with friends before the cut-off."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <EventProgressButton
          eventName="Sedgefield 500"
          onEnterEvent={onEnterEvent}
        />
      </div>
    </div>
  );
}