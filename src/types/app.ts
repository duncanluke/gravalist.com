// App-wide type definitions
export type ViewMode =
  | 'home'
  | 'map'
  | '500-series'
  | 'utrecht-500'
  | 'sedgefield-500'
  | 'franschhoek-500'
  | 'cape-hope-500'
  | 'onboarding'
  | 'leaderboard'
  | 'upgrade'
  | 'add-route'
  | 'terms'
  | 'privacy-policy'
  | 'reset-password';

export type Phase = 'before' | 'start' | 'end';

export type EventName =
  | 'Utrecht 500'
  | 'Sedgefield 500'
  | 'Franschhoek 500'
  | 'Cape Hope 500';

export interface AppState {
  viewMode: ViewMode;
  currentPhase: Phase;
  currentStepId: number;
  userEmail: string;
  currentEvent: EventName;
  isInSpecificEventFlow: boolean;
  agreementsCompleted: boolean;
  showHelp: boolean;
  showSessionWelcome: boolean;
  sessionSummary: any | null;
  pendingAuthEmail?: string;
}

export interface SessionSummary {
  email: string;
  currentStep: number;
  currentPhase: Phase;
  currentEvent: EventName;
}