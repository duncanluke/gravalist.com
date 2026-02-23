import React from 'react';
import { HomePage } from './HomePage';
import { MapPage } from './MapPage';
import { RidesPage } from './RidesPage';
import { Utrecht500Page } from './Utrecht500Page';
import { Sedgefield500Page } from './Sedgefield500Page';
import { Franschhoek500Page } from './Franschhoek500Page';
import { CapeHope500Page } from './CapeHope500Page';
import { DynamicEventPage } from './DynamicEventPage';

import { LeaderboardPage } from './LeaderboardPage';
import { UpgradePage } from './UpgradePage';
import { AddRoutePage } from './AddRoutePage';
import { OnboardingRouter } from './OnboardingRouter';
import { TermsPage } from './TermsPage';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { AuthCallback } from './AuthCallback';
import { VerificationCallback } from './VerificationCallback';
import { StoriesPage } from './StoriesPage';
import { StoryDetailPage } from './StoryDetailPage';
import { ResetPasswordPage } from './ResetPasswordPage';

import { AppState, ViewMode, EventName } from '../types/app';

interface AppRouterProps {
  state: AppState;
  onViewModeChange: (viewMode: ViewMode) => void;
  onEventSelect: (eventName: string) => void;
  onEnterEvent: (eventName: string) => void;
  setState: (updates: Partial<AppState>) => void;
  onNavigateToAddRoute: () => void;
  onNavigateToRides: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function AppRouter({
  state,
  onViewModeChange,
  onEventSelect,
  onEnterEvent,
  setState,
  onNavigateToAddRoute,
  onNavigateToRides,
  isAuthenticated,
  authLoading,
  currentPath,
  onNavigate
}: AppRouterProps) {
  const renderPage = () => {
    switch (state.viewMode) {
      case 'home':
      case 'map':
      case '500-series':
        return (
          <HomePage
            onViewRides={() => onViewModeChange('home')}
            onEventSelect={onEventSelect}
            onEnterEvent={onEnterEvent}
            onNavigateToLeaderboard={() => onViewModeChange('leaderboard')}
            onNavigateToAddRoute={onNavigateToAddRoute}
            userEmail={state.userEmail}
          />
        );

      case 'utrecht-500':
        return (
          <Utrecht500Page
            onEnterEvent={() => onEnterEvent('Utrecht 500')}
          />
        );

      case 'sedgefield-500':
        return (
          <Sedgefield500Page
            onEnterEvent={() => onEnterEvent('Sedgefield 500')}
          />
        );

      case 'franschhoek-500':
        return (
          <Franschhoek500Page
            onEnterEvent={() => onEnterEvent('Franschhoek 500')}
          />
        );

      case 'cape-hope-500':
        return (
          <CapeHope500Page
            onEnterEvent={() => onEnterEvent('Cape Hope 500')}
          />
        );



      case 'leaderboard':
        return (
          <LeaderboardPage
            onBackToHome={() => onViewModeChange('home')}
            onNavigateToAddRoute={onNavigateToAddRoute}
          />
        );

      case 'upgrade':
        return (
          <UpgradePage
            onUpgrade={() => {
              console.log('Processing upgrade...');
            }}
            onNavigateToHome={() => onViewModeChange('home')}
            onNavigateToLeaderboard={() => onViewModeChange('leaderboard')}
            onNavigateToRides={() => onViewModeChange('500-series')}
          />
        );

      case 'add-route':
        return (
          <AddRoutePage
            onNavigateBack={() => onViewModeChange('500-series')}
            isAuthenticated={isAuthenticated}
            authLoading={authLoading}
          />
        );

      case 'onboarding':
        return (
          <OnboardingRouter
            state={state}
            onViewModeChange={onViewModeChange}
            setState={setState}
          />
        );

      case 'terms':
        return (
          <TermsPage
            onNavigateBack={() => onViewModeChange('home')}
          />
        );

      case 'privacy':
        return (
          <PrivacyPolicyPage
            onNavigateBack={() => onViewModeChange('home')}
          />
        );

      case 'reset-password':
        return (
          <ResetPasswordPage
            onNavigateToHome={() => {
              onNavigate('/');
              onViewModeChange('home');
            }}
          />
        );

      default:
        // Handle stories routing
        if (currentPath === '/stories') {
          return (
            <StoriesPage
              onNavigateBack={() => onNavigate('/')}
              onSelectStory={(slug) => onNavigate(`/stories/${slug}`)}
            />
          );
        }

        if (currentPath.startsWith('/stories/')) {
          const slug = currentPath.split('/stories/')[1];
          return (
            <StoryDetailPage
              slug={slug}
              onNavigateBack={() => onNavigate('/stories')}
            />
          );
        }

        // Check if it's a dynamic event page (e.g., "clarens-500", "burra-500", "transubafrica")
        const viewModeStr = state.viewMode as string;
        if (viewModeStr.endsWith('-500') || viewModeStr === 'transubafrica' || viewModeStr.endsWith('-8848') || viewModeStr === 'egoli-500_riders') {
          return (
            <DynamicEventPage
              eventSlug={viewModeStr}
              onEnterEvent={onEnterEvent}
            />
          );
        }
        return null;
    }
  };

  const getPageMaxWidth = () => {
    switch (state.viewMode) {
      case 'add-route':
        return 'w-full';
      case 'home':
      case 'map':
      case '500-series':
        return 'w-full max-w-sm md:max-w-2xl lg:max-w-6xl';
      case 'leaderboard':
      case 'terms':
      case 'privacy':
        return 'w-full max-w-sm md:max-w-2xl lg:max-w-4xl';
      case 'onboarding':
        return 'w-full max-w-sm md:max-w-lg';
      default:
        return 'w-full max-w-sm md:max-w-2xl lg:max-w-3xl';
    }
  };

  const getPagePadding = () => {
    switch (state.viewMode) {
      case 'add-route':
        return 'pt-36 pb-16 px-4';
      case 'onboarding':
        return 'pt-20 md:pt-32 pb-28 px-4 flex justify-center min-h-screen';
      default:
        return 'pt-36 pb-16 px-4 flex justify-center';
    }
  };

  const containerClasses = getPagePadding();
  const contentClasses = getPageMaxWidth();

  return (
    <div className={containerClasses}>
      {state.viewMode === 'add-route' ? (
        renderPage()
      ) : (
        <div className={contentClasses}>
          {renderPage()}
        </div>
      )}
    </div>
  );
}