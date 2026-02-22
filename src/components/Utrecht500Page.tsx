import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, MapPin, Route, Mountain, TreePine, Award } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { SessionManager } from '../utils/sessionManager';
import { STEP_IDS } from '../constants/app';
import { EventProgressButton } from './EventProgressButton';
import eventImage from '@/assets/generic-1.png';

interface Utrecht500PageProps {
  onEnterEvent: () => void;
}

export function Utrecht500Page({ onEnterEvent }: Utrecht500PageProps) {
  const { events, loading: eventsLoading } = useEvents();
  
  // Find the Utrecht 500 event from the database
  const utrecht500Event = events.find(event => 
    event.name === 'Utrecht 500' || event.slug === 'utrecht-500'
  );

  // Progress-aware handler for Join Adventure button
  const handleJoinAdventure = () => {
    // Use the existing onEnterEvent function which already has progress-aware logic
    onEnterEvent();
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="py-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src={eventImage} 
                alt="Utrecht 500 Bridge Symbol" 
                className="h-24 w-auto"
              />
            </div>
            
            <h1 className="mb-4">Utrecht 500</h1>
            
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Badge variant="outline" className="text-foreground border-border">
                <Calendar className="w-4 h-4 mr-2" />
                19th September 2025
              </Badge>
              <Badge variant="outline" className="text-foreground border-border">
                <Clock className="w-4 h-4 mr-2" />
                06:00
              </Badge>
              <Badge variant="outline" className="text-foreground border-border">
                <MapPin className="w-4 h-4 mr-2" />
                Utrecht, The Netherlands
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge variant="outline" className="text-primary border-primary bg-primary/10">
                <Award className="w-4 h-4 mr-2" />
                Unsupported
              </Badge>
              <Badge variant="outline" className="text-foreground border-border">
                <Route className="w-4 h-4 mr-2" />
                {eventsLoading ? '...' : `${utrecht500Event?.distance_km || 500}km`}
              </Badge>
              <Badge variant="outline" className="text-foreground border-border">
                <Route className="w-4 h-4 mr-2" />
                Ultracycling
              </Badge>
              <Badge variant="outline" className="text-foreground border-border">
                <Mountain className="w-4 h-4 mr-2" />
                Gravel
              </Badge>
              <Badge variant="outline" className="text-foreground border-border">
                <TreePine className="w-4 h-4 mr-2" />
                Bikepacking
              </Badge>
            </div>
          </div>

          <div className="prose prose-invert max-w-none mb-12">
            <p className="text-center mb-8">
              Pedal your way through serene forests, picturesque dijks, and iconic landmarks as you traverse the diverse terrain of the Dutch countryside. With each mile, you'll uncover hidden gems and unforgettable vistas that will leave you in awe. Whether you're a seasoned ultra cyclist or a first-time participant, this event is your chance to push past your limits and achieve something extraordinary.
            </p>
            
            <p className="text-center mb-8">
              With fellow riders and the thrill of the open road, you'll discover what you're truly capable of. Are you ready to embark on this epic cycling odyssey through the Netherlands? Don't miss your chance to be part of an unforgettable journey that will challenge, inspire, and empower you like never before. Sign up now and prepare to experience the thrill of a lifetime!
            </p>
          </div>

          <div className="mb-12">
            <EventProgressButton 
              eventName="Utrecht 500"
              onEnterEvent={handleJoinAdventure}
            />
          </div>
        </div>
      </div>

      {/* Route Section */}
      <div className="py-12">
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="mb-6">Route</h2>
            <p className="mb-6">
              Get ready for an adrenaline-packed journey through the Netherlands, where every pedal stroke unveils excitement and natural beauty!
            </p>
            
            <p className="mb-4">
              Embark from the majestic Kasteel Rhijnauwen, winding through forests and gravel paths, all the way to the vibrant streets of Amsterdam. Feel the rush as you cycle along sandy beaches, exploring charming towns like Enkhuizen.
            </p>
            
            <p className="mb-4">
              Enjoy the wind in your hair as you conquer MTB trails and scenic dijks, immersing yourself in the serene landscapes of Lelystad and Hattem. Discover hidden gems and royal domains, with each turn revealing the Netherlands' natural wonders.
            </p>
            
            <p className="mb-6">
              Explore technical trails and forested pathways as you journey towards Arnhem. Winding roads and panoramic views, there's never a dull moment in this cycling paradise of the Netherlands.
            </p>
            
            <p>
              Are you ready to pedal your way through windmills and flower fields? Don't miss out on this unforgettable cycling adventure where every mile brings new discoveries and endless memories!
            </p>
          </CardContent>
        </Card>

        {/* Route Highlights */}
        <div className="mb-12">
          <h2 className="mb-8 text-center">Route Highlights</h2>
          
          <div className="flex gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
            <Card className="w-80 flex-shrink-0 snap-start md:w-auto">
              <CardContent className="p-6">
                <h3 className="mb-4">Enkhuizen</h3>
                <p className="mb-4">
                  Pedal back in time to the charming port town of Enkhuizen, where every cobblestone street tells a story of seafaring adventures and maritime glory.
                </p>
                <p className="mb-4">
                  From its well-preserved 17th-century architecture to its bustling harbor filled with historic ships, Enkhuizen offers a captivating glimpse into the Netherlands' rich maritime past. Get ready to immerse yourself in a world where time seems to stand still.
                </p>
                <p>
                  Cycle along scenic coastal routes, where the sparkling waters of the IJsselmeer beckon and the salty sea breeze invigorates your senses. Whether you're tracing the footsteps of ancient mariners or forging new paths of your own, Enkhuizen promises an unforgettable cycling experience that combines history, adventure, and the natural beauty of the Dutch countryside.
                </p>
              </CardContent>
            </Card>

            <Card className="w-80 flex-shrink-0 snap-start md:w-auto">
              <CardContent className="p-6">
                <h3 className="mb-4">Amsterdam</h3>
                <p className="mb-4">
                  Saddle up and explore the vibrant city of Amsterdam, where cycling isn't just a mode of transportation—it's a way of life. Get ready to discover why Amsterdam is renowned as one of the most bike-friendly cities in the world.
                </p>
                <p className="mb-4">
                  From its iconic canals and historic landmarks to its bustling streets and lively neighborhoods, Amsterdam is a city steeped in rich history and cultural diversity. As you pedal through Amsterdam's charming streets, you'll be greeted by picturesque row houses, bustling markets, and quaint cafes.
                </p>
                <p>
                  Whether you're cruising along the city's iconic bike paths or venturing off the beaten path to uncover hidden gems, Amsterdam promises an unforgettable cycling experience that combines urban adventure with the laid-back charm of Dutch culture.
                </p>
              </CardContent>
            </Card>

            <Card className="w-80 flex-shrink-0 snap-start md:w-auto">
              <CardContent className="p-6">
                <h3 className="mb-4">National Park Veluwezoom</h3>
                <p className="mb-4">
                  Gear up for an unforgettable cycling adventure in the heart of National Park Veluwezoom, where forests, rolling hills, and heathland vistas await your exploration.
                </p>
                <p className="mb-4">
                  With its dense woodlands, meandering streams, and diverse wildlife, Veluwezoom offers a sanctuary for nature enthusiasts and cyclists alike. Take a deep breath and let the tranquil beauty of the park wash over you as you ride through its pristine landscapes.
                </p>
                <p>
                  Keep your eyes peeled for glimpses of red deer, wild boar, and other native species as you navigate the park's winding trails. With every turn, you'll be reminded of the incredible biodiversity that calls Veluwezoom home.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Details */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="mb-4">Unsupported Ultracycling Gravel Bikepacking</h2>
              <div className="text-4xl font-bold text-primary mb-2">500km</div>
              <p className="text-muted-foreground">Unsupported adventure</p>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-center">
                No aid stations, no route markings—just you and your bike. Follow the GPX route or make it your own. Choose your challenge: ride solo and chase the record or tour with friends before the cut-off.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <EventProgressButton 
          eventName="Utrecht 500"
          onEnterEvent={handleJoinAdventure}
        />
      </div>
    </div>
  );
}