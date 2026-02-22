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
          
          <h1 className="mb-4">Self-Managed, Community-Driven, Ultra-Distance</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            We provide routes, not events. As a subscriber, you are free to ride them whenever you choose, on your own time and date. You might be the only rider—there may be no one else at the start line, not even us. Or, you can join others on community dates where riders start together. Community rides begin on Friday and must be completed by Sunday at 6pm, giving you the freedom to ride at your own pace—whether alongside fellow riders, testing yourself against the community, or riding completely solo.
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

      {/* Events Grid */}
      <div className="py-12">
        {eventsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading routes...</p>
            </div>
          </div>
        ) : eventsError ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <p className="text-destructive">Failed to load routes</p>
              <p className="text-muted-foreground text-sm">{eventsError}</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 md:grid md:grid-cols-2 md:gap-8 md:overflow-x-visible md:pb-0">
            {displayEvents.length > 0 ? displayEvents.map((event, index) => (
            <Card 
              key={index} 
              className="bg-card/50 border-primary/30 hover:bg-card hover:border-primary transition-all duration-300 group cursor-pointer overflow-hidden flex-shrink-0 w-[320px] md:w-auto"
              onClick={() => onEventSelect(event.name)}
            >
              <CardContent className="p-8">
                {/* Event Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="mb-3 group-hover:text-primary transition-colors">{event.name}</h2>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{event.riders} rider{event.riders !== 1 ? 's' : ''} registered</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors">
                    {event.distance_km || 500}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <p className={`text-muted-foreground leading-relaxed ${!expandedDescriptions[event.name] ? 'line-clamp-6' : ''}`}>
                    {event.description}
                  </p>
                  <button 
                    onClick={() => setExpandedDescriptions(prev => ({ ...prev, [event.name]: !prev[event.name] }))}
                    className="text-primary hover:text-primary/80 text-sm mt-2 transition-colors"
                  >
                    {expandedDescriptions[event.name] ? 'Read less' : 'Read more...'}
                  </button>
                </div>

                {/* Highlights */}
                <div className="mb-8">
                  <h4 className="mb-3 text-foreground">Route Highlights</h4>
                  <div className="space-y-2">
                    {event.highlights.map((highlight, highlightIndex) => (
                      <div key={highlightIndex} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{highlight}</span>
                      </div>
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
                    <Button 
                      variant="outline"
                      className="w-full border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary group"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use onEnterEvent for authenticated users to go directly to onboarding
                        // Use onEventSelect for unauthenticated users to go to event page first
                        userEmail ? onEnterEvent(event.name) : onEventSelect(event.name);
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {userEmail ? 'Register' : 'Join Adventure'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  );
                })()}
              </CardContent>
            </Card>
            )) : (
              <div className="col-span-1 md:col-span-2 text-center py-16">
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