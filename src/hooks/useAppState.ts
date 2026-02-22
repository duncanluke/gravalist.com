import { useReducer, useCallback, useEffect } from 'react';
import { AppState, ViewMode, Phase, EventName } from '../types/app';
import { DEFAULT_APP_STATE } from '../constants/app';
import { CacheManager } from '../utils/cacheManager';

type AppAction = 
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_USER_EMAIL'; payload: string }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_CURRENT_PHASE'; payload: Phase }
  | { type: 'SET_CURRENT_EVENT'; payload: EventName }
  | { type: 'SET_SPECIFIC_FLOW'; payload: boolean }
  | { type: 'SET_AGREEMENTS_COMPLETED'; payload: boolean }
  | { type: 'SET_SHOW_HELP'; payload: boolean }
  | { type: 'SET_SHOW_SESSION_WELCOME'; payload: boolean }
  | { type: 'SET_SESSION_SUMMARY'; payload: any }
  | { type: 'UPDATE_MULTIPLE'; payload: Partial<AppState> }
  | { type: 'RESET_STATE' };

function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_USER_EMAIL':
      return { ...state, userEmail: action.payload };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStepId: action.payload };
    case 'SET_CURRENT_PHASE':
      return { ...state, currentPhase: action.payload };
    case 'SET_CURRENT_EVENT':
      return { ...state, currentEvent: action.payload };
    case 'SET_SPECIFIC_FLOW':
      return { ...state, isInSpecificEventFlow: action.payload };
    case 'SET_AGREEMENTS_COMPLETED':
      return { ...state, agreementsCompleted: action.payload };
    case 'SET_SHOW_HELP':
      return { ...state, showHelp: action.payload };
    case 'SET_SHOW_SESSION_WELCOME':
      return { ...state, showSessionWelcome: action.payload };
    case 'SET_SESSION_SUMMARY':
      return { ...state, sessionSummary: action.payload };
    case 'UPDATE_MULTIPLE':
      return { ...state, ...action.payload };
    case 'RESET_STATE':
      return DEFAULT_APP_STATE;
    default:
      return state;
  }
}

export function useAppState() {
  // Initialize with cached state if available
  const initializeState = (): AppState => {
    const cachedState = CacheManager.getAppState<Partial<AppState>>()
    if (cachedState) {
      return { ...DEFAULT_APP_STATE, ...cachedState }
    }
    return DEFAULT_APP_STATE
  }

  const [state, dispatch] = useReducer(appStateReducer, initializeState())

  // Cache state changes for persistence
  useEffect(() => {
    CacheManager.setAppState(state)
  }, [state])

  const setState = useCallback((updates: Partial<AppState>) => {
    dispatch({ type: 'UPDATE_MULTIPLE', payload: updates });
  }, []);

  const setViewMode = useCallback((viewMode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: viewMode });
  }, []);

  const setUserEmail = useCallback((email: string) => {
    dispatch({ type: 'SET_USER_EMAIL', payload: email });
  }, []);

  const setCurrentStep = useCallback((stepId: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: stepId });
  }, []);

  const setCurrentPhase = useCallback((phase: Phase) => {
    dispatch({ type: 'SET_CURRENT_PHASE', payload: phase });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  return {
    state,
    setState,
    setViewMode,
    setUserEmail,
    setCurrentStep,
    setCurrentPhase,
    resetState,
  };
}