import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Check, Loader2, Trophy, Map, Crown, ArrowRight, Compass, Clock, ShieldCheck, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner@2.0.3';
import backgroundImage from '@/assets/generic-2.png';

interface UpgradePageProps {
  onUpgrade: () => void;
  onNavigateToHome?: () => void;
  onNavigateToRides?: () => void;
}

export function UpgradePage({ onUpgrade, onNavigateToHome, onNavigateToRides }: UpgradePageProps) {
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
    'Lifetime access to official GPX route files',
    'Participation in community dates & tracking',
    'No-fuss, self-managed adventures',
    '100% independent, non-corporate platform',
    'Directly contribute to growing the community'
  ];

  const handleUpgrade = async () => {
    // Check authentication BEFORE setting loading state
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      window.dispatchEvent(new CustomEvent('requestAuth', { detail: { mode: 'signin' } }));
      return;
    }

    setIsLoading(true);
    setCurrentStep('Authenticating...');

    try {
      setCurrentStep('Verifying profile...');

      let effectiveUserId = session.user.id;
      let effectiveUserEmail = session.user.email;

      // Guarantee the user exists in public.users to bypass backend "User not found" race conditions
      if (effectiveUserEmail) {
        const { data: existingUser, error: queryError } = await supabase
          .from('users')
          .select('id')
          .eq('email', effectiveUserEmail)
          .maybeSingle();

        if (!existingUser) {
          console.log('User profile not found in public schema. Creating before checkout...');
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: effectiveUserId,
              email: effectiveUserEmail,
              display_name: effectiveUserEmail.split('@')[0] || 'Rider',
              first_name: '',
              last_name: '',
              city: '',
              total_points: 0
            }]);
            
          if (insertError) {
             console.log('Frontend profile creation blocked by RLS, relying on Edge function:', insertError.message);
          }
        }
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
          body: JSON.stringify({
            eventName: localStorage.getItem('gravalist_return_to_event') || 'Gravalist Event'
          }),
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
      {/* Existing upgrade flow */}
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
            <h1>Welcome to Gravalist!</h1>
            <p className="text-muted-foreground">
              Your entry is now secured. You have full access to download your official event GPX routes and prepare for the journey using our seamless digital checklist.
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
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4">Secure Your Entry</h1>
            <p className="text-xl text-muted-foreground max-w-lg text-center">
              Join the independent gravel community and get instant access to your next adventure.
            </p>
          </div>
        )}
      </div>

      {!showSuccessMessage && (
        <Card className="w-full max-w-md border-border/30">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <div className="text-3xl font-medium text-primary">R 2750</div>
              <div className="text-muted-foreground">One-time entry fee per event</div>
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
                'Secure Your Entry'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {!showSuccessMessage && (
        <div className="w-full max-w-5xl mt-24 mb-16 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">Why Ride With Gravalist?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're building an independent platform for riders who just want to ride. No red tape, no bloated entry fees.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-8 rounded-3xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Compass className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-3">Verified GPX Routes</h3>
              <p className="text-muted-foreground leading-relaxed">
                Hand-curated, gravel-tested routes ready for your Wahoo or Garmin. Less time planning, more time riding.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-3">No Cutoff Times</h3>
              <p className="text-muted-foreground leading-relaxed">
                Race the sun or ride at a leisure pace with friends. There's no pressure, no broom wagon, and no stress.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-3">100% Independent</h3>
              <p className="text-muted-foreground leading-relaxed">
                Funded entirely by riders. Every entry fee supports the platform and ensures these epic routes stay accessible.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Return to Events Action */}
      {!showSuccessMessage && onNavigateToRides && (
        <div className="w-full text-center pb-16">
          <Button 
            variant="ghost" 
            onClick={onNavigateToRides}
            className="text-muted-foreground hover:text-foreground group"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180 transition-transform group-hover:-translate-x-1" />
            Check out more events
          </Button>
        </div>
      )}
    </div>
  );
}