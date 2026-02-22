import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, MapPin, Route, Mountain, TreePine, Award } from 'lucide-react';
import { EventProgressButton } from './EventProgressButton';
import { useEvents } from '../hooks/useEvents';
import { Event } from '../utils/supabase/client';
// Using the same event image as placeholder - can be updated with event-specific image later
import logoImage from '@/assets/logo.png';

interface Franschhoek500PageProps {
  onEnterEvent: () => void;
}

export function Franschhoek500Page({ onEnterEvent }: Franschhoek500PageProps) {
  const { events, loading, error } = useEvents();
  const [franschhoekEvent, setFranschhoekEvent] = useState<Event | null>(null);

  // Find the Franschhoek event in the database
  useEffect(() => {
    if (events && events.length > 0) {
      const event = events.find(e =>
        e.name.toLowerCase().includes('franschhoek') ||
        e.slug?.toLowerCase().includes('franschhoek')
      );
      setFranschhoekEvent(event || null);
    }
  }, [events]);

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ride details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load ride details</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Event not found - show fallback content
  if (!franschhoekEvent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Franschhoek event not found</p>
          <p className="text-sm text-muted-foreground">The event may not be published yet or may have been removed.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="py-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src={logoImage}
                alt={`${franschhoekEvent.name} Symbol`}
                className="h-24 w-auto"
              />
            </div>

            <h1 className="mb-4">{franschhoekEvent.name}</h1>

            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Badge variant="outline" className="text-foreground border-border">
                <Calendar className="w-4 h-4 mr-2" />
                {formatEventDate(franschhoekEvent.event_date)}
              </Badge>
              {franschhoekEvent.start_time && (
                <Badge variant="outline" className="text-foreground border-border">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatEventTime(franschhoekEvent.start_time)}
                </Badge>
              )}
              {franschhoekEvent.location && (
                <Badge variant="outline" className="text-foreground border-border">
                  <MapPin className="w-4 h-4 mr-2" />
                  {franschhoekEvent.location}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {getEventTags(franschhoekEvent.event_tags).map((tag, index) => {
                const isFirstTag = index === 0;
                const IconComponent = tag.toLowerCase() === 'unsupported' ? Award :
                  tag.toLowerCase() === 'ultracycling' ? Route :
                    tag.toLowerCase() === 'gravel' ? Mountain :
                      tag.toLowerCase() === 'bikepacking' ? TreePine : Route;

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
            {franschhoekEvent.description ? (
              <p className="text-center mb-8">
                {franschhoekEvent.description}
              </p>
            ) : (
              <>
                <p className="text-center mb-8">
                  In the Western Cape of South Africa, where whispers of tales of centuries past are spoken, a different adventure unfolds. Welcome to the Gravalist Franschhoek 500 bikepacking event. This isn’t your typical wine tour but a daring exploration of beautiful gravel roads. The challenge is a test of grit, determination, endurance, and skill.
                </p>

                <p className="text-center mb-8">
                  You must conquer testing terrain and dig deep to get the best of your ability. With only 150 km on the tarmac, the route is dusty, and the road is not always smooth, but nothing good comes easy. It’s not just a test of just how well you can ride a bike. It will be a logistical challenge to ensure correct resupplying, know your route, and conserve your energy for the climbs that will rattle your legs. You will need to calculate your moves wisely.
                </p>

                <p className="text-center mb-8">
                  The race takes place during the busy season in the Western Cape. The ride may be tough, but you get to enjoy the region's electric air and high energy. You get to embrace the sights and sounds of a dynamic landscape in peak season. The distance is 500 km, and we only allow 13 participants to enter. The field is small, and nobody's adventure is going to be the same. You might be there to enjoy your surroundings or might want to push your body to the limit. The event is yours to enjoy. You all will be self-sufficient, and the challenge is you vs you.
                </p>
              </>
            )}
          </div>

          <div className="text-center mb-12">
            <Button
              size="lg"
              onClick={onEnterEvent}
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
              Welcome to the Franschhoek 500 Ultra Cycling Bikepacking Gravel Cycle Event! This 0 - 3 day cycling adventure is set to take place in December, and it promises to be an experience of a lifetime. The route will take you through some of the most picturesque and awe-inspiring landscapes that the Western Cape has to offer.
            </p>

            <p className="mb-4">
              Starting in Franschhoek, you will head down the hemel-en-aarde valley, passing through scenic vineyards and orchards before making your way to Stanford. From there, the route will take you on a long and winding journey around the valley, passing through small towns and villages, and showcasing the natural beauty of the area.
            </p>

            <p className="mb-4">
              The final stretch of the route takes you over the famous Franschhoek Pass, offering breathtaking views of the surrounding mountains and valleys. This challenging climb will test your stamina and endurance, but the sense of accomplishment you will feel at the top will make it all worth it.
            </p>

            <p className="mb-6">
              Throughout the event, you will have the opportunity to enjoy the camaraderie of your fellow cyclists, as well as the chance to experience the hospitality and charm of the towns and villages you pass through.
            </p>

            <p>
              Whether you are an experienced cyclist looking for a new challenge or a newcomer to the sport, the Franschhoek 500 Ultra Cycling Bikepacking Gravel Cycle Event is the perfect opportunity to push yourself to new heights and create lasting memories. Don't miss out on this incredible adventure.
            </p>
          </CardContent>
        </Card>

        {/* Route Highlights */}
        <div className="mb-12">
          <h2 className="mb-8 text-center">Route Highlights</h2>

          <div className="grid gap-8 md:grid-cols-3">
            {franschhoekEvent.event_highlights && franschhoekEvent.event_highlights.length > 0 ? (
              // Use database highlights if available
              franschhoekEvent.event_highlights
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
              // Fallback to original hardcoded highlights if no database highlights
              <>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-4">Franschhoek, Summer Time and Wine</h3>
                    <p className="mb-4">
                      Franschhoek is a beautiful town located in the Western Cape province of South Africa. Its name translates to "French corner" in Afrikaans, which is a nod to its rich history and cultural heritage. The town was originally settled by French Huguenot refugees who fled religious persecution in France in the late 17th century. They brought with them their winemaking expertise and helped to establish the Cape's wine industry, which is still thriving to this day.
                    </p>
                    <p className="mb-4">
                      In addition to its strong ties to France, Franschhoek also has a rich cycling history. The town is home to one of the oldest and most prestigious cycling events in the country, the Cape Town Cycle Tour. The shape of the valley surrounding Franschhoek is also unique and has played a significant role in the town's history.
                    </p>
                    <p>
                      The valley is long and narrow, with steep mountains rising up on either side. This geography made it an ideal hiding place for the Huguenots, who were seeking refuge from persecution.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-4">Descent to the ocean, only to return. The long way around</h3>
                    <p className="mb-4">
                      Embarking from the picturesque Van der Stel pass, journeying across to charming Hermanus, then descending to the quaint town of Malgas. Finally, circling back around to the historic Swellendam.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="mb-4">Greyton return</h3>
                    <p className="mb-4">
                      Arrive with only 80kms to go the reward is some majestic gravel and enough climbing to ensure you empty the tank over the 500kms.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Event Details */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="mb-4">{getEventTags(franschhoekEvent.event_tags).join(' ')}</h2>
              <div className="text-4xl font-bold text-primary mb-2">
                {franschhoekEvent.distance_km ? `${franschhoekEvent.distance_km}km` : '500km'}
              </div>
              <p className="text-muted-foreground">
                {franschhoekEvent.difficulty_level ? `${franschhoekEvent.difficulty_level} adventure` : 'Unsupported adventure'}
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
            onClick={onEnterEvent}
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