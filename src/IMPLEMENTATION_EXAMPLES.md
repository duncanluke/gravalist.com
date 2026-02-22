# Implementation Examples

Quick reference for implementing the simplified event navigation flow.

## Table of Contents
1. [App.tsx Integration](#apptsx-integration)
2. [HomePage Updates](#homepage-updates)
3. [OnboardingRouter Simplification](#onboardingrouter-simplification)
4. [Error Handling](#error-handling)
5. [Testing Examples](#testing-examples)

---

## App.tsx Integration

### Replace Old Hook with New

```typescript
import { useSimplifiedEventNavigation } from './hooks/useSimplifiedEventNavigation';

function AppContent() {
  const { state, setState, setViewMode } = useAppState();
  const { user, isAuthenticated } = useAuth();
  
  // OLD: Complex hook with multiple handlers
  // const { handleEventSelect, handleEnterEvent } = useEventNavigation({
  //   userEmail: user?.email || state.userEmail,
  //   setState,
  //   isAuthenticated
  // });

  // NEW: Simple hook with single handler
  const { joinEvent, resumePendingAction } = useSimplifiedEventNavigation({
    userEmail: user?.email || state.userEmail,
    setState,
    isAuthenticated
  });

  // Add: Resume after authentication
  useEffect(() => {
    if (isAuthenticated) {
      resumePendingAction();
    }
  }, [isAuthenticated, resumePendingAction]);

  return (
    <div className="min-h-screen bg-black">
      <AppRouter 
        state={state}
        onViewModeChange={setViewMode}
        // OLD: onEventSelect={handleEventSelect}
        // OLD: onEnterEvent={handleEnterEvent}
        // NEW: Single handler for everything
        onJoinEvent={joinEvent}
        setState={setState}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
```

---

## HomePage Updates

### Update Event Cards

```typescript
import { Button } from './ui/button';

export function HomePage({ 
  onJoinEvent, // NEW: Single handler
  userEmail 
}: HomePageProps) {
  
  return (
    <div>
      {events.map((event) => {
        const progress = getUserProgress(event.id, event.name);
        
        return (
          <Card key={event.id}>
            <CardContent>
              <h3>{event.name}</h3>
              
              {/* Progress Bar (if user has started) */}
              {progress && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${progress.progressPercent}%` }}
                  />
                </div>
              )}
              
              {/* Action Button */}
              <Button 
                onClick={() => onJoinEvent(event.name)} // ✅ Simple!
                className="w-full"
              >
                {progress?.isCompleted ? (
                  <>
                    <Award className="w-4 h-4 mr-2" />
                    View Completed Journey
                  </>
                ) : progress?.currentStep > 0 ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Continue Journey
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {userEmail ? 'Start Journey' : 'Join Adventure'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

### Props Interface

```typescript
// OLD: Confusing dual handlers
interface HomePageProps {
  onViewRides: () => void;
  onEventSelect?: (eventName: string) => void;  // ❌ Remove
  onEnterEvent?: (eventName: string) => void;   // ❌ Remove
  userEmail?: string;
}

// NEW: Single clear handler
interface HomePageProps {
  onViewRides: () => void;
  onJoinEvent: (eventName: string) => void;  // ✅ Single entry point
  userEmail?: string;
}
```

---

## OnboardingRouter Simplification

### Remove Complex Sync Logic

```typescript
import { getPhaseForStep } from '../utils/onboardingHelpers';

export function OnboardingRouter({ state, setState }: OnboardingRouterProps) {
  const { isAuthenticated } = useAuth();
  const { events, updateStepProgress, getCurrentStepForEvent } = useEvents();

  // OLD: Complex dual-source sync
  // const databaseStep = getCurrentStepForEvent(currentEvent.id);
  // const sessionStep = SessionManager.getCurrentStepForEvent(state.currentEvent);
  // const correctStep = Math.max(databaseStep, sessionStep); // ❌ Sync issues
  // if (correctStep > currentStateStep) {
  //   const correctPhase = getPhaseForStep(correctStep);
  //   setState({ currentStepId: correctStep, currentPhase: correctPhase });
  //   SessionManager.updateStepProgress(correctStep, correctPhase, state.currentEvent);
  // }

  // NEW: Simple DB-only sync (if needed)
  useEffect(() => {
    if (isAuthenticated && state.currentEvent) {
      const event = events.find(e => e.name === state.currentEvent);
      if (event) {
        const databaseStep = getCurrentStepForEvent(event.id);
        // Only sync if DB is ahead (user progressed on another device)
        if (databaseStep > state.currentStepId) {
          const correctPhase = getPhaseForStep(databaseStep);
          setState({ 
            currentStepId: databaseStep,
            currentPhase: correctPhase 
          });
        }
      }
    }
  }, [isAuthenticated, state.currentEvent, events, getCurrentStepForEvent, setState]);

  // Use helper functions
  const handleStepChange = async (stepId: number) => {
    const phase = getPhaseForStep(stepId); // ✅ Centralized
    
    setState({ 
      currentStepId: stepId,
      currentPhase: phase
    });
    
    // Update cache
    if (state.currentEvent) {
      SessionManager.updateStepProgress(stepId, phase, state.currentEvent);
    }
    
    // Save to DB
    if (isAuthenticated && state.currentEvent) {
      const event = events.find(e => e.name === state.currentEvent);
      if (event) {
        await updateStepProgress(event.id, {
          stepId,
          phase,
          stepData: { timestamp: new Date().toISOString() }
        });
      }
    }
  };

  return (
    <SimplifiedOnboardingLayout>
      <OnboardingStepRenderer 
        currentStep={state.currentStepId}
        onNext={() => handleStepChange(state.currentStepId + 1)}
      />
    </SimplifiedOnboardingLayout>
  );
}
```

---

## Error Handling

### Using Centralized Error Handler

```typescript
import { 
  handleOnboardingError, 
  OnboardingErrors,
  logError 
} from '../utils/errorHandler';

async function someFunction(eventName: string) {
  try {
    // 1. Validate input
    if (!eventName) {
      throw OnboardingErrors.invalidState('Event name is required');
    }

    // 2. Find event
    const event = events.find(e => e.name === eventName);
    if (!event) {
      throw OnboardingErrors.eventNotFound(eventName);
    }

    // 3. Check auth
    if (!isAuthenticated) {
      throw OnboardingErrors.authRequired();
    }

    // 4. Fetch data
    try {
      await fetchStepProgress(event.id);
    } catch (error) {
      // Non-critical error - log but don't throw
      logError('PROGRESS_FETCH_FAILED', 'Could not fetch progress', {
        eventId: event.id,
        eventName: event.name
      });
      // Continue with default step
    }

    // 5. Success path...

  } catch (error) {
    // Centralized error handling
    // - Logs technical details
    // - Shows user-friendly toast
    // - Proper error types
    handleOnboardingError(error);
  }
}
```

### Custom Errors

```typescript
import { OnboardingError } from '../utils/errorHandler';

// Create custom error for specific scenario
function validateEventData(event: Event) {
  if (!event.id) {
    throw new OnboardingError(
      `Event missing ID: ${JSON.stringify(event)}`,
      'INVALID_STATE',
      'This event is not configured correctly. Please contact support.',
      false // not recoverable - needs admin fix
    );
  }
  
  if (!event.name) {
    throw new OnboardingError(
      `Event missing name: ${event.id}`,
      'INVALID_STATE',
      'This event is not configured correctly. Please contact support.',
      false
    );
  }
}
```

---

## Testing Examples

### Unit Tests for Helpers

```typescript
import { 
  getPhaseForStep, 
  resolveStartStep,
  isValidStep,
  calculateProgress 
} from '../utils/onboardingHelpers';

describe('onboardingHelpers', () => {
  describe('getPhaseForStep', () => {
    it('returns "before" for steps 0-9', () => {
      expect(getPhaseForStep(0)).toBe('before');
      expect(getPhaseForStep(5)).toBe('before');
      expect(getPhaseForStep(9)).toBe('before');
    });

    it('returns "start" for steps 10-14', () => {
      expect(getPhaseForStep(10)).toBe('start');
      expect(getPhaseForStep(12)).toBe('start');
      expect(getPhaseForStep(14)).toBe('start');
    });

    it('returns "end" for steps 15+', () => {
      expect(getPhaseForStep(15)).toBe('end');
      expect(getPhaseForStep(16)).toBe('end');
      expect(getPhaseForStep(17)).toBe('end');
    });
  });

  describe('resolveStartStep', () => {
    it('returns 1 when dbStep is 0', () => {
      expect(resolveStartStep(0)).toBe(1);
    });

    it('returns dbStep when > 0', () => {
      expect(resolveStartStep(5)).toBe(5);
      expect(resolveStartStep(15)).toBe(15);
    });
  });

  describe('isValidStep', () => {
    it('returns true for valid steps', () => {
      expect(isValidStep(0)).toBe(true);
      expect(isValidStep(9)).toBe(true);
      expect(isValidStep(17)).toBe(true);
    });

    it('returns false for invalid steps', () => {
      expect(isValidStep(-1)).toBe(false);
      expect(isValidStep(18)).toBe(false);
      expect(isValidStep(100)).toBe(false);
    });

    it('returns false for non-integers', () => {
      expect(isValidStep(5.5)).toBe(false);
      expect(isValidStep(NaN)).toBe(false);
    });
  });

  describe('calculateProgress', () => {
    it('calculates correct percentage', () => {
      expect(calculateProgress(0)).toBe(0);
      expect(calculateProgress(8)).toBe(47); // 8/17 * 100 ≈ 47
      expect(calculateProgress(17)).toBe(100);
    });
  });
});
```

### Integration Tests for joinEvent

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useSimplifiedEventNavigation } from '../hooks/useSimplifiedEventNavigation';

describe('useSimplifiedEventNavigation', () => {
  const mockSetState = jest.fn();
  const mockEvents = [
    { id: '1', name: 'Test Event 500' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows auth modal when not authenticated', async () => {
    const { result } = renderHook(() =>
      useSimplifiedEventNavigation({
        userEmail: '',
        setState: mockSetState,
        isAuthenticated: false
      })
    );

    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    await act(async () => {
      await result.current.joinEvent('Test Event 500');
    });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'requestAuth'
      })
    );
  });

  it('navigates to onboarding when authenticated', async () => {
    // Mock fetchStepProgress to return step 0
    const mockFetchStepProgress = jest.fn().mockResolvedValue(undefined);
    const mockGetCurrentStepForEvent = jest.fn().mockReturnValue(0);

    const { result } = renderHook(() =>
      useSimplifiedEventNavigation({
        userEmail: 'user@example.com',
        setState: mockSetState,
        isAuthenticated: true
      })
    );

    await act(async () => {
      await result.current.joinEvent('Test Event 500');
    });

    expect(mockSetState).toHaveBeenCalledWith({
      currentEvent: 'Test Event 500',
      currentStepId: 1, // resolveStartStep(0) = 1
      currentPhase: 'before', // getPhaseForStep(1) = 'before'
      viewMode: 'onboarding'
    });
  });

  it('resumes at correct step for returning user', async () => {
    const mockGetCurrentStepForEvent = jest.fn().mockReturnValue(5);

    await act(async () => {
      await result.current.joinEvent('Test Event 500');
    });

    expect(mockSetState).toHaveBeenCalledWith({
      currentEvent: 'Test Event 500',
      currentStepId: 5, // resolveStartStep(5) = 5
      currentPhase: 'before', // getPhaseForStep(5) = 'before'
      viewMode: 'onboarding'
    });
  });

  it('handles event not found error', async () => {
    const mockToast = jest.fn();
    jest.mock('sonner@2.0.3', () => ({ toast: { error: mockToast } }));

    await act(async () => {
      await result.current.joinEvent('Nonexistent Event');
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.stringContaining('couldn\'t find')
    );
    expect(mockSetState).not.toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
describe('Join Event Flow', () => {
  it('completes full journey for new user', async () => {
    // 1. Start on home page
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]');

    // 2. Click join event
    await page.click('[data-testid="join-test-event-500"]');

    // 3. See auth modal (not authenticated)
    await page.waitForSelector('[data-testid="auth-modal"]');

    // 4. Sign up
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signup-button"]');

    // 5. Auto-resume and land on onboarding step 1 (Welcome)
    await page.waitForSelector('[data-testid="welcome-step"]');
    expect(await page.textContent('h1')).toContain('Welcome');

    // 6. Progress through steps
    await page.click('[data-testid="next-button"]');
    await page.waitForSelector('[data-testid="about-you-step"]');

    // 7. Verify progress saved
    const progress = await page.evaluate(() => {
      const session = localStorage.getItem('gravalist_user_session');
      return JSON.parse(session || '{}');
    });
    expect(progress.eventSessions['Test Event 500'].currentStepId).toBe(2);
  });

  it('resumes correctly for returning user', async () => {
    // 1. Set up user with existing progress (step 5)
    await page.evaluate(() => {
      localStorage.setItem('gravalist_user_session', JSON.stringify({
        email: 'returning@example.com',
        eventSessions: {
          'Test Event 500': {
            currentStepId: 5,
            currentPhase: 'before',
            lastActiveAt: new Date().toISOString()
          }
        }
      }));
    });

    // 2. Navigate to home
    await page.goto('/');

    // 3. Click event
    await page.click('[data-testid="join-test-event-500"]');

    // 4. Should land on step 5 (not step 1)
    await page.waitForSelector('[data-testid="step-5"]');
    const stepNumber = await page.evaluate(() => 
      document.querySelector('[data-testid="step-indicator"]')?.textContent
    );
    expect(stepNumber).toContain('5');
  });
});
```

---

## Quick Migration Checklist

### Phase 1: Add New Files ✅
- [ ] Copy `/utils/onboardingHelpers.ts`
- [ ] Copy `/utils/errorHandler.ts`
- [ ] Copy `/hooks/useSimplifiedEventNavigation.ts`
- [ ] Run tests: `npm test`

### Phase 2: Update App.tsx
- [ ] Import new hook
- [ ] Replace `useEventNavigation` with `useSimplifiedEventNavigation`
- [ ] Add `resumePendingAction` effect
- [ ] Update props passed to AppRouter
- [ ] Test in browser

### Phase 3: Update Components
- [ ] Update HomePage props and handlers
- [ ] Update event detail pages
- [ ] Replace all `onEventSelect`/`onEnterEvent` with `onJoinEvent`
- [ ] Test each page

### Phase 4: Simplify OnboardingRouter
- [ ] Import `getPhaseForStep` helper
- [ ] Replace inline phase calculations
- [ ] Simplify sync logic
- [ ] Test onboarding flow

### Phase 5: Cleanup
- [ ] Remove `isInSpecificEventFlow` from types
- [ ] Remove old `useEventNavigation` hook
- [ ] Remove excessive logging
- [ ] Update documentation

---

## Common Patterns

### Loading States

```typescript
const { joinEvent } = useSimplifiedEventNavigation(...);
const [isJoining, setIsJoining] = useState(false);

const handleJoin = async (eventName: string) => {
  setIsJoining(true);
  try {
    await joinEvent(eventName);
  } finally {
    setIsJoining(false);
  }
};

return (
  <Button 
    onClick={() => handleJoin(event.name)}
    disabled={isJoining}
  >
    {isJoining ? 'Loading...' : 'Join Event'}
  </Button>
);
```

### Optimistic UI

```typescript
const handleJoin = async (eventName: string) => {
  // Optimistic: navigate immediately
  setState({ 
    currentEvent: eventName,
    viewMode: 'onboarding' 
  });

  // Then fetch actual progress in background
  try {
    await joinEvent(eventName);
  } catch (error) {
    // Rollback on error
    setState({ viewMode: 'home' });
    handleOnboardingError(error);
  }
};
```

### Retry Logic

```typescript
const joinEventWithRetry = async (eventName: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await joinEvent(eventName);
      return; // Success
    } catch (error) {
      if (i === retries - 1) {
        // Last attempt failed
        handleOnboardingError(error);
      } else {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
};
```

---

That's it! You now have complete examples for implementing the simplified event navigation flow. Refer to the other documentation files for deeper technical details and migration strategies.
