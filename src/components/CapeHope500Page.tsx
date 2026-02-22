import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, MapPin, Route, Mountain, TreePine, Award, Play, RotateCcw } from 'lucide-react';
import { apiClient, Event, EventHighlight } from '../utils/supabase/client';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { SessionManager } from '../utils/sessionManager';
import logoImage from '@/assets/logo.png';

interface CapeHope500PageProps {
  onEnterEvent: () => void;
}

// Icon mapping for different event tags
const getTagIcon = (tag: string) => {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('unsupported')) return Award;
  if (tagLower.includes('ultracycling') || tagLower.includes('ultra')) return Route;
  if (tagLower.includes('gravel')) return Mountain;
  if (tagLower.includes('bikepacking')) return TreePine;
  return Route; // default icon
};

export function CapeHope500Page({ onEnterEvent }: CapeHope500PageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Progress tracking hooks
  const { isAuthenticated } = useAuth();
  const {
    events,
    getCurrentStepForEvent,
    isEventCompleted,
    getEventProgress
  } = useEvents();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the Cape Hope 500 event by slug
        const { event: eventData } = await apiClient.getEvent('cape-hope-500');
        setEvent(eventData);
      } catch (err) {
        console.error('Failed to fetch event data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event data');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, []);

  // Format date from ISO string to display format
  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get event start time - use start_time field if available, otherwise default to 06:00
  const getEventStartTime = (event: Event) => {
    // If we have a specific start_time field, use it
    if (event.start_time) {
      return event.start_time;
    }

    // Try to extract time from event_date
    try {
      const date = new Date(event.event_date);
      const hours = date.getHours();
      const minutes = date.getMinutes();

      // If it's midnight (00:00), assume no specific time was set and default to 06:00
      if (hours === 0 && minutes === 0) {
        return '06:00';
      }

      // Otherwise, format the time from the date
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '06:00'; // default fallback for Cape Hope 500
    }
  };

  // Get user's progress for this event
  const getUserProgress = () => {
    if (!isAuthenticated || !event) return null;

    const currentStep = getCurrentStepForEvent(event.id);
    const completed = isEventCompleted(event.id);

    // Check session for additional context (for events in progress)
    const session = SessionManager.getSession();
    const sessionStep = (session?.currentEvent === 'Cape Hope 500' && session?.currentStepId > 0)
      ? session.currentStepId
      : currentStep;

    // Use the higher of database step or session step
    const actualStep = Math.max(currentStep, sessionStep);

    if (actualStep === 0 && !completed) return null;

    return {
      currentStep: actualStep,
      totalSteps: 12, // Based on onboarding flow
      isCompleted: completed || actualStep >= 12
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">Loading event details...</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-destructive">Failed to load event details</div>
          <div className="text-sm text-muted-foreground">{error}</div>
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
                alt={`${event.name} Symbol`}
                className="h-24 w-auto"
              />
            </div>

            <h1 className="mb-4">{event.name}</h1>

            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Badge variant="outline" className="text-foreground border-border">
                <Calendar className="w-4 h-4 mr-2" />
                {formatEventDate(event.event_date)}
              </Badge>
              <Badge variant="outline" className="text-foreground border-border">
                <Clock className="w-4 h-4 mr-2" />
                {getEventStartTime(event)}
              </Badge>
              {event.location && (
                <Badge variant="outline" className="text-foreground border-border">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.location}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {event.event_tags && event.event_tags.map((tag, index) => {
                const IconComponent = getTagIcon(tag);
                const isFirstTag = index === 0;

                return (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={isFirstTag
                      ? "text-primary border-primary bg-primary/10"
                      : "text-foreground border-border"
                    }
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Event Description */}
          <div className="prose prose-invert max-w-none mb-12">
            {event.description ? (
              <p className="text-center mb-8">
                {event.description}
              </p>
            ) : (
              <>
                <p className="text-center mb-8">
                  In the heart of Cape Town, where the salty breeze whispers tales of adventure, there lies an invitation to embark on a journey of a lifetime, the Cape Hope 500 starts. Standing at the starting line, a group of adventurers amidst a sea of anticipation, your bike laden with dreams and determination. Leaving behind the familiar skyline, you're drawn into a landscape alive with history and wonder.
                </p>
                <p className="text-center mb-8">
                  Ahead lies many challenges, a legendary route carved by pioneers long gone, their spirit of exploration echoing at every turn. You're not just a cyclist but an explorer, forging your path through the rich tapestry of Cape Town's landscape. The 500 km Cape Hope Route is designed to challenge all cyclists. You could tackle it in a single hit, or you could take your time over a weekend.
                </p>
                <p className="text-center mb-8">
                  Whatever journey you want to take, each of the 13 participants will have a different experience. The Cape Hope 500 isn't just a race. It's an opportunity to write your own chapter in the annals of cycling history, embrace the spirit of adventure, and discover the limitless potential within yourself.
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
        {/* Route Highlights */}
        {/* Route Highlights */}
        {event.event_highlights && event.event_highlights.length > 0 ? (
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Route className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-center">Route Highlights</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {event.event_highlights
                .sort((a, b) => a.highlight_order - b.highlight_order)
                .map((highlight) => (
                  <Card key={highlight.id} className="group hover:border-primary/30 transition-colors duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                          <Route className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-2">{highlight.title}</h3>
                        </div>
                      </div>
                      {highlight.description && (
                        <div className="prose prose-invert prose-sm max-w-none ml-16">
                          {highlight.description.split('\n\n').map((paragraph, paragraphIndex) => (
                            <p key={paragraphIndex} className="mb-4 last:mb-0 text-muted-foreground">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ) : (
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Route className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-center">Route Highlights</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="group hover:border-primary/30 transition-colors duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Route className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2">Footprints wash away</h3>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none ml-16">
                    <p className="mb-4 last:mb-0 text-muted-foreground">
                      Beginning at the waterfront, riders set out with hope for a low tide, providing them with a narrow path to navigate the challenging first beach section that stretches all the way up the West Coast with Table Mountain's sunrise as a breathtaking backdrop.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:border-primary/30 transition-colors duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Route className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2">Farmlands & Tulbagh</h3>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none ml-16">
                    <p className="mb-4 last:mb-0 text-muted-foreground">
                      Sneak your way to Malmesbury and across up to Riebeek-Kasteel, then Tulbagh over to Paarl Rock. If you want a polished route with water stops and free massages, please stay away from this race. You might feel that farms and dogs don't want you around.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:border-primary/30 transition-colors duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Route className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2">Cape Gravel</h3>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none ml-16">
                    <p className="mb-4 last:mb-0 text-muted-foreground">
                      Fight the headwind all the way home. You'll need your light to see where you are going, but you might want to keep it on low to conserve energy for the arduous path back.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Your Journey Awaits / Progress Section */}
        <Card className="mb-12">
          <CardContent className="p-8">
            {(() => {
              const progress = getUserProgress();

              if (progress && progress.currentStep > 0) {
                const progressPercent = Math.min((progress.currentStep / progress.totalSteps) * 100, 100);

                return (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="text-2xl font-bold text-primary mb-2">
                        {progress.isCompleted ? 'Journey Complete!' : 'Your Journey Continues'}
                      </div>
                      <p className="text-muted-foreground">
                        {progress.isCompleted
                          ? 'You\'ve completed all preparation steps for this adventure.'
                          : `Step ${progress.currentStep} of ${progress.totalSteps} completed`
                        }
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-3 mb-4">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Progress Text */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm text-muted-foreground">
                        {progress.isCompleted
                          ? 'All steps completed!'
                          : `Progress: ${Math.round(progressPercent)}%`
                        }
                      </span>
                      {progress.isCompleted && (
                        <Badge variant="outline" className="text-success border-success bg-success/10">
                          <Award className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="text-center">
                      <Button
                        size="lg"
                        onClick={onEnterEvent}
                        className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {progress.isCompleted ? (
                          <>
                            <Award className="w-5 h-5 mr-2" />
                            View Your Journey
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Continue Registration
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="prose prose-invert max-w-none">
                      <p className="text-center text-sm">
                        {progress.isCompleted
                          ? 'You\'re ready for this epic ride. Review your preparation or access your route files.'
                          : 'Pick up where you left off. Complete your preparation to earn points and get ready for the adventure.'
                        }
                      </p>
                    </div>
                  </div>
                );
              }

              // Default content for users without progress
              return (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="text-2xl font-bold text-primary mb-2">Your Journey Awaits</div>
                    <p className="text-muted-foreground">Click Register to begin.</p>
                  </div>

                  <div className="text-center mb-6">
                    <Button
                      size="lg"
                      onClick={onEnterEvent}
                      className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Register
                    </Button>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-center">
                      You'll get the route, key info, and everything you need to prepare. The further you go, the more points you earn — but the true reward is finishing. This is gravel: raw, dusty, and far from ordinary. No pampering, just open roads and a chance to change yourself. If you're ready, join now.
                    </p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Final CTA */}
        <div className="text-center">
          {(() => {
            const progress = getUserProgress();

            return (
              <>
                <Button
                  size="lg"
                  onClick={onEnterEvent}
                  className="px-8 py-3 mb-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {progress && progress.currentStep > 0 ? (
                    progress.isCompleted ? (
                      <>
                        <Award className="w-5 h-5 mr-2" />
                        View Your Journey
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Continue Registration
                      </>
                    )
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Register
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {progress && progress.currentStep > 0
                    ? progress.isCompleted
                      ? 'Access your completed preparation and route details'
                      : `Continue from step ${progress.currentStep} of your preparation`
                    : 'Begin your personalized 3-phase preparation for this epic ride'
                  }
                </p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}