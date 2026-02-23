import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HelpModal } from './components/modals/HelpModal';
import { Toaster } from './components/ui/sonner';
import { SessionWelcomeModal } from './components/SessionWelcomeModal';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAppState } from './hooks/useAppState';
import { useAuth } from './hooks/useAuth';
import { useEvents } from './hooks/useEvents';
import { useEventNavigation } from './hooks/useEventNavigation';
import { SessionManager } from './utils/sessionManager';
import { AppRouter } from './components/AppRouter';
import { AuthModal } from './components/AuthModal';
import { STEP_IDS } from './constants/app';
import { ViewMode } from './types/app';

// Simple performance tracking
const APP_START_TIME = Date.now();

function AppContent() {
  const { state, setState, setViewMode, setUserEmail, setCurrentStep, setCurrentPhase } = useAppState();
  const { user, profile, isAuthenticated, loading: authLoading, isOfflineMode } = useAuth();
  const { events, currentEvent, stepProgress, fetchStepProgress, loading: eventsLoading } = useEvents();

  // Simplified memoization
  const memoizedUserEmail = useMemo(() => user?.email || state.userEmail, [user?.email, state.userEmail]);
  const memoizedViewMode = useMemo(() => state.viewMode as ViewMode, [state.viewMode]);

  // Simplified app state
  const [appReady, setAppReady] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, []);

  const { handleEventSelect, handleEnterEvent } = useEventNavigation({
    userEmail: memoizedUserEmail,
    setState,
    isAuthenticated,
    onNavigate: handleNavigate
  });

  // Simplified loading check
  const shouldShowLoading = useMemo(() => {
    return !appReady;
  }, [appReady]);

  // Simple URL routing - run once on mount
  useEffect(() => {
    const path = window.location.pathname;

    try {
      if (path.includes('/upgrade')) {
        setViewMode('upgrade');
      } else if (path.includes('/reset-password')) {
        setViewMode('reset-password');
      } else if (path.includes('/leaderboard')) {
        setViewMode('leaderboard');
      } else if (path.includes('/terms')) {
        setViewMode('terms');
      } else if (path.includes('/privacy')) {
        setViewMode('privacy');
      } else if (path.includes('/add-route')) {
        setViewMode('add-route');
      } else if (path !== '/' && path !== '/home' && path.length > 1) {
        // Handle SEO URLs for events (e.g. /sedgefield-500, /capehope-500, /transubafrica)
        let eventSlug = path.slice(1); // remove leading slash

        // Handle known naming discrepancies from HubSpot
        if (eventSlug === 'capehope-500') eventSlug = 'cape-hope-500';

        // Assuming any other top-level path that doesn't match above is an event or page
        setViewMode(eventSlug as ViewMode);
      } else if (path === '/' || path.includes('/home')) {
        setViewMode('home');
      }
    } catch (error) {
      console.error('URL routing error:', error);
      setViewMode('home');
    }
  }, [currentPath]); // Run when path changes

  // Simple app initialization
  useEffect(() => {
    if (appReady) return;

    // Set a reasonable timeout for initialization
    const timeout = setTimeout(() => {
      console.log('App initialization complete (timeout reached)');
      setAppReady(true);
    }, 2500); // 2.5 second timeout

    // Mark as ready when auth and events are loaded OR after a brief delay
    if (!authLoading && !eventsLoading) {
      // Add a small delay to prevent flash
      setTimeout(() => {
        const initTime = Date.now() - APP_START_TIME;
        console.log(`App initialized successfully in ${initTime}ms`);
        setAppReady(true);
        clearTimeout(timeout);
      }, 200);
    }

    return () => clearTimeout(timeout);
  }, [authLoading, eventsLoading, appReady]);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');

  // Update user email when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.email && user.email !== state.userEmail) {
      setUserEmail(user.email);
    }
  }, [isAuthenticated, user?.email, state.userEmail, setUserEmail]);

  // Event listeners for global navigation
  useEffect(() => {
    const handleRequestAuth = (event: CustomEvent) => {
      setAuthModalTab(event.detail?.mode || 'signin');
      setShowAuthModal(true);
    };

    const handleRequestEmailInput = () => {
      if (!isAuthenticated) {
        setAuthModalTab('signup');
        setShowAuthModal(true);
      }
    };

    const handleNavigateToLeaderboard = () => setViewMode('leaderboard');
    const handleNavigateToHome = () => setViewMode('home');

    const handleNavigateToUpgrade = () => {
      setViewMode('upgrade');
    };

    const handleReturnToOnboarding = (event: CustomEvent) => {
      const { eventName, stepId } = event.detail;

      if (eventName && typeof stepId === 'number') {
        const phase = stepId <= 9 ? 'before' : stepId <= 14 ? 'start' : 'end';

        setState({
          currentEvent: eventName,
          currentStepId: stepId,
          currentPhase: phase,
          viewMode: 'onboarding'
        });
      }
    };

    const handleShowErrorToast = (event: CustomEvent) => {
      try {
        const { toast } = require('sonner@2.0.3');
        toast.error(event.detail?.message || 'An error occurred');
      } catch (error) {
        console.error('Toast error:', error);
      }
    };

    window.addEventListener('requestAuth', handleRequestAuth as EventListener);
    window.addEventListener('requestEmailInput', handleRequestEmailInput);
    window.addEventListener('navigateToLeaderboard', handleNavigateToLeaderboard);
    window.addEventListener('navigateToHome', handleNavigateToHome);
    window.addEventListener('navigateToUpgrade', handleNavigateToUpgrade);
    window.addEventListener('returnToOnboarding', handleReturnToOnboarding as EventListener);
    window.addEventListener('showErrorToast', handleShowErrorToast as EventListener);

    return () => {
      window.removeEventListener('requestAuth', handleRequestAuth as EventListener);
      window.removeEventListener('requestEmailInput', handleRequestEmailInput);
      window.removeEventListener('navigateToLeaderboard', handleNavigateToLeaderboard);
      window.removeEventListener('navigateToHome', handleNavigateToHome);
      window.removeEventListener('navigateToUpgrade', handleNavigateToUpgrade);
      window.removeEventListener('returnToOnboarding', handleReturnToOnboarding as EventListener);
      window.removeEventListener('showErrorToast', handleShowErrorToast as EventListener);
    };
  }, [isAuthenticated, setViewMode]);

  // Auto-close auth modal when authenticated
  useEffect(() => {
    if (isAuthenticated && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated, showAuthModal]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleContinueSession = useCallback(() => {
    try {
      if (state.sessionSummary) {
        setState({
          userEmail: state.sessionSummary.email,
          currentStepId: state.sessionSummary.currentStep,
          currentPhase: state.sessionSummary.currentPhase,
          currentEvent: state.sessionSummary.currentEvent,
          isInSpecificEventFlow: true,
          viewMode: 'onboarding'
        });

        // Update the session to mark this event as active
        SessionManager.updateEvent(state.sessionSummary.currentEvent);
      }
      setState({ showSessionWelcome: false });
    } catch (error) {
      console.error('Error continuing session:', error);
    }
  }, [state.sessionSummary, setState]);

  const handleStartFresh = useCallback(() => {
    try {
      setState({
        userEmail: '',
        currentStepId: STEP_IDS.WELCOME,
        currentPhase: 'before',
        currentEvent: 'Utrecht 500',
        isInSpecificEventFlow: false,
        viewMode: 'onboarding',
        showSessionWelcome: false
      });
    } catch (error) {
      console.error('Error starting fresh:', error);
    }
  }, [setState]);

  const handleNavigateToHome = useCallback(() => {
    handleNavigate('/');
    setViewMode('home');
  }, [handleNavigate, setViewMode]);

  const handleNavigateToLeaderboard = useCallback(() => {
    handleNavigate('/leaderboard');
    setViewMode('leaderboard');
  }, [handleNavigate, setViewMode]);

  const handleNavigateToSubscribe = useCallback(() => {
    handleNavigate('/upgrade');
    setViewMode('upgrade');
  }, [handleNavigate, setViewMode]);

  const handleNavigateToAddRoute = useCallback(() => {
    handleNavigate('/add-route');
    setViewMode('add-route');
  }, [handleNavigate, setViewMode]);

  const handleNavigateToTerms = useCallback(() => {
    handleNavigate('/terms');
    setViewMode('terms');
  }, [handleNavigate, setViewMode]);

  const handleNavigateToPrivacy = useCallback(() => {
    handleNavigate('/privacy');
    setViewMode('privacy');
  }, [handleNavigate, setViewMode]);

  const handleNavigateToRides = useCallback(() => {
    handleNavigate('/');
    setViewMode('home');
  }, [handleNavigate, setViewMode]);

  const handleNavigateToStories = useCallback(() => {
    handleNavigate('/stories');
  }, [handleNavigate]);
  const handleCloseHelp = useCallback(() => setState({ showHelp: false }), [setState]);
  const handleCloseSessionWelcome = useCallback(() => setState({ showSessionWelcome: false }), [setState]);

  // Show loading screen if not ready
  if (shouldShowLoading) {
    return <LoadingScreen message="Loading Gravalist..." />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        viewMode={memoizedViewMode}
        onNavigateToHome={handleNavigateToHome}
        userEmail={memoizedUserEmail}
        onNavigateToLeaderboard={handleNavigateToLeaderboard}
        onNavigateToSubscribe={handleNavigateToSubscribe}
        onNavigateToAddRoute={handleNavigateToAddRoute}
        onNavigateToRides={handleNavigateToRides}
        onNavigateToStories={handleNavigateToStories}
        isAuthenticated={isAuthenticated}
        userProfile={profile}
      />

      <AppRouter
        state={state}
        onViewModeChange={setViewMode}
        onEventSelect={handleEventSelect}
        onEnterEvent={handleEnterEvent}
        setState={setState}
        onNavigateToAddRoute={handleNavigateToAddRoute}
        onNavigateToRides={handleNavigateToRides}
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />

      <Footer
        onNavigateToLeaderboard={handleNavigateToLeaderboard}
        onNavigateToAddRoute={handleNavigateToAddRoute}
        onNavigateToTerms={handleNavigateToTerms}
        onNavigateToPrivacy={handleNavigateToPrivacy}
      />

      <HelpModal
        open={state.showHelp}
        onClose={handleCloseHelp}
      />

      <Toaster position="top-center" />

      {state.sessionSummary && (
        <SessionWelcomeModal
          open={state.showSessionWelcome}
          onClose={handleCloseSessionWelcome}
          onContinue={handleContinueSession}
          onStartFresh={handleStartFresh}
          sessionSummary={state.sessionSummary}
        />
      )}

      <AuthModal
        open={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setState({ pendingAuthEmail: undefined });

          // Handle post-auth navigation
          if (isAuthenticated && state.isInSpecificEventFlow && state.currentEvent) {
            const hasProgress = SessionManager.hasProgressForEvent(state.currentEvent);
            const startStepId = hasProgress
              ? SessionManager.getCurrentStepForEvent(state.currentEvent)
              : STEP_IDS.WELCOME;
            const startPhase = hasProgress
              ? SessionManager.getCurrentPhaseForEvent(state.currentEvent)
              : 'before';

            if (!hasProgress) {
              SessionManager.initializeEventSession(state.currentEvent);
            }

            setState({
              currentStepId: startStepId,
              currentPhase: startPhase,
              viewMode: 'onboarding'
            });
          }
        }}
        defaultTab={authModalTab}
        initialEmail={state.pendingAuthEmail}
        onNavigateToTerms={handleNavigateToTerms}
        onNavigateToPrivacy={handleNavigateToPrivacy}
      />
    </div>
  );
}

import { ThemeProvider } from 'next-themes';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" forcedTheme="dark" defaultTheme="dark" enableSystem={false}>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}