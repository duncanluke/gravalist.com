import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Check, Loader2, Trophy, Map, Crown, ArrowRight } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner@2.0.3';
import backgroundImage from '@/assets/generic-2.png';

interface UpgradePageProps {
  onUpgrade: () => void;
  onNavigateToHome?: () => void;
  onNavigateToLeaderboard?: () => void;
  onNavigateToRides?: () => void;
}

export function UpgradePage({ onUpgrade, onNavigateToHome, onNavigateToLeaderboard, onNavigateToRides }: UpgradePageProps) {
  const { user, profile, isAuthenticated, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  
  // Check if user is already a premium subscriber
  const isPremiumUser = profile?.is_premium_subscriber && profile?.subscription_status === 'active';
  
  // Check for success/cancel parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success === 'true') {
      setShowSuccessMessage(true);
      toast.success('Welcome to Gravalist Premium! Your subscription is now active.');
      
      // Refresh user profile to get updated premium status
      if (isAuthenticated && refreshProfile) {
        refreshProfile();
      }
      
      // Check if we should return to onboarding
      const returnEvent = localStorage.getItem('gravalist_return_to_event');
      const returnStep = localStorage.getItem('gravalist_return_step');
      
      if (returnEvent && returnStep) {
        toast.success('Returning to your onboarding journey...', { duration: 3000 });
        
        // Clean up localStorage
        localStorage.removeItem('gravalist_return_to_event');
        localStorage.removeItem('gravalist_return_step');
        
        // Navigate back to onboarding after a brief delay
        setTimeout(() => {
          const returnToOnboardingEvent = new CustomEvent('returnToOnboarding', {
            detail: { 
              eventName: returnEvent,
              stepId: parseInt(returnStep, 10)
            }
          });
          window.dispatchEvent(returnToOnboardingEvent);
        }, 2000);
      }
      
      // Clean up URL after a short delay to ensure success message is shown
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 1000);
    } else if (canceled === 'true') {
      toast.error('Upgrade canceled. You can try again anytime.');
      
      // Check if we should return to onboarding
      const returnEvent = localStorage.getItem('gravalist_return_to_event');
      const returnStep = localStorage.getItem('gravalist_return_step');
      
      if (returnEvent && returnStep) {
        toast('Returning to your journey...', { duration: 2000 });
        
        // Navigate back without cleaning up (they might want to try again)
        setTimeout(() => {
          const returnToOnboardingEvent = new CustomEvent('returnToOnboarding', {
            detail: { 
              eventName: returnEvent,
              stepId: parseInt(returnStep, 10)
            }
          });
          window.dispatchEvent(returnToOnboardingEvent);
        }, 1500);
      }
      
      // Clean up URL
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 1000);
    }
  }, [isAuthenticated, refreshProfile]);
  
  const benefits = [
    'Access to community rides and routes',
    'Eligibility for the community leaderboard',
    'Support finding new routes',
    'Help maintain existing routes',
    'Contribute to growing the community'
  ];

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to upgrade your account');
      // Trigger auth modal
      window.dispatchEvent(new CustomEvent('requestAuth', { detail: { mode: 'signin' } }));
      return;
    }

    setIsLoading(true);
    setCurrentStep('Authenticating...');
    
    try {
      // Get user's access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      setCurrentStep('Creating payment session...');

      // Create checkout session with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15 second timeout for frontend

      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/stripe/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseData = await response.json();

      if (!response.ok) {
        
        const errorMessage = responseData.error || 'Failed to create checkout session';
        const errorDetails = responseData.details ? ` (${responseData.details})` : '';
        
        // Provide specific guidance for common errors
        let userMessage = errorMessage + errorDetails;
        if (errorMessage.includes('Payment plan not found')) {
          userMessage = 'Payment plan configuration issue. Please contact support at hello@gravalist.com';
        } else if (errorMessage.includes('configuration')) {
          userMessage = 'Payment system is temporarily unavailable. Please try again later or contact support.';
        }
        
        throw new Error(userMessage);
      }

      const { checkoutUrl } = responseData;
      
      if (!checkoutUrl) {
        throw new Error('No checkout URL received from payment provider');
      }

      setCurrentStep('Redirecting to payment...');
      
      // Force redirect at top level to avoid iframe issues
      try {
        if (window.top && window.top !== window) {
          // We're in an iframe, force top-level navigation
          window.top.location.href = checkoutUrl;
        } else {
          // We're at top level, use normal redirect
          window.location.href = checkoutUrl;
        }
      } catch (e) {
        // Fallback: create a link element with target="_top"
        const link = document.createElement('a');
        link.href = checkoutUrl;
        link.target = '_top';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Handle specific fetch errors
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request is taking too long. Please check your connection and try again.');
        }
        
        // Re-throw other errors to be handled by outer catch
        throw fetchError;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start upgrade process';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setCurrentStep('');
    }
  };



  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4">
      {/* Premium User Success State */}
      {isPremiumUser && !showSuccessMessage ? (
        <div className="space-y-8 max-w-2xl w-full">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Crown className="w-8 h-8" />
            </div>
            <h1>You're a Premium Member</h1>
            <p className="text-muted-foreground">
              You're all set with Gravalist Premium. Here's what you can do next to get the most out of your membership.
            </p>
          </div>

          {/* Next Steps Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Leaderboard Card */}
            <Card className="border-border/30 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 space-y-4 text-left">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg">Check the Leaderboard</h3>
                    <p className="text-sm text-muted-foreground">
                      See where you stand among the community. Earn points by completing rides and climb the rankings.
                    </p>
                    <div className="pt-2">
                      <Button 
                        onClick={onNavigateToLeaderboard}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-primary/30 hover:bg-primary/10"
                      >
                        View Leaderboard
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="pl-16 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    <span>Track your progress over time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    <span>Compare with fellow riders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    <span>See who's crushing it</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rides Card */}
            <Card className="border-border/30 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 space-y-4 text-left">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Map className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg">Register for a Ride</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse upcoming community rides and register for your next adventure. Download GPX routes and track your completion.
                    </p>
                    <div className="pt-2">
                      <Button 
                        onClick={onNavigateToRides}
                        className="gap-2 bg-primary hover:bg-primary/90"
                        size="sm"
                      >
                        Browse Rides
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="pl-16 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    <span>Access curated routes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    <span>Download GPX files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    <span>Join community dates</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom info */}
          <div className="pt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Your subscription gives you unlimited access to all rides, routes, and leaderboard features.
            </p>
            <p className="text-xs text-muted-foreground">
              Questions? Reach out at <span className="text-primary">hello@gravalist.com</span>
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Existing upgrade flow for non-premium users */}
          <div className="space-y-4 max-w-lg relative pb-32">
            {/* Decorative background image */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md mx-auto pointer-events-none z-0">
              <img 
                src={backgroundImage} 
                alt="Gravel riding scenery"
                className="w-full h-auto opacity-30"
                style={{
                  maskImage: 'radial-gradient(ellipse 80% 80% at center, black 40%, transparent 100%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at center, black 40%, transparent 100%)'
                }}
              />
            </div>
            
            {showSuccessMessage ? (
              <div className="space-y-4 relative z-10">
                <h1>Welcome to Gravalist Premium!</h1>
                <p className="text-muted-foreground">
                  Your subscription is now active. You now have access to all premium features including the community leaderboard, curated routes, and priority support.
                </p>
                {onNavigateToHome && (
                  <Button 
                    onClick={onNavigateToHome}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                  >
                    Continue to Gravalist
                  </Button>
                )}
              </div>
            ) : (
              <div className="relative z-10">
                <h1>Join the Exclusive Gravel Community</h1>
                <p className="text-muted-foreground">
                  Connect with riders like you — people looking for something between ultra-distance racing and endless route-hunting. Unlock curated rides, routes, and leaderboard spots while supporting the platform that fuels new adventures.
                </p>
              </div>
            )}
          </div>

          {!showSuccessMessage && (
            <Card className="w-full max-w-md border-border/30">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="text-3xl font-medium text-primary">$169</div>
                  <div className="text-muted-foreground">per year</div>
                </div>

                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3 text-left">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {currentStep || 'Processing...'}
                    </>
                  ) : (
                    'Upgrade Now'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}