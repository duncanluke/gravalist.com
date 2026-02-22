import { EventName, ViewMode } from '../types/app';

// Step IDs for better readability
export const STEP_IDS = {
  EMAIL_COLLECTION: 0,
  WELCOME: 1,
  ABOUT_YOU: 2,
} as const;

// Event to ViewMode mapping
export const EVENT_VIEW_MODE_MAP: Record<EventName, ViewMode> = {
  'Utrecht 500': 'utrecht-500',
  'Sedgefield 500': 'sedgefield-500',
  'Franschhoek 500': 'franschhoek-500',
  'Cape Hope 500': 'cape-hope-500',
} as const;

// Default app state
export const DEFAULT_APP_STATE = {
  viewMode: 'home' as ViewMode,
  currentPhase: 'before' as const,
  currentStepId: STEP_IDS.EMAIL_COLLECTION,
  userEmail: '',
  currentEvent: 'Utrecht 500' as EventName,
  isInSpecificEventFlow: false,
  agreementsCompleted: false,
  showHelp: false,
  showSessionWelcome: false,
  sessionSummary: null,
};