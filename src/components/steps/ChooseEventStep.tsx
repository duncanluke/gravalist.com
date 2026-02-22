import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, MapPin, Mountain, Clock } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  date: string;
  distance: string;
  elevation: string;
  location: string;
  difficulty: 'Moderate' | 'Hard' | 'Extreme';
}

interface ChooseEventStepProps {
  onEventSelect: (eventId: string) => void;
}

export function ChooseEventStep({ onEventSelect }: ChooseEventStepProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const events: Event[] = [
    {
      id: 'peak-district-300',
      name: 'Peak District 300',
      date: 'June 15, 2024',
      distance: '300km',
      elevation: '4,500m',
      location: 'Peak District, UK',
      difficulty: 'Hard'
    },
    {
      id: 'cotswolds-200',
      name: 'Cotswolds 200',
      date: 'July 20, 2024',
      distance: '200km',
      elevation: '2,800m',
      location: 'Cotswolds, UK',
      difficulty: 'Moderate'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Moderate': return 'bg-[#33D17A] text-black';
      case 'Hard': return 'bg-[#F4BD50] text-black';
      case 'Extreme': return 'bg-[#FF5A5A] text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Choose Your Ride</h2>
        <p className="text-sm text-muted-foreground">
          Select an ultra ride to begin your journey
        </p>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <Card 
            key={event.id}
            className={`p-4 cursor-pointer transition-all duration-150 border ${
              selectedEvent === event.id 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedEvent(event.id)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{event.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </div>
                </div>
                <Badge className={getDifficultyColor(event.difficulty)}>
                  {event.difficulty}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.distance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-muted-foreground" />
                  <span>{event.elevation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>46h cut-off</span>
                </div>
              </div>

              {selectedEvent === event.id && (
                <div className="pt-2 border-t border-border">
                  <Badge variant="outline" className="border-primary text-primary">
                    Selected
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedEvent && (
        <Button 
          onClick={() => onEventSelect(selectedEvent)}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Continue with Selected Event
        </Button>
      )}
    </div>
  );
}