import { Phase, EventName } from '../types/app';

interface EventSession {
  currentStepId: number;
  currentPhase: Phase;
  lastActiveAt: string;
  sessionData?: Record<string, any>;
}

interface UserSession {
  email: string;
  eventSessions: Record<string, EventSession>;
  lastActiveEvent?: EventName;
  globalLastActiveAt: string;
}

const SESSION_STORAGE_KEY = 'gravalist_user_session';
const SESSION_EXPIRY_DAYS = 30;

export class SessionManager {
  static saveSession(session: Partial<UserSession>): void {
    try {
      const existingSession = this.getSession();
      const updatedSession: UserSession = {
        email: existingSession?.email || '',
        eventSessions: existingSession?.eventSessions || {},
        ...existingSession,
        ...session,
        globalLastActiveAt: new Date().toISOString(),
      };
      
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  }

  static getSession(): UserSession | null {
    try {
      const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionData) return null;

      const session: UserSession = JSON.parse(sessionData);
      
      // Check if session has expired
      const lastActive = new Date(session.globalLastActiveAt || session.lastActiveAt);
      const now = new Date();
      const daysDiff = (now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24);
      
      if (daysDiff > SESSION_EXPIRY_DAYS) {
        this.clearSession();
        return null;
      }

      // Migrate old session format if needed
      if (session.currentStepId !== undefined || session.currentPhase !== undefined) {
        const migratedSession = this.migrateOldSession(session);
        this.saveSession(migratedSession);
        return migratedSession;
      }

      return session;
    } catch (error) {
      console.warn('Failed to retrieve session from localStorage:', error);
      return null;
    }
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
    }
  }

  static updateStepProgress(stepId: number, phase: 'before' | 'start' | 'end', eventName: EventName): void {
    const session = this.getSession();
    if (!session) return;

    const eventSessions = { ...session.eventSessions };
    eventSessions[eventName] = {
      ...eventSessions[eventName],
      currentStepId: stepId,
      currentPhase: phase,
      lastActiveAt: new Date().toISOString(),
    };

    this.saveSession({
      eventSessions,
      lastActiveEvent: eventName,
    });
  }

  static updateEvent(eventName: EventName): void {
    this.saveSession({
      lastActiveEvent: eventName,
    });
  }

  static setUserEmail(email: string): void {
    this.saveSession({
      email: email,
    });
  }

  static getUserEmail(): string | null {
    const session = this.getSession();
    return session?.email || null;
  }

  static hasValidSession(): boolean {
    const session = this.getSession();
    return session !== null && !!session.email;
  }

  static saveStepData(stepId: number, data: Record<string, any>, eventName: EventName): void {
    const session = this.getSession();
    if (!session) return;

    const eventSessions = { ...session.eventSessions };
    const eventSession = eventSessions[eventName] || { currentStepId: 0, currentPhase: 'before', lastActiveAt: new Date().toISOString() };
    
    const sessionData = eventSession.sessionData || {};
    sessionData[`step_${stepId}`] = {
      ...sessionData[`step_${stepId}`],
      ...data,
      completedAt: new Date().toISOString(),
    };

    eventSessions[eventName] = {
      ...eventSession,
      sessionData,
      lastActiveAt: new Date().toISOString(),
    };

    this.saveSession({
      eventSessions,
      lastActiveEvent: eventName,
    });
  }

  static getStepData(stepId: number, eventName: EventName): Record<string, any> | null {
    const session = this.getSession();
    if (!session?.eventSessions?.[eventName]?.sessionData) return null;

    return session.eventSessions[eventName].sessionData[`step_${stepId}`] || null;
  }

  static getAllSessionData(eventName: EventName): Record<string, any> {
    const session = this.getSession();
    return session?.eventSessions?.[eventName]?.sessionData || {};
  }

  static getSessionSummary(eventName?: EventName): {
    email: string;
    currentStep: number;
    currentPhase: string;
    currentEvent: string;
    lastActive: string;
    stepProgress: number;
  } | null {
    const session = this.getSession();
    if (!session) return null;

    const targetEvent = eventName || session.lastActiveEvent;
    if (!targetEvent) return null;

    const eventSession = session.eventSessions?.[targetEvent];
    if (!eventSession) return null;

    const totalSteps = 19; // Complete flow (0-18): before (0-9), starting (10-14), end (15-18)
    const stepProgress = Math.round((eventSession.currentStepId / totalSteps) * 100);

    return {
      email: session.email,
      currentStep: eventSession.currentStepId,
      currentPhase: eventSession.currentPhase,
      currentEvent: targetEvent,
      lastActive: eventSession.lastActiveAt,
      stepProgress,
    };
  }

  // Get event-specific session info
  static getEventSession(eventName: EventName): EventSession | null {
    const session = this.getSession();
    return session?.eventSessions?.[eventName] || null;
  }

  // Get current step for a specific event
  static getCurrentStepForEvent(eventName: EventName): number {
    const eventSession = this.getEventSession(eventName);
    return eventSession?.currentStepId || 0;
  }

  // Get current phase for a specific event
  static getCurrentPhaseForEvent(eventName: EventName): Phase {
    const eventSession = this.getEventSession(eventName);
    return eventSession?.currentPhase || 'before';
  }

  // Check if user has any progress for a specific event
  static hasProgressForEvent(eventName: EventName): boolean {
    const eventSession = this.getEventSession(eventName);
    return eventSession ? eventSession.currentStepId > 0 : false;
  }

  // Initialize a new event session
  static initializeEventSession(eventName: EventName): void {
    const session = this.getSession();
    if (!session) return;

    const eventSessions = { ...session.eventSessions };
    if (!eventSessions[eventName]) {
      eventSessions[eventName] = {
        currentStepId: 0,
        currentPhase: 'before',
        lastActiveAt: new Date().toISOString(),
      };

      this.saveSession({
        eventSessions,
        lastActiveEvent: eventName,
      });
    }
  }

  // Migration helper for old session format
  private static migrateOldSession(oldSession: any): UserSession {
    const eventName = oldSession.currentEvent || 'Utrecht 500';
    const eventSessions: Record<string, EventSession> = {};
    
    if (oldSession.currentStepId !== undefined) {
      eventSessions[eventName] = {
        currentStepId: oldSession.currentStepId,
        currentPhase: oldSession.currentPhase || 'before',
        lastActiveAt: oldSession.lastActiveAt || new Date().toISOString(),
        sessionData: oldSession.sessionData,
      };
    }

    return {
      email: oldSession.email || '',
      eventSessions,
      lastActiveEvent: eventName,
      globalLastActiveAt: oldSession.lastActiveAt || new Date().toISOString(),
    };
  }
}