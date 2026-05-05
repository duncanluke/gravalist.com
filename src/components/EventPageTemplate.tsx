import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Route, Mountain, TreePine, Award, ChevronDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { useWindowScroll } from 'react-use';

interface TagIconProps {
  tag: string;
}

const getTagIcon = (tag: string) => {
  const lowerTag = tag.toLowerCase();
  if (lowerTag === 'unsupported') return Award;
  if (lowerTag === 'ultracycling') return Route;
  if (lowerTag === 'gravel') return Mountain;
  if (lowerTag === 'bikepacking') return TreePine;
  return Route; // default
};

export interface EventPageTemplateProps {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  distance?: number | string;
  heroImage: string;
  tags?: string[];
  descriptionContent: React.ReactNode;
  routeHighlightsContent: React.ReactNode;
  actionComponent: React.ReactNode;
}

export function EventPageTemplate({
  title,
  date,
  time,
  location,
  distance,
  heroImage,
  tags = ['Unsupported', 'Ultracycling', 'Gravel', 'Bikepacking'],
  descriptionContent,
  routeHighlightsContent,
  actionComponent,
}: EventPageTemplateProps) {
  const { y } = useWindowScroll();
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  // Show sticky CTA once the user scrolls past the hero header
  useEffect(() => {
    if (y > 400) {
      setShowStickyCTA(true);
    } else {
      setShowStickyCTA(false);
    }
  }, [y]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Hero Section */}
      <div 
        className="relative h-[80vh] min-h-[500px] w-full flex items-end justify-center pb-16 overflow-hidden"
      >
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            transform: `translateY(${y * 0.3}px)` // Parallax effect
          }} 
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent" />
        
        <div className="relative z-20 container px-4 sm:px-6 flex flex-col items-center text-center space-y-6">
          <Badge className="bg-primary/20 text-primary border-primary hover:bg-primary/30 uppercase tracking-widest text-xs px-3 py-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Epic Gravalist Event
          </Badge>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter drop-shadow-lg text-white">
            {title}
          </h1>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 text-sm sm:text-base font-medium text-white/90">
            {date && (
              <div className="flex items-center backdrop-blur-sm bg-black/30 px-4 py-2 rounded-full border border-white/10">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                {date}
              </div>
            )}
            {time && (
              <div className="flex items-center backdrop-blur-sm bg-black/30 px-4 py-2 rounded-full border border-white/10">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                {time}
              </div>
            )}
            {location && (
              <div className="flex items-center backdrop-blur-sm bg-black/30 px-4 py-2 rounded-full border border-white/10">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                {location}
              </div>
            )}
          </div>
          
          <ChevronDown className="w-8 h-8 text-primary animate-bounce mt-8 opacity-70" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 -mt-8 relative z-30 space-y-16 pb-32">
        
        {/* Info Grid Layer */}
        <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
          <CardContent className="p-8 sm:p-12">
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {tags.map((tag, idx) => {
                const Icon = getTagIcon(tag);
                return (
                  <Badge key={idx} variant="outline" className="text-foreground border-white/20 bg-background/50 px-4 py-2 text-sm backdrop-blur-md">
                    <Icon className="w-4 h-4 mr-2" />
                    {tag === 'Ultracycling' && distance ? `${distance}km ${tag}` : tag}
                  </Badge>
                );
              })}
            </div>
            
            <div className="prose prose-lg prose-invert max-w-4xl mx-auto space-y-6 text-foreground/90 leading-relaxed font-light">
              {descriptionContent}
            </div>
            
            <div className="mt-12 flex justify-center">
              {actionComponent}
            </div>
          </CardContent>
        </Card>

        {/* Route Highlights Layer */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center tracking-tight">Route Highlights</h2>
          {routeHighlightsContent}
        </div>
        
        {/* Final CTA Banner */}
        <Card className="bg-primary/10 border-primary/20 backdrop-blur-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent z-0" />
          <CardContent className="p-12 text-center relative z-10">
            <h2 className="text-3xl font-black mb-4 uppercase tracking-wider">Are you ready?</h2>
            <div className="text-4xl sm:text-5xl font-black text-primary mb-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <span>{distance}km</span>
              <span className="text-muted-foreground text-xl sm:text-3xl font-medium tracking-normal">Unsupported Adventure</span>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-6 mb-10 text-lg">
              No aid stations, no route markings—just you and your bike. Follow the GPX route or make it your own. Choose your challenge: break the record or enjoy a multi-day tour.
            </p>
            {actionComponent}
          </CardContent>
        </Card>
      </div>

      {/* Sticky Mobile/Desktop Action Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 p-4 transform transition-transform duration-500 ease-in-out ${
          showStickyCTA ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="container max-w-4xl mx-auto">
          <div className="bg-background/90 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left flex-1 w-full max-w-xs flex flex-row items-center justify-center sm:justify-start">
              <span className="font-bold text-lg mb-1 sm:mb-0 mr-3 hidden sm:block">{title} Entry</span>
            </div>
            <div className="flex-1 right-0">
               {actionComponent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
