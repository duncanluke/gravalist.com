import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Clock, Award, ArrowRight, Calendar, Globe, Star, Trophy, Shield, Play, RotateCcw, Plus, Loader2, UserMinus, Info, User } from 'lucide-react';
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
  onNavigateToLeaderboard?: () => void;
  onNavigateToAddRoute?: () => void;
  userEmail?: string;
}

export function HomePage({ onViewRides, onEventSelect, onEnterEvent, onNavigateToLeaderboard, onNavigateToAddRoute, userEmail }: HomePageProps) {
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
            className="min-h-screen flex items-center justify-center text-center px-6 py-12 relative overflow-hidden -mt-16 mb-16"
            style={{
              backgroundColor: '#000000'
            }}
          >
            {/* Dark overlay for base */}
            <div className="absolute inset-0 bg-black/70" />

            {/* Subtle background icon - positioned above the overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-[1]">
              <MapPin className="w-[600px] h-[600px] text-primary" strokeWidth={0.5} />
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
              <h1 className="text-4xl md:text-6xl lg:text-7xl leading-tight">
                Rides
              </h1>
              <h2 className="text-xl md:text-3xl lg:text-4xl text-muted-foreground">
                Self-managed routes. Register below to join the community.
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
          <div className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Loading routes...</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 md:grid md:grid-cols-2 md:gap-8 md:overflow-x-visible md:pb-0">
                {events.length > 0 ? events.filter(event => event.is_published).map((event) => {
                  const displayEvent = formatEventForDisplay(event);
                  const progress = getUserProgress(event.id, event.name);

                  return (
                    <Card
                      key={event.id}
                      className="bg-card/50 border-primary/30 hover:bg-card hover:border-primary transition-all duration-300 group cursor-pointer overflow-hidden flex-shrink-0 w-[320px] md:w-auto"
                      onClick={() => {
                        console.log('HomePage - Card clicked:', { eventId: event.id, eventName: event.name, eventSlug: event.slug });
                        onEventSelect?.(event.name);
                      }}
                    >
                      <CardContent className="p-8">
                        {/* Event Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h3 className="mb-3 group-hover:text-primary transition-colors">{displayEvent.name}</h3>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">{displayEvent.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">{displayEvent.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-4xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors">
                            {displayEvent.distance_km || 500}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                          <p className={`text-muted-foreground leading-relaxed ${!expandedDescriptions[displayEvent.name] ? 'line-clamp-4' : ''}`}>
                            {displayEvent.description}
                          </p>
                          {displayEvent.description.length > 200 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDescriptions(prev => ({ ...prev, [displayEvent.name]: !prev[displayEvent.name] }));
                              }}
                              className="text-primary hover:text-primary/80 text-sm mt-2 transition-colors"
                            >
                              {expandedDescriptions[displayEvent.name] ? 'Read less' : 'Read more...'}
                            </button>
                          )}
                        </div>

                        {/* Highlights */}
                        <div className="mb-8">
                          <h4 className="mb-3 text-foreground">Route Highlights</h4>
                          <div className="space-y-2">
                            {displayEvent.highlights.slice(0, 3).map((highlight, highlightIndex) => (
                              <div key={highlightIndex} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">{highlight}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Progress Indicator & CTA Button */}
                        {(() => {
                          if (userEmail && progress) {
                            return (
                              <div className="space-y-3">
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

                          // Default button for events without progress or unauthenticated users
                          return (
                            <Button
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Always use event.name for consistency
                                console.log('HomePage - View Details clicked:', { eventId: event.id, eventName: event.name, eventSlug: event.slug });
                                onEventSelect?.(event.name);
                              }}
                            >
                              <Info className="w-4 h-4 mr-2" />
                              View Details
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  );
                }) : (
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

        </section>

        {/* Rider Stories Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="mb-4">Riders Stories</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Through the challenges you faced during the ultra endurance experience,
              what was the most surprising discovery you made about yourself?
            </p>

            {/* Five Star Rating */}
            <div className="flex items-center justify-center gap-3 mt-8 mb-8">
              <div className="flex items-center gap-1">
                {[...Array(4)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
                <Star className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground">Rated 4.1/5 stars by 30+ subscribers</span>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4">
            <Card className="bg-card/30 border-border flex-shrink-0 w-80">
              <CardContent className="p-8">
                <p className="text-muted-foreground mb-4 italic">
                  "I discovered that my mind would quit long before my body. Learning to push through that mental
                  barrier at 300km changed everything about how I approach challenges."
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium">SJ</span>
                    </div>
                    <div>
                      <p className="font-medium">Sarah Jensen</p>
                      <p className="text-sm text-muted-foreground">Utrecht 500</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-primary" />
                      <span className="text-xs text-muted-foreground">1,250 pts</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border flex-shrink-0 w-80">
              <CardContent className="p-8">
                <p className="text-muted-foreground mb-4 italic">
                  "The silence and solitude revealed parts of myself I never knew existed.
                  By kilometer 400, I wasn't racing anyone but having a conversation with my soul."
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium">MR</span>
                    </div>
                    <div>
                      <p className="font-medium">Marcus Rodriguez</p>
                      <p className="text-sm text-muted-foreground">Sedgefield 500</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                      ))}
                      <Star className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-primary" />
                      <span className="text-xs text-muted-foreground">2,100 pts</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border flex-shrink-0 w-80">
              <CardContent className="p-8">
                <p className="text-muted-foreground mb-4 italic">
                  "I thought I was testing my physical limits, but I actually learned that kindness to myself
                  was the key to finishing. Self-compassion became my most powerful tool."
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium">AL</span>
                    </div>
                    <div>
                      <p className="font-medium">Ana Lopez</p>
                      <p className="text-sm text-muted-foreground">Franschhoek 500</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                      ))}
                      <Star className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-primary" />
                      <span className="text-xs text-muted-foreground">950 pts</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 500km Gravel Bikepacking Section */}
        <section>

        </section>

        {/* Community Leaderboard Section */}
        <section>
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="w-8 h-8 text-primary" />
                <h2>Community Leaderboard</h2>
              </div>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Track your progress, earn points for every ride completed, and see how you rank
                among fellow Gravalists. From registration to finish line, every milestone counts
                toward your community standing.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-2xl mx-auto">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-medium">Register & Start</h3>
                  <p className="text-xs text-muted-foreground">Earn points for joining rides and completing preparation steps</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-medium">Complete Challenges</h3>
                  <p className="text-xs text-muted-foreground">Major points for crossing the finish line of ultra endurance rides</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-medium">Community Prize</h3>
                  <p className="text-xs text-muted-foreground">Top rider each quarter receives exclusive Gravalist gear</p>
                </div>
              </div>
              <Button
                onClick={onNavigateToLeaderboard}
                className="bg-transparent text-primary hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors"
                size="lg"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Leaderboard
              </Button>
            </CardContent>
          </Card>
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