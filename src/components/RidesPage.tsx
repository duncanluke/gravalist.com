import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Calendar, Users, ArrowRight, Award, Globe, Play, RotateCcw, Plus, Loader2 } from 'lucide-react';
import { SessionManager } from '../utils/sessionManager';
import { useEvents } from '../hooks/useEvents';
import heroBackground from '@/assets/rides-hero.png';

interface Event {
  name: string;
  location: string;
  date: string;
  riders: number;
  description: string;
  highlights: string[];
  distance_km?: number;
}

interface RidesPageProps {
  onEventSelect: (eventName: string) => void;
  onEnterEvent: (eventName: string) => void;
  userEmail?: string;
  onNavigateToAddRoute: () => void;
}

export function RidesPage({ onEventSelect, onEnterEvent, userEmail, onNavigateToAddRoute }: RidesPageProps) {
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    getCurrentStepForEvent,
    isEventCompleted,
    getEventProgress,
    allEventsProgress,
    fetchAllEventsProgress
  } = useEvents();
  const [expandedDescriptions, setExpandedDescriptions] = React.useState<Record<string, boolean>>({});
  const [progressLoading, setProgressLoading] = React.useState(false);

  // Force fetch progress when component mounts and user is authenticated
  React.useEffect(() => {
    if (userEmail && events.length > 0) {
      setProgressLoading(true);
      fetchAllEventsProgress(events).finally(() => {
        setProgressLoading(false);
      });
    }
  }, [userEmail, events.length, fetchAllEventsProgress]);

  // Get user's progress for each event
  const getUserProgress = (eventId: string, eventName: string) => {
    if (!userEmail) return null;

    const currentStep = getCurrentStepForEvent(eventId);
    const completed = isEventCompleted(eventId);

    // Check session for additional context (for events in progress)
    const session = SessionManager.getSession();
    const sessionStep = (session?.currentEvent === eventName && session?.currentStepId >= 0)
      ? session.currentStepId
      : -1;

    // Use the higher of database step or session step
    // If both are valid, use the higher one; if only one is valid, use that one
    let actualStep = currentStep;
    if (sessionStep >= 0) {
      actualStep = Math.max(currentStep, sessionStep);
    }

    // Don't show progress if user hasn't started (step 0 or below and not completed)
    if (actualStep <= 0 && !completed) return null;

    // Debug logging for step progress
    console.log('Step Progress Debug:', {
      eventName,
      eventId,
      databaseStep: currentStep,
      sessionStep,
      actualStep,
      completed,
      hasProgress: getEventProgress(eventId).length > 0
    });

    // Total steps: 0-17 = 18 steps total (before: 0-9, starting: 10-13, end: 14-17)
    const totalSteps = 18;

    return {
      currentStep: actualStep,
      totalSteps,
      isCompleted: completed || actualStep >= 17, // Completed when reached final step (17)
      progressPercent: Math.min((actualStep / (totalSteps - 1)) * 100, 100) // -1 because steps are 0-indexed
    };
  };
  // Format events for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEventForDisplay = (event: any) => ({
    name: event.name,
    location: event.location || 'Location TBD',
    date: formatDate(event.event_date),
    riders: event.registration_count || 0,
    description: event.description || 'An exciting ultra-distance cycling challenge.',
    highlights: event.event_highlights?.map((h: any) => h.title).filter(Boolean) || ['Epic cycling adventure'],
    distance_km: event.distance_km
  });

  // Convert database events to display format, and add fallback events if database is empty
  const displayEvents: Event[] = React.useMemo(() => {
    const dbEvents = events.map(formatEventForDisplay);

    // If we have events from database, use them
    if (dbEvents.length > 0) {
      return dbEvents;
    }

    // Fallback events for when database is empty (development/initial state)
    return [
      {
        name: 'Utrecht 500',
        location: 'Utrecht, Netherlands',
        date: 'Sep 19, 2025',
        riders: 24,
        description: 'Pedal through serene forests, picturesque dijks, and iconic landmarks as you traverse the diverse terrain of the Dutch countryside.',
        highlights: ['Historic Enkhuizen', 'Amsterdam canals', 'National Park Veluwezoom']
      },
      {
        name: 'Sedgefield 500',
        location: 'Sedgefield, South Africa',
        date: 'Oct 12, 2024',
        riders: 31,
        description: 'Experience the wild beauty of South Africa\'s Garden Route with challenging coastal trails and breathtaking mountain passes.',
        highlights: ['Garden Route coastline', 'Knysna forests', 'Outeniqua Mountains']
      },
      {
        name: 'Franschhoek 500',
        location: 'Franschhoek, South Africa',
        date: 'Nov 8, 2024',
        riders: 28,
        description: 'Navigate through world-renowned wine valleys and dramatic mountain landscapes in the heart of the Western Cape.',
        highlights: ['Wine valley routes', 'Cape mountain passes', 'French colonial heritage']
      },
      {
        name: 'Cape Hope 500',
        location: 'Cape of Good Hope, South Africa',
        date: 'Feb 14, 2025',
        riders: 35,
        description: 'Journey to the southernmost tip of Africa through fynbos landscapes, coastal cliffs, and historic fishing villages.',
        highlights: ['Cape Point lighthouse', 'Chapman\'s Peak Drive', 'Penguin colonies at Boulders Beach']
      }
    ];
  }, [events]);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div
        className="min-h-screen flex items-center justify-center text-center px-6 py-12 relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#000000'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Badge variant="outline" className="text-primary border-primary bg-primary/10">
              <Award className="w-4 h-4 mr-2" />
              Self-Managed
            </Badge>
            <Badge variant="outline" className="border-muted-foreground/30">
              <Globe className="w-4 h-4 mr-2" />
              Community Driven
            </Badge>
          </div>

          <h1 className="mb-4">The Roads Are Free. We Just Provide The Map.</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            Gravel riding should be uncomplicated. We provide the routes, not corporate-sponsored events. As a subscriber, you get a no-fuss opportunity to ride whenever you choose, on your own time. Join others on community dates, or tackle the roads completely solo. It's your life, your ride—we just help you get there.
          </p>
        </div>
      </div>

      {/* Debug Info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="py-4">
          <Card className="bg-muted/30 border-muted">

          </Card>
        </div>
      )}

      {/* Progress Loading Indicator */}
      {userEmail && progressLoading && !eventsLoading && (
        <div className="py-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your progress...
            </div>
          </div>
        </div>
      )}

      {/* Events Grid Wrapper (always render container to avoid layout shift) */}
      <div className="py-12 relative min-h-[500px]">
        {eventsLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 bg-background/80 p-6 rounded-xl backdrop-blur-sm border border-border">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground font-medium">Loading premium routes...</p>
            </div>
          </div>
        ) : eventsError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 bg-destructive/10 p-6 rounded-xl border border-destructive/20 max-w-md mx-auto">
              <p className="text-destructive font-medium">Failed to load routes</p>
              <p className="text-muted-foreground text-sm">{eventsError}</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-12 md:grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 md:gap-8 md:overflow-x-visible md:pb-0 px-4 max-w-[1400px] mx-auto">
            {displayEvents.length > 0 ? displayEvents.map((event, index) => (
              <Card
                key={index}
                className="relative bg-background/40 backdrop-blur-xl border-primary/20 hover:border-primary/50 transition-all duration-500 group cursor-pointer overflow-hidden flex-shrink-0 w-[340px] md:w-auto rounded-2xl shadow-lg hover:shadow-[0_0_30px_rgba(255,87,34,0.15)] flex flex-col h-full"
                onClick={() => onEventSelect(event.name)}
              >
                {/* Dynamic Background Effect */}
                <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                <CardContent className="p-8 flex flex-col flex-1">
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div>
                      <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{event.name}</h2>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">{event.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* High-end Stats Bar */}
                  <div className="grid grid-cols-3 gap-4 py-4 mb-6 border-y border-border/50 relative z-10">
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Distance</span>
                      <span className="text-xl font-bold text-foreground">{event.distance_km || 500}<span className="text-sm font-normal text-muted-foreground ml-1">km</span></span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center border-x border-border/50">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-primary hidden sm:block" />
                        <span className="text-sm font-bold text-foreground">{event.date}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Riders</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-primary hidden sm:block" />
                        <span className="text-sm font-bold text-foreground">{event.riders}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6 relative z-10 flex-grow">
                    <p className={`text-muted-foreground leading-relaxed ${!expandedDescriptions[event.name] ? 'line-clamp-4' : ''}`}>
                      {event.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDescriptions(prev => ({ ...prev, [event.name]: !prev[event.name] }))
                      }}
                      className="text-primary hover:text-primary/80 text-sm mt-2 transition-colors font-medium"
                    >
                      {expandedDescriptions[event.name] ? 'Read less' : 'Read more...'}
                    </button>
                  </div>

                  {/* Highlights (Compact) */}
                  <div className="mb-8 relative z-10">
                    <div className="flex flex-wrap gap-2">
                      {event.highlights.slice(0, 3).map((highlight, highlightIndex) => (
                        <Badge key={highlightIndex} variant="secondary" className="bg-secondary/50 text-secondary-foreground text-xs font-normal border-none">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Progress Indicator & CTA Button */}
                  {(() => {
                    // Find the corresponding event object with the ID
                    const dbEvent = events.find(e => e.name === event.name);

                    // Show loading state while progress is being fetched
                    if (userEmail && progressLoading && dbEvent) {
                      return (
                        <div className="space-y-3">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-muted-foreground/20 h-2 rounded-full animate-pulse" />
                          </div>
                          <Button
                            disabled
                            variant="outline"
                            className="w-full border-primary/30"
                          >
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading Progress...
                          </Button>
                        </div>
                      );
                    }

                    const progress = dbEvent ? getUserProgress(dbEvent.id, event.name) : null;

                    if (progress && progress.currentStep > 0) {
                      return (
                        <div className="space-y-3">
                          {/* Progress Bar */}
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progressPercent}%` }}
                            />
                          </div>

                          {/* Progress Text & Button */}
                          <div className="flex items-center justify-between">
                          </div>

                          {/* Continue/View Button */}
                          <Button
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEnterEvent(event.name);
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
                                Complete Journey
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    }

                    // Default button for events without progress or unauthenticated users
                    return (
                      <div className="relative z-10 mt-auto pt-4 flex flex-col items-center">
                        {!userEmail && (
                          <div className="mb-3 text-[10px] sm:text-xs font-medium tracking-wide text-primary/80 uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            Premium Access Required
                          </div>
                        )}
                        <Button
                          className="w-full relative overflow-hidden bg-primary/90 hover:bg-primary text-primary-foreground font-semibold py-6 text-lg group transition-all duration-300 shadow-[0_0_15px_rgba(255,87,34,0.3)] hover:shadow-[0_0_25px_rgba(255,87,34,0.5)] border-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            userEmail ? onEnterEvent(event.name) : onEventSelect(event.name);
                          }}
                        >
                          <span className="relative z-10 flex items-center justify-center w-full">
                            <MapPin className="w-5 h-5 mr-3" />
                            {userEmail ? 'Get Route Access' : 'Unlock Route & Commit'}
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
            )) : (
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

      {/* Important Disclaimer */}
      <div className="py-12">
        <div className="text-center text-muted-foreground">
          <p className="max-w-2xl mx-auto border border-primary/30 rounded-lg p-4">
            <strong>Important:</strong> These are self-managed rides. We do not provide support, organize events, or accept responsibility for what happens on the route. Your safety, choices, and experience are entirely your responsibility.
          </p>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="py-16">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl text-foreground">Add a Route for A Community Ride</h2>
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

                <div className="text-sm text-muted-foreground">
                  Join 500+ route creators
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}