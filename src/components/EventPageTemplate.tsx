import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Route, Mountain, TreePine, Award, ChevronDown, Lock, Download, FileSignature, HelpCircle, Map } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { useWindowScroll } from 'react-use';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { apiClient } from '../utils/supabase/client';
import { Button } from './ui/button';

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
  const { profile, session } = useAuth();
  const { events } = useEvents();
  const [downloadingGpx, setDownloadingGpx] = useState(false);

  const isPremium = profile?.is_premium_subscriber === true;

  const handleDownloadGpx = async () => {
    if (!session?.access_token) return;
    try {
      setDownloadingGpx(true);
      const event = events.find(e => e.name === title);
      if (!event) throw new Error("Event not found");

      const { downloadUrl } = await apiClient.getGpxDownloadUrl(event.id);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Gravalist_${title.replace(/\s+/g, '_')}_Route.gpx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download GPX: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloadingGpx(false);
    }
  };

  const handleDownloadIndemnity = () => {
    window.open('https://www.jotform.com/sign/252482044276053/invite/01k4f7zxgr0bb5c2048f886a3b', '_blank');
  };

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
        
        {/* Ride Briefing / Gated Details (Stacked) */}
        <div className="max-w-6xl mx-auto space-y-24 mt-24">
          
          {/* Section 1: GPS */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
             <div className="flex-1 space-y-6">
                <div className="h-20 w-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center">
                   <Download className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">Official GPX File</h2>
                <p className="text-xl text-muted-foreground leading-relaxed font-light">
                  The exact, meticulously mapped route. Having the official GPX file is your only way to navigate this unsupported challenge. Accurate and carefully checked for anomalies.
                </p>
             </div>
             
             <div className="flex-1 w-full">
                <Card className={`relative overflow-hidden transition-all duration-700 h-full min-h-[300px] flex flex-col justify-center border-white/5 shadow-2xl ${!isPremium ? 'bg-black/40 backdrop-blur-md' : 'bg-card/40 backdrop-blur-2xl border-primary/20 shadow-[0_0_50px_rgba(255,87,34,0.1)]'}`}>
                  {!isPremium && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[6px] transition-all hover:bg-black/70">
                    <Lock className="w-16 h-16 text-white/50 mb-6 drop-shadow-2xl" />
                    <span className="text-base font-bold tracking-[0.2em] uppercase text-white/90">Entry Required</span>
                    <span className="text-sm text-white/50 mt-2 font-medium">Unlock to view details</span>
                  </div>}
                  <CardContent className={`p-8 md:p-12 flex flex-col items-center justify-center h-full bg-gradient-to-br from-white/5 to-transparent w-full ${!isPremium ? 'opacity-20 filter blur-[8px] select-none pointer-events-none' : ''}`}>
                    {isPremium ? (
                      <Button onClick={handleDownloadGpx} disabled={downloadingGpx} className="w-full sm:w-auto py-8 px-10 text-xl font-bold bg-white text-black hover:bg-neutral-200 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                        {downloadingGpx ? 'Downloading...' : 'Get Route Data'}
                      </Button>
                    ) : (
                      <div className="space-y-4 w-full">
                        <div className="h-4 bg-white/20 rounded w-5/6 mx-auto" />
                        <div className="h-4 bg-white/20 rounded w-3/4 mx-auto" />
                        <div className="h-20 bg-white/10 rounded-xl w-full mt-8" />
                      </div>
                    )}
                  </CardContent>
                </Card>
             </div>
          </div>

          {/* Section 2: Indemnity */}
          <div className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-16 items-center">
             <div className="flex-1 space-y-6">
                <div className="h-20 w-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center">
                   <FileSignature className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">Indemnity & Waiver</h2>
                <p className="text-xl text-muted-foreground leading-relaxed font-light">
                  Essential legal risk acknowledgement. This event is entirely self-supported and the risk rests solely on your shoulders. You cannot start without signing.
                </p>
             </div>
             
             <div className="flex-1 w-full">
                <Card className={`relative overflow-hidden transition-all duration-700 h-full min-h-[300px] flex flex-col justify-center border-white/5 shadow-2xl ${!isPremium ? 'bg-black/40 backdrop-blur-md' : 'bg-card/40 backdrop-blur-2xl border-primary/20 shadow-[0_0_50px_rgba(255,87,34,0.1)]'}`}>
                  {!isPremium && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[6px] transition-all hover:bg-black/70">
                    <Lock className="w-16 h-16 text-white/50 mb-6 drop-shadow-2xl" />
                    <span className="text-base font-bold tracking-[0.2em] uppercase text-white/90">Entry Required</span>
                    <span className="text-sm text-white/50 mt-2 font-medium">Unlock to view details</span>
                  </div>}
                  <CardContent className={`p-8 md:p-12 flex flex-col items-center justify-center h-full bg-gradient-to-br from-white/5 to-transparent w-full ${!isPremium ? 'opacity-20 filter blur-[8px] select-none pointer-events-none' : ''}`}>
                    {isPremium ? (
                      <Button onClick={handleDownloadIndemnity} variant="outline" className="w-full sm:w-auto py-8 px-10 text-xl font-bold border-white/20 hover:bg-white/10 rounded-2xl bg-black/40 shadow-xl">
                        Sign Official Indemnity
                      </Button>
                    ) : (
                      <div className="space-y-4 w-full">
                         <div className="h-4 bg-white/20 rounded w-3/4 mx-auto" />
                         <div className="h-20 bg-white/10 rounded-xl w-full mt-8" />
                      </div>
                    )}
                  </CardContent>
                </Card>
             </div>
          </div>

          {/* Section 3: Start Location */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
             <div className="flex-1 space-y-6">
                <div className="h-20 w-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center">
                   <Map className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">Hidden Start Location</h2>
                <p className="text-xl text-muted-foreground leading-relaxed font-light">
                  The exact undisclosed start point coordinates and parking logistics. Be prepared to roll out with zero fanfare.
                </p>
             </div>
             
             <div className="flex-1 w-full">
                <Card className={`relative overflow-hidden transition-all duration-700 h-full min-h-[300px] flex flex-col justify-center border-white/5 shadow-2xl ${!isPremium ? 'bg-black/40 backdrop-blur-md' : 'bg-card/40 backdrop-blur-2xl border-primary/20 shadow-[0_0_50px_rgba(255,87,34,0.1)]'}`}>
                  {!isPremium && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[6px] transition-all hover:bg-black/70">
                    <Lock className="w-16 h-16 text-white/50 mb-6 drop-shadow-2xl" />
                    <span className="text-base font-bold tracking-[0.2em] uppercase text-white/90">Entry Required</span>
                    <span className="text-sm text-white/50 mt-2 font-medium">Unlock to view details</span>
                  </div>}
                  <CardContent className={`p-8 md:p-12 flex flex-col items-center justify-center h-full bg-gradient-to-br from-white/5 to-transparent w-full ${!isPremium ? 'opacity-20 filter blur-[8px] select-none pointer-events-none' : ''}`}>
                    {isPremium ? (
                      <div className="bg-black/80 p-8 rounded-3xl border border-white/10 font-mono text-center w-full shadow-2xl">
                        <p className="text-primary text-xl md:text-2xl font-bold mb-4 tracking-widest text-[#ff6a00] drop-shadow-[0_0_15px_rgba(255,106,0,0.5)]">COORDS: -33.9188, 19.1159</p>
                        <p className="text-white/80 text-lg">PARKING: Town Hall Lot A</p>
                      </div>
                    ) : (
                      <div className="space-y-4 w-full">
                        <div className="h-8 bg-white/20 rounded w-3/4 mx-auto mb-6" />
                        <div className="h-6 bg-white/20 rounded w-1/2 mx-auto" />
                      </div>
                    )}
                  </CardContent>
                </Card>
             </div>
          </div>

          {/* Section 4: Tips */}
          <div className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-16 items-center">
             <div className="flex-1 space-y-6">
                <div className="h-20 w-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center">
                   <HelpCircle className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">Insider Field Guide</h2>
                <p className="text-xl text-muted-foreground leading-relaxed font-light">
                  Critical terrain warnings, water resupply coordinates, and tire choice recommendations straight from the scouts who mapped it.
                </p>
             </div>
             
             <div className="flex-1 w-full">
                <Card className={`relative overflow-hidden transition-all duration-700 h-full min-h-[300px] flex flex-col justify-center border-white/5 shadow-2xl ${!isPremium ? 'bg-black/40 backdrop-blur-md' : 'bg-card/40 backdrop-blur-2xl border-primary/20 shadow-[0_0_50px_rgba(255,87,34,0.1)]'}`}>
                  {!isPremium && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[6px] transition-all hover:bg-black/70">
                    <Lock className="w-16 h-16 text-white/50 mb-6 drop-shadow-2xl" />
                    <span className="text-base font-bold tracking-[0.2em] uppercase text-white/90">Entry Required</span>
                    <span className="text-sm text-white/50 mt-2 font-medium">Unlock to view details</span>
                  </div>}
                  <CardContent className={`p-8 md:p-12 flex flex-col items-center justify-center h-full bg-gradient-to-br from-white/5 to-transparent w-full ${!isPremium ? 'opacity-20 filter blur-[8px] select-none pointer-events-none' : ''}`}>
                    {isPremium ? (
                      <div className="bg-black/80 p-6 md:p-8 rounded-3xl border border-white/10 space-y-4 w-full shadow-2xl">
                        <div className="flex gap-4 items-center bg-white/5 p-4 rounded-xl">
                          <span className="text-4xl">💧</span>
                          <div className="text-left">
                            <p className="font-bold text-white text-lg">KM 142</p>
                            <p className="text-muted-foreground">Reliable farm tap (bring filter)</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-center bg-white/5 p-4 rounded-xl">
                          <span className="text-4xl">🪨</span>
                          <div className="text-left">
                            <p className="font-bold text-white text-lg">KM 215-240</p>
                            <p className="text-muted-foreground">Brutal washboard, drop pressure</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 w-full">
                        <div className="h-24 bg-white/10 rounded-2xl w-full" />
                        <div className="h-24 bg-white/10 rounded-2xl w-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>
             </div>
          </div>

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
