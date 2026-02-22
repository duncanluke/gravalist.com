import React, { useEffect } from 'react';
import { WelcomeStep } from './steps/WelcomeStep';
import { AboutYouStep } from './steps/AboutYouStep';
import { SubscriberRouteDownloadStep } from './steps/SubscriberRouteDownloadStep';
import { EquipmentDownloadStep } from './steps/EquipmentDownloadStep';
import { AgreementsStep } from './steps/AgreementsStep';
import { OnboardingFormStep } from './steps/OnboardingFormStep';
import { CommunitySupport } from './steps/CommunitySupport';

import { ReadyToRideStep } from './steps/ReadyToRideStep';
import { StartStep } from './steps/StartStep';
import { StartingPhotoStep } from './steps/StartingPhotoStep';
import { PreRideCheckStep } from './steps/PreRideCheckStep';
import { RideStartStep } from './steps/RideStartStep';
import { GoGoGoStep } from './steps/GoGoGoStep';
import { RideEndConfirmationStep } from './steps/RideEndConfirmationStep';

import { PostRideReflectionStep } from './steps/PostRideReflectionStep';
import { FinishStep } from './steps/FinishStep';
import { RegistrationAlmostCompleteStep } from './steps/RegistrationAlmostCompleteStep';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';

interface OnboardingStepRendererProps {
  currentStepId: number;
  currentEvent: string;
  userEmail: string;
  onAboutYouSubmit: (data: { firstName: string; lastName: string; city: string }) => void;
  onNext: () => void;
  onFinish: () => void;
  onComplete: () => void;
  onValidationChange: (isValid: boolean) => void;
  onSkipToStep?: (stepId: number) => void;
  registrationSuccess?: boolean;
  pointsAwarded?: number;
  onAboutYouFormStateChange?: (isValid: boolean, isSubmitting: boolean, handleSubmit: () => void) => void;
}

export function OnboardingStepRenderer({
  currentStepId,
  currentEvent,
  userEmail,
  onAboutYouSubmit,
  onNext,
  onFinish,
  onComplete,
  onValidationChange,
  onSkipToStep,
  registrationSuccess = false,
  pointsAwarded = 50,
  onAboutYouFormStateChange
}: OnboardingStepRendererProps) {
  const { eventParticipants, loading, fetchEventParticipants, events } = useEvents();
  const { isAuthenticated } = useAuth();

  // Find the current event object by name
  const currentEventObject = events.find(event => event.name === currentEvent);

  // Fetch participants when on ReadyToRideStep (now step 9)
  useEffect(() => {
    if (currentStepId === 9 && currentEventObject?.id) {
      fetchEventParticipants(currentEventObject.id);
    }
  }, [currentStepId, currentEventObject?.id, fetchEventParticipants]);

  // Auto-skip EMAIL_COLLECTION step if user is authenticated
  useEffect(() => {
    if (currentStepId === 0 && isAuthenticated) {
      // Skip directly to Welcome step
      onNext();
    }
  }, [currentStepId, isAuthenticated, onNext]);

  // Step configuration with dynamic components
  const stepComponents: Record<number, React.ReactNode> = {
    0: (
      // EMAIL_COLLECTION step - show loading/auth prompt if not authenticated
      <div className="flex flex-col items-center justify-center text-center space-y-6 p-8">
        <h2>Setting up your account...</h2>
        <p className="text-muted-foreground">
          Please wait while we prepare your onboarding experience.
        </p>
      </div>
    ),
    1: (
      <WelcomeStep 
        eventName={currentEvent}
        onContinue={onNext}
      />
    ),
    2: (
      <AboutYouStep 
        onContinue={onAboutYouSubmit}
        onFormStateChange={onAboutYouFormStateChange}
      />
    ),
    3: (
      <SubscriberRouteDownloadStep 
        onContinue={onNext}
      />
    ),
    4: (
      <EquipmentDownloadStep 
        onContinue={onNext}
      />
    ),
    5: (
      <AgreementsStep 
        onContinue={onNext}
        onValidationChange={onValidationChange}
      />
    ),
    6: (
      <OnboardingFormStep 
        step="medical"
        onContinue={onNext}
      />
    ),
    7: (
      <CommunitySupport 
        onContinue={onNext}
      />
    ),
    8: (
      <RegistrationAlmostCompleteStep 
        eventName={currentEvent}
        onContinue={onNext}
      />
    ),
    9: (
      <ReadyToRideStep 
        eventName={currentEvent}
        participants={eventParticipants}
        loading={loading}
        onContinue={onNext}
        showRegistrationSuccess={false}
        pointsAwarded={0}
      />
    ),
    10: (
      <StartStep 
        onContinue={onNext}
        onFinish={onFinish}
      />
    ),
    11: (
      <StartingPhotoStep 
        onContinue={onNext}
        onFinish={onFinish}
      />
    ),
    12: (
      <PreRideCheckStep 
        onContinue={onNext}
        onFinish={onFinish}
      />
    ),
    13: (
      <RideStartStep 
        onContinue={onNext}
        onFinish={onNext}
      />
    ),
    14: (
      <GoGoGoStep 
        onContinue={onNext}
        currentEvent={currentEvent}
      />
    ),
    15: (
      <RideEndConfirmationStep 
        onContinue={onNext}
      />
    ),
    16: (
      <PostRideReflectionStep 
        onContinue={onNext}
        onFinish={onNext}
      />
    ),
    17: (
      <FinishStep 
        onContinue={onComplete}
        onFinish={onComplete}
      />
    )
  };

  return stepComponents[currentStepId] || null;
}