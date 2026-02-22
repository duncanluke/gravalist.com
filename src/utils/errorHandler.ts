import { toast } from 'sonner@2.0.3';

/**
 * Error codes for different onboarding failure scenarios
 */
export type OnboardingErrorCode =
  | 'EVENT_NOT_FOUND'
  | 'AUTH_REQUIRED'
  | 'PROGRESS_FETCH_FAILED'
  | 'PROGRESS_UPDATE_FAILED'
  | 'EVENT_FETCH_FAILED'
  | 'INVALID_STATE'
  | 'NETWORK_ERROR';

/**
 * Custom error class for onboarding-related errors
 */
export class OnboardingError extends Error {
  constructor(
    message: string,
    public code: OnboardingErrorCode,
    public userMessage: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'OnboardingError';
  }
}

/**
 * Centralized error handler for onboarding flow
 */
export function handleOnboardingError(error: unknown): void {
  if (error instanceof OnboardingError) {
    // Log technical details for debugging
    console.error(`[${error.code}] ${error.message}`, {
      recoverable: error.recoverable,
      timestamp: new Date().toISOString()
    });

    // Show user-friendly message
    toast.error(error.userMessage, {
      duration: error.recoverable ? 5000 : 10000
    });
  } else if (error instanceof Error) {
    // Generic error fallback
    console.error('[UNKNOWN_ERROR]', error);
    toast.error('Something went wrong. Please try again.');
  } else {
    // Unknown error type
    console.error('[UNKNOWN_ERROR_TYPE]', error);
    toast.error('An unexpected error occurred.');
  }
}

/**
 * Create a standardized error for common scenarios
 */
export const OnboardingErrors = {
  eventNotFound: (eventName: string) =>
    new OnboardingError(
      `Event with name "${eventName}" not found in database`,
      'EVENT_NOT_FOUND',
      `We couldn't find the event "${eventName}". Please try selecting a different event.`,
      true
    ),

  authRequired: () =>
    new OnboardingError(
      'User must be authenticated to continue',
      'AUTH_REQUIRED',
      'Please sign in to continue with your journey.',
      true
    ),

  progressFetchFailed: (eventName: string, originalError?: unknown) =>
    new OnboardingError(
      `Failed to fetch progress for event "${eventName}": ${originalError}`,
      'PROGRESS_FETCH_FAILED',
      'We had trouble loading your progress. Starting from the beginning.',
      true
    ),

  progressUpdateFailed: (eventName: string, step: number) =>
    new OnboardingError(
      `Failed to save progress for event "${eventName}" at step ${step}`,
      'PROGRESS_UPDATE_FAILED',
      'We couldn\'t save your progress. Your local session is safe, but you may need to reconnect.',
      true
    ),

  eventFetchFailed: (originalError?: unknown) =>
    new OnboardingError(
      `Failed to fetch events from server: ${originalError}`,
      'EVENT_FETCH_FAILED',
      'We couldn\'t load available events. Please check your connection and try again.',
      true
    ),

  invalidState: (details: string) =>
    new OnboardingError(
      `Invalid application state: ${details}`,
      'INVALID_STATE',
      'Something went wrong. Please refresh the page.',
      false
    ),

  networkError: (operation: string) =>
    new OnboardingError(
      `Network error during ${operation}`,
      'NETWORK_ERROR',
      'Connection issue detected. Please check your internet connection.',
      true
    )
};

/**
 * Type guard to check if error is an OnboardingError
 */
export function isOnboardingError(error: unknown): error is OnboardingError {
  return error instanceof OnboardingError;
}

/**
 * Log error without showing toast (for non-critical errors)
 */
export function logError(code: OnboardingErrorCode, message: string, context?: Record<string, any>): void {
  console.warn(`[${code}] ${message}`, context);
}
