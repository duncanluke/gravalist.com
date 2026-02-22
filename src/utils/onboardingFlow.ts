import { Phase as AppPhase, EventName } from '../types/app';

export interface SubStep {
  id: number;
  title: string;
  description: string;
  status: 'done' | 'active' | 'pending' | 'locked';
}

export interface Phase {
  id: AppPhase;
  title: string;
  description: string;
  steps: SubStep[];
}

export interface Event {
  name: EventName;
  location: string;
  date: string;
}

// Re-export for backward compatibility
export type { Phase as PhaseType } from '../types/app';

export const createOnboardingFlow = (
  currentStepId: number,
  currentEvent: string
): Phase[] => {
  const getStepStatus = (stepId: number): 'done' | 'active' | 'pending' | 'locked' => {
    if (stepId < currentStepId) return 'done';
    if (stepId === currentStepId) return 'active';
    return 'pending';
  };

  return [
    {
      id: 'before',
      title: 'Before Ride',
      description: 'Pre-ride preparation and setup',
      steps: [
        { 
          id: 0, 
          title: 'Email Address', 
          description: 'Enter your email to begin', 
          status: getStepStatus(0) 
        },
        { 
          id: 1, 
          title: `Welcome to ${currentEvent}`, 
          description: 'Ride introduction and overview', 
          status: getStepStatus(1) 
        },
        { 
          id: 2, 
          title: 'About You', 
          description: 'Tell us about yourself', 
          status: getStepStatus(2) 
        },
        { 
          id: 3, 
          title: 'Download Route', 
          description: 'Get the official GPX file', 
          status: getStepStatus(3) 
        },
        { 
          id: 4, 
          title: 'Equipment Checklist', 
          description: 'Review gear you have ready', 
          status: getStepStatus(4) 
        },
        { 
          id: 5, 
          title: 'Accept Terms', 
          description: 'Agree to safety guidelines', 
          status: getStepStatus(5) 
        },
        { 
          id: 6, 
          title: 'Medical Insurance', 
          description: 'Upload insurance proof', 
          status: getStepStatus(6) 
        },
        { 
          id: 7, 
          title: 'Community Support', 
          description: 'No Official Support — Rider-to-Rider Help Only', 
          status: getStepStatus(7) 
        },
        { 
          id: 8, 
          title: 'Registration Almost Complete', 
          description: 'Finalizing your ride registration', 
          status: getStepStatus(8) 
        },
        { 
          id: 9, 
          title: 'Ready to Ride', 
          description: "You're all set for the ride", 
          status: getStepStatus(9) 
        },
      ]
    },
    {
      id: 'start',
      title: 'Starting Ride',
      description: 'Ride execution and tracking',
      steps: [
        { 
          id: 10, 
          title: 'Start', 
          description: 'Countdown to ride start', 
          status: getStepStatus(10) 
        },
        { 
          id: 11, 
          title: 'Starting Photo', 
          description: 'Take your start line photo', 
          status: getStepStatus(11) 
        },
        { 
          id: 12, 
          title: 'Pre-Ride Check', 
          description: 'How are you feeling?', 
          status: getStepStatus(12) 
        },
        { 
          id: 13, 
          title: 'Ride Start', 
          description: 'Official ride countdown', 
          status: getStepStatus(13) 
        },
        { 
          id: 14, 
          title: 'GO GO GO!', 
          description: 'Your adventure begins!', 
          status: getStepStatus(14) 
        },
      ]
    },
    {
      id: 'end',
      title: 'Finishing Ride',
      description: 'Complete your journey and share results',
      steps: [
        { 
          id: 15, 
          title: 'Welcome Back!', 
          description: 'Congratulations on completing your ride', 
          status: getStepStatus(15) 
        },
        { 
          id: 16, 
          title: 'Post-Ride Reflection', 
          description: 'Share your experience', 
          status: getStepStatus(16) 
        },
        { 
          id: 17, 
          title: 'Complete', 
          description: 'Journey finished!', 
          status: getStepStatus(17) 
        },
      ]
    }
  ];
};

export const getAvailableEvents = (): Event[] => [
  { name: 'Utrecht 500', location: 'Utrecht, Netherlands', date: 'Sep 19, 2025' },
  { name: 'Sedgefield 500', location: 'Sedgefield, South Africa', date: 'Oct 12, 2024' },
  { name: 'Franschhoek 500', location: 'Franschhoek, South Africa', date: 'Nov 8, 2024' },
  { name: 'Cape Hope 500', location: 'Cape of Good Hope, South Africa', date: 'Feb 14, 2025' }
];

export const getPrimaryActionForStep = (
  stepId: number, 
  agreementsCompleted: boolean
): { label: string; onClick: () => void; disabled: boolean } | undefined => {
  switch (stepId) {
    case 5:
      return agreementsCompleted 
        ? undefined 
        : {
            label: 'Complete Signatures',
            onClick: () => {},
            disabled: true
          };
    case 9:
      return {
        label: 'Ready for Ride Day',
        onClick: () => {},
        disabled: true
      };
    case 17:
      return {
        label: 'Complete Journey',
        onClick: () => {},
        disabled: true
      };
    default:
      return undefined;
  }
};