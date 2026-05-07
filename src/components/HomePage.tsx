import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Clock, Award, ArrowRight, Calendar, Globe, Star, Trophy, Shield, Play, RotateCcw, Plus, Loader2, UserMinus, Info, User, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEvents } from '../hooks/useEvents';
import { SessionManager } from '../utils/sessionManager';
import { MyRegistrationsCard } from './MyRegistrationsCard';
import { WithdrawEventModal } from './modals/WithdrawEventModal';
import heroBackground from '@/assets/home-hero.png';
import heroBackground2 from '@/assets/home-bg-2.png';
import heroBackground3 from '@/assets/home-bg-3.png';
import heroBackgroundRides from '@/assets/rides-hero.png';
import newHeroBackgroundRides from '@/assets/new-rides-hero.png';
import { HeroSection } from './home/HeroSection';
import { GlobalMapSection } from './home/GlobalMapSection';

interface HomePageProps {
  onViewRides: () => void;
  onEventSelect?: (eventName: string) => void;
  onEnterEvent?: (eventName: string) => void;
  onNavigateToAddRoute?: () => void;
  userEmail?: string;
}

export function HomePage({ onViewRides, onEventSelect, onEnterEvent, onNavigateToAddRoute, userEmail }: HomePageProps) {
  const {
    events,
    loading,
    getCurrentStepForEvent,
    isEventCompleted
  } = useEvents();
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  // Withdrawal modal state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedEventForWithdrawal, setSelectedEventForWithdrawal] = useState<{ id: string; name: string } | null>(null);

  // Handle withdrawal success - no need to refresh all progress, it will refresh on next page load
  const handleWithdrawalSuccess = () => {
    // Just close the modal - progress will be refetched naturally when user navigates
    console.log('✅ Withdrawal successful');
  };

  // Get user's progress for each event (uses cached data only)
  const getUserProgress = (eventId: string, eventName: string) => {
    if (!userEmail) return null;

    const currentStep = getCurrentStepForEvent(eventId);
    const completed = isEventCompleted(eventId);

    // Check session for additional context
    const session = SessionManager.getSession();
    const sessionStep = (session?.currentEvent === eventName && session?.currentStepId >= 0)
      ? session.currentStepId
      : -1;

    // Use the higher of database step or session step
    let actualStep = currentStep;
    if (sessionStep >= 0) {
      actualStep = Math.max(currentStep, sessionStep);
    }

    // Don't show progress if user hasn't started
    if (actualStep <= 0 && !completed) return null;

    // Total steps: 0-17 = 18 steps total
    const totalSteps = 18;

    return {
      currentStep: actualStep,
      totalSteps,
      isCompleted: completed || actualStep >= 17,
      progressPercent: Math.min((actualStep / (totalSteps - 1)) * 100, 100)
    };
  };

  // Format date for display
  const formatEventDate = (eventDate: string) => {
    const date = new Date(eventDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format events for display
  const formatEventForDisplay = (event: any) => ({
    id: event.id,
    name: event.name,
    location: event.location || 'Location TBD',
    date: formatEventDate(event.event_date),
    description: event.description || 'An exciting ultra-distance cycling challenge.',
    highlights: event.event_highlights?.map((h: any) => h.title).filter(Boolean) || ['Epic cycling adventure'],
    distance_km: event.distance_km
  });

  return (
    <div className="min-h-screen bg-black text-foreground">

      {/* Hero Section & CTA */}
      <HeroSection
        userEmail={userEmail}
        onViewRides={() => {
          const ridesSection = document.getElementById('community-rides');
          ridesSection?.scrollIntoView({ behavior: 'smooth' });
        }}
        onRequestEmailInput={() => {
          window.dispatchEvent(new CustomEvent('requestEmailInput'));
        }}
      />

      {/* Existing Content Starts Here */}
      <div className="py-16 space-y-20 border-t border-primary/20">
        {/* Community Rides Section */}
        <section id="community-rides">
          {/* Rides Hero Section */}
          <div
            className="min-h-[50vh] flex items-center justify-center text-center px-6 py-32 relative overflow-hidden -mt-16 mb-16"
            style={{
              backgroundColor: '#000000'
            }}
          >
            {/* Dark overlay for base */}
            <div className="absolute inset-0 bg-black/70" />

            {/* Animated Background Topography/Image (Subtle) */}
            <div className="absolute inset-0 z-[1] opacity-20 pointer-events-none overflow-hidden flex items-center justify-center mix-blend-screen">
              <style>
                {`
                  @keyframes scrollMarquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                  .animate-scroll-marquee {
                    animation: scrollMarquee 40s linear infinite;
                  }
                  @media (max-width: 768px) {
                    .animate-scroll-marquee {
                      animation-duration: 20s;
                    }
                  }
                `}
              </style>
              
              {/* Massive Scrolling Typography Layer */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex min-w-[200%] animate-scroll-marquee whitespace-nowrap">
                <span className="text-[120px] md:text-[220px] font-black uppercase tracking-tighter text-transparent opacity-30 select-none px-4" style={{ WebkitTextStroke: '2px rgba(255, 255, 255, 0.5)' }}>
                  UNSUPPORTED • UNMAPPED • PURE GRAVEL •
                </span>
                <span className="text-[120px] md:text-[220px] font-black uppercase tracking-tighter text-transparent opacity-30 select-none px-4" style={{ WebkitTextStroke: '2px rgba(255, 255, 255, 0.5)' }}>
                  UNSUPPORTED • UNMAPPED • PURE GRAVEL •
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto space-y-8 relative z-10 px-4 md:px-0 mix-blend-exclusion">
              <h1 className="text-3xl md:text-5xl lg:text-6xl leading-tight font-extrabold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                We offer curated routes for those wanting to try bikepacking, ultra racing or an epic gravel day out.
              </h1>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full mt-6 mb-8" />
              <h2 className="text-xl md:text-3xl lg:text-4xl text-white/90 font-medium drop-shadow-md">
                The route can be attempted in 24 hours, or ridden as a bikepacking adventure for the Sunday 6pm cut-off, which is not as easy as it may sound.
              </h2>
            </div>
          </div>

          {/* My Registrations Section (only show if user is authenticated) */}
          {userEmail && (
            <section id="my-registrations" className="px-4 mb-12">
              <MyRegistrationsCard onEnterEvent={onEnterEvent} />
            </section>
          )}

          {/* Events Grid */}
          {/* Events Grid Wrapper */}
          {/* Scroll Indicator for Mobile */}
          <div className="flex md:hidden justify-center items-center gap-1.5 mb-2 mt-4 opacity-70">
            <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/30" />
            <div className="w-2 h-2 rounded-full bg-primary/40" />
            <div className="w-2 h-2 rounded-full bg-primary/20" />
            <span className="text-xs text-primary/60 ml-2 font-medium uppercase tracking-wider">Swipe</span>
          </div>
          <div className="py-8 pt-2 md:pt-8 relative min-h-[500px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-12 h-12 mx-auto text-primary opacity-80"
                  >
                    {/* Custom Brand Loading Spinner (e.g. geometric shape) */}
                    <circle cx="12" cy="12" r="10" strokeDasharray="15 30" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="6" strokeDasharray="10 20" strokeLinecap="round" />
                  </motion.svg>
                  <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">Loading routes...</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-12 md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 md:gap-8 md:overflow-x-visible md:pb-0 px-4 max-w-[1400px] mx-auto">
                {events.length > 0 ? events.filter(event => event.is_published).map((event) => {
                  const displayEvent = formatEventForDisplay(event);
                  const progress = getUserProgress(event.id, event.name);

                  return (
                    <motion.div 
                      key={event.id}
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0 w-[340px] md:w-auto h-full"
                    >
                      <Card
                        className="relative bg-[#0d0d0d] backdrop-blur-2xl border border-white/10 hover:border-primary/40 transition-all duration-500 overflow-hidden flex flex-col h-full rounded-[24px] shadow-2xl group cursor-pointer"
                        onClick={() => {
                          console.log('HomePage - Card clicked:', { eventId: event.id, eventName: event.name, eventSlug: event.slug });
                          onEventSelect?.(event.name);
                        }}
                      >
                        {/* Dynamic Background Effect */}
                        <div className="absolute inset-0 bg-cover bg-center opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700" style={{ backgroundImage: `url('/home-bg-2.png')` }} />
                        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <CardContent className="p-8 flex flex-col flex-1 relative z-10">
                        {/* Event Header */}
                        <div className="flex items-start justify-between mb-8 relative z-10">
                          <div>
                            <h3 className="text-3xl font-display font-bold mb-2 group-hover:text-primary transition-colors text-white">{displayEvent.name}</h3>
                            <div className="flex items-center gap-2 text-white/50">
                              <MapPin className="w-4 h-4 text-primary/70" />
                              <span className="text-sm font-medium">{displayEvent.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* High-end Stats Bar */}
                        <div className="grid grid-cols-2 gap-4 py-4 mb-6 border-y border-border/50 relative z-10">
                          <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Distance</span>
                            <span className="text-xl font-bold text-foreground">{displayEvent.distance_km || 500}<span className="text-sm font-normal text-muted-foreground ml-1">km</span></span>
                          </div>
                          <div className="flex flex-col items-center justify-center text-center border-l border-border/50">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-primary hidden sm:block" />
                              <span className="text-sm font-bold text-foreground">{displayEvent.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6 relative z-10 flex-grow">
                          <p className={`text-muted-foreground leading-relaxed ${!expandedDescriptions[displayEvent.name] ? 'line-clamp-4' : ''}`}>
                            {displayEvent.description}
                          </p>
                          {displayEvent.description.length > 200 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDescriptions(prev => ({ ...prev, [displayEvent.name]: !prev[displayEvent.name] }));
                              }}
                              className="text-primary hover:text-primary/80 text-sm mt-2 transition-colors font-medium"
                            >
                              {expandedDescriptions[displayEvent.name] ? 'Read less' : 'Read more...'}
                            </button>
                          )}
                        </div>

                        {/* Highlights (Compact) */}
                        <div className="mb-8 relative z-10">
                          <div className="flex flex-wrap gap-2">
                            {displayEvent.highlights.slice(0, 3).map((highlight, highlightIndex) => (
                              <Badge key={highlightIndex} variant="secondary" className="bg-secondary/50 text-secondary-foreground text-xs font-normal border-none">
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Progress Indicator & CTA Button */}
                        {(() => {
                          if (userEmail && progress) {
                            return (
                              <div className="space-y-3 relative z-10 mt-auto pt-4">
                                {/* Progress Bar */}
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress.progressPercent}%` }}
                                  />
                                </div>

                                {/* Continue/View Button */}
                                <Button
                                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEnterEvent?.(event.name);
                                  }}
                                >
                                  {progress.isCompleted ? (
                                    <>
                                      <Award className="w-4 h-4 mr-2" />
                                      View Completed Journey
                                    </>
                                  ) : (
                                    <>
                                      <RotateCcw className="w-4 h-4 mr-2" />
                                      Continue Journey
                                    </>
                                  )}
                                </Button>

                                {/* Withdrawal button - only show if not completed */}
                                {!progress.isCompleted && (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEventForWithdrawal({ id: event.id, name: event.name });
                                      setWithdrawModalOpen(true);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                    I cannot make it
                                  </Button>
                                )}
                              </div>
                            );
                          }

                          // Default premium button for unauthenticated users or users with no progress
                          return (
                            <div className="relative z-10 mt-auto pt-4 flex flex-col items-center">

                              <Button
                                className="w-full relative overflow-hidden bg-primary/90 hover:bg-primary text-primary-foreground font-semibold py-6 text-lg group transition-all duration-300 shadow-[0_0_15px_rgba(255,87,34,0.3)] hover:shadow-[0_0_25px_rgba(255,87,34,0.5)] border-none"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('HomePage - Get Access clicked:', { eventId: event.id, eventName: event.name });
                                  onEventSelect?.(event.name);
                                }}
                              >
                                <span className="relative z-10 flex items-center justify-center w-full">
                                  <MapPin className="w-5 h-5 mr-3" />
                                  {userEmail ? 'Get Route Access' : 'Enter'}
                                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
                                </span>

                                {/* Inner button glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/20 to-primary-foreground/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                              </Button>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              }) : (
                  <div className="col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-3 text-center py-16">
                    <div className="space-y-4">
                      <h3 className="text-xl text-muted-foreground">No routes available</h3>
                      <p className="text-muted-foreground">
                        Be the first to add a route to the community!
                      </p>
                      <Button
                        onClick={onNavigateToAddRoute}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Route
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </section>

        {/* Rider Stories Section - Editorial Layout */}
        <section className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight text-white mb-6">
              Riders Stories
            </h2>
            <p className="text-xl text-white/60 max-w-3xl leading-relaxed font-light">
              Through the brutal challenges faced during these ultra-endurance experiences,
              discover the raw truths riders uncovered about themselves out in the dirt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Story 1 - Large Feature */}
            <motion.div 
              whileHover={{ y: -5 }} 
              className="lg:col-span-2 bg-[#121212] border border-white/5 rounded-2xl p-10 flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full group-hover:bg-primary/10 transition-colors duration-700" />
              
              <Quote className="w-12 h-12 text-primary/30 mb-8" />
              <p className="text-2xl md:text-3xl font-display text-white mb-8 leading-tight">
                <span className="text-primary mr-1 hover-effect leading-[0]">"</span>
                I discovered that my mind would quit long before my body. Learning to push through that mental
                barrier at 300km changed everything about how I approach challenges.
              </p>
              
              <div className="flex items-center justify-between border-t border-white/10 pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#222] rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">SJ</span>
                  </div>
                  <div>
                    <p className="font-bold text-white tracking-wide">Sarah Jensen</p>
                    <p className="text-sm text-primary uppercase tracking-wider">Utrecht 500</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Story 2 - Standard Feature */}
            <motion.div 
              whileHover={{ y: -5 }} 
              className="bg-[#121212] border border-white/5 rounded-2xl p-8 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 blur-[50px] rounded-full" />
              
              <Quote className="w-8 h-8 text-white/20 mb-6" />
              <p className="text-lg text-white/80 mb-8 italic leading-relaxed font-light flex-1">
                "The silence and solitude revealed parts of myself I never knew existed.
                By kilometer 400, I wasn't racing anyone but having a conversation with my soul."
              </p>
              
              <div className="flex items-center gap-4 pt-6 mt-auto">
                <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center">
                  <span className="text-white/80 font-bold">MR</span>
                </div>
                <div>
                  <p className="font-bold text-white/90">Marcus Rodriguez</p>
                  <p className="text-xs text-white/50 uppercase tracking-widest">Sedgefield 500</p>
                </div>
              </div>
            </motion.div>

            {/* Story 3 - Standard Feature */}
            <motion.div 
              whileHover={{ y: -5 }} 
              className="bg-[#121212] border border-white/5 rounded-2xl p-8 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <Quote className="w-8 h-8 text-white/20 mb-6" />
              <p className="text-lg text-white/80 mb-8 italic leading-relaxed font-light flex-1">
                "I thought I was testing my physical limits, but I actually learned that kindness to myself
                was the key to finishing. Self-compassion became my most powerful tool."
              </p>
              
              <div className="flex items-center gap-4 pt-6 mt-auto">
                <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center">
                  <span className="text-white/80 font-bold">AL</span>
                </div>
                <div>
                  <p className="font-bold text-white/90">Ana Lopez</p>
                  <p className="text-xs text-white/50 uppercase tracking-widest">Franschhoek 500</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* The Gravalist Value / Why Ride with Us (Bento Box) */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="mb-16 text-center max-w-3xl mx-auto relative z-10 space-y-6">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 tracking-widest uppercase font-bold py-1 px-4 mb-4">
              Information & Logistics Risk
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase tracking-tight text-white mb-6">
              Adventure Over Racing
            </h2>
            <p className="text-xl text-white/60 leading-relaxed font-light">
              We spent <span className="text-primary font-medium">100 hours</span> doing the boring prep-work, so you can have <span className="text-primary font-medium">48 hours</span> of pure adventure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* The Golden GPX */}
            <motion.div 
              whileHover={{ y: -5 }} 
              className="bg-[#121212] border border-white/10 hover:border-primary/40 transition-colors duration-500 rounded-[2rem] p-8 md:p-10 flex flex-col group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-colors duration-700" />
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase font-display">The Golden GPX</h3>
              <p className="text-primary/80 font-medium tracking-wide uppercase text-xs mb-6">End the "Garbage GPX" Problem</p>
              <p className="text-white/60 leading-relaxed font-light flex-1">
                The internet is full of unvetted tracks leading into dead-ends or private farms. We provide a curated, meticulously verified route with reliable POIs for water, bail-outs, and supply shops.
              </p>
            </motion.div>

            {/* The Rider's Manual */}
            <motion.div 
              whileHover={{ y: -5 }} 
              className="bg-[#121212] border border-white/10 hover:border-primary/40 transition-colors duration-500 rounded-[2rem] p-8 md:p-10 flex flex-col group overflow-hidden relative"
            >
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-colors duration-700" />
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8">
                <Info className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase font-display">Rider's Manual</h3>
              <p className="text-blue-400/80 font-medium tracking-wide uppercase text-xs mb-6">Cure Your Decision Fatigue</p>
              <p className="text-white/60 leading-relaxed font-light flex-1">
                You don't need to spend 40+ hours researching resupply points, elevation profiles, or safety protocols. As your Route Architects, we provide the ultimate plug-and-play adventure manual.
              </p>
            </motion.div>

            {/* The Community Leaderboard */}
            <motion.div 
              whileHover={{ y: -5 }} 
              className="bg-[#121212] border border-white/10 hover:border-primary/40 transition-colors duration-500 rounded-[2rem] p-8 md:p-10 flex flex-col group overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-48 h-48 bg-green-500/10 blur-[60px] rounded-full group-hover:bg-green-500/20 transition-colors duration-700" />
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-8">
                <Trophy className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase font-display">Big Ride Vibes</h3>
              <p className="text-green-400/80 font-medium tracking-wide uppercase text-xs mb-6">Solve The Solitary Sufferfest</p>
              <p className="text-white/60 leading-relaxed font-light flex-1">
                Even unsupported riders want to feel connected. Solve the psychological barrier of riding in the void with our digital validation framework, active leaderboard, and shared global start dates.
              </p>
            </motion.div>
          </div>
        </section>


        {/* Global Map Section */}
        <GlobalMapSection />

        {/* Add Route Section */}
        <section>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <h2>Add a Route for A Community Ride</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Have an epic route in mind? Share it with the gravalist community. Upload your GPX file,
                    set the details, and let other riders discover your favorite roads.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    onClick={onNavigateToAddRoute}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Route
                  </Button>


                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12">
        <div>


          <div className="border-t border-border/30 mt-8 pt-8 text-center text-sm text-muted-foreground">

          </div>
        </div>
      </footer>

      {/* Withdrawal Modal */}
      {selectedEventForWithdrawal && (
        <WithdrawEventModal
          open={withdrawModalOpen}
          onClose={() => {
            setWithdrawModalOpen(false);
            setSelectedEventForWithdrawal(null);
          }}
          eventId={selectedEventForWithdrawal.id}
          eventName={selectedEventForWithdrawal.name}
          onWithdrawSuccess={handleWithdrawalSuccess}
        />
      )}
    </div>
  );
}