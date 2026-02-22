# User Flow Refactoring Analysis

## Current State Assessment

### Critical Complexity Issues

#### 1. **Multiple Entry Points & Confusing Flow**
- `handleEventSelect()` - Shows event details page OR starts onboarding (depends on progress)
- `handleEnterEvent()` - Triggers auth modal OR starts onboarding (depends on auth)
- Different logic paths for authenticated vs unauthenticated
- `isInSpecificEventFlow` flag adds unnecessary complexity

#### 2. **Dual Progress Tracking System**
- Database stores step progress (persistent, server-side)
- SessionManager stores step progress (localStorage, client-side)
- Takes `Math.max(dbStep, sessionStep)` - can cause sync issues
- Multiple sync points lead to race conditions
- No clear source of truth

#### 3. **Step Resolution Logic Complexity**
```javascript
// Current: Multiple branches for step 0, 1, >1
if (actualStep > 1) {
  resumeStep = actualStep;
  // Calculate phase from step...
} else if (actualStep === 1) {
  resumeStep = 1;
  // Different logic...
} else {
  resumeStep = STEP_IDS.WELCOME;
  // Initialize session...
}
```

#### 4. **Phase Calculation Scattered**
- Hardcoded ranges: 0-9="before", 10-14="start", 15+="end"
- Logic duplicated in multiple files
- No single source of truth
- Magic numbers everywhere

#### 5. **Event Not Found Handling**
- Error handling scattered across multiple places
- Toast errors dispatched via CustomEvents
- Different error messages for same error
- No retry logic

#### 6. **Excessive Logging**
- 50+ console.log statements in useEventNavigation alone
- Makes debugging harder, not easier
- Should use proper logging levels

---

## Simplified Architecture

### Core Principles

1. **Single Entry Point**: `joinEvent(eventName)` handles all cases
2. **Single Source of Truth**: Database is authoritative, session is cache
3. **Clear State Machine**: Event flow is a simple state machine
4. **Centralized Error Handling**: One error handler for all flows
5. **Minimal State**: Remove unnecessary flags and temporary state

---

## Refactored User Flow

### New Simplified Flow

```
User clicks "Join Event" 
    ↓
Check if authenticated
    ↓ No → Show auth modal → User signs in → Continue
    ↓ Yes
Fetch latest progress from DB
    ↓
Calculate resume point (simple: use DB step or 0)
    ↓
Navigate to onboarding at correct step
```

### Key Simplifications

1. **Remove `isInSpecificEventFlow` flag** - Not needed
2. **Remove `handleEventSelect` vs `handleEnterEvent` distinction** - Single `joinEvent()`
3. **Remove dual progress tracking** - DB is source of truth, session is write-through cache
4. **Centralize phase calculation** - Single pure function
5. **Remove step 0 vs 1 vs >1 logic** - Just use the step number

---

## Implementation Plan

### Phase 1: Create Utility Functions (No Breaking Changes)

#### File: `/utils/onboardingHelpers.ts`
```typescript
// Single source of truth for phase calculation
export function getPhaseForStep(stepId: number): Phase {
  if (stepId <= 9) return 'before';
  if (stepId <= 14) return 'start';
  return 'end';
}

// Simplified step resolution
export function resolveStartStep(dbStep: number): number {
  // Simple: trust the database, start from where they left off
  // If dbStep is 0, start at step 1 (WELCOME)
  return dbStep > 0 ? dbStep : 1;
}

// Centralized validation
export function isValidStep(stepId: number): boolean {
  return stepId >= 0 && stepId <= 17;
}
```

### Phase 2: Simplify SessionManager (Backward Compatible)

#### Changes to `/utils/sessionManager.ts`
- Keep event-specific sessions (good design)
- Remove old session migration (no longer needed after 30 days)
- Add methods: `syncFromDatabase()`, `getStepOrDefault()`
- Make session a write-through cache, not a source of truth

### Phase 3: Simplify useEventNavigation (Breaking Changes)

#### New API:
```typescript
export function useEventNavigation() {
  return {
    joinEvent: (eventName: string) => Promise<void>
  };
}

// Remove:
// - handleEventSelect (merged into joinEvent)
// - handleEnterEvent (merged into joinEvent)
// - getEventViewMode (not needed)
```

#### Implementation:
```typescript
async function joinEvent(eventName: string) {
  // 1. Find event
  const event = findEvent(eventName);
  if (!event) {
    showError(`Event "${eventName}" not found`);
    return;
  }

  // 2. Check auth
  if (!isAuthenticated) {
    dispatchAuthModal();
    // Store intent, resume after auth
    pendingAction.current = { type: 'joinEvent', eventName };
    return;
  }

  // 3. Get latest progress from DB
  const dbStep = await fetchAndGetStep(event.id);
  
  // 4. Calculate start point
  const startStep = resolveStartStep(dbStep);
  const startPhase = getPhaseForStep(startStep);

  // 5. Update session cache
  SessionManager.updateStepProgress(startStep, startPhase, eventName);

  // 6. Navigate to onboarding
  setState({
    currentEvent: eventName,
    currentStepId: startStep,
    currentPhase: startPhase,
    viewMode: 'onboarding'
  });
}
```

### Phase 4: Simplify OnboardingRouter

#### Remove:
- Auto-enable specific event flow useEffect
- Complex step sync logic
- Dual source checking

#### Keep:
- Simple step navigation
- Form state management
- Progress updates

### Phase 5: Error Handling & Loading States

#### Create `/utils/errorHandler.ts`
```typescript
export class OnboardingError extends Error {
  constructor(
    message: string,
    public code: 'EVENT_NOT_FOUND' | 'AUTH_REQUIRED' | 'PROGRESS_FETCH_FAILED',
    public userMessage: string
  ) {
    super(message);
  }
}

export function handleOnboardingError(error: OnboardingError) {
  console.error(`[${error.code}] ${error.message}`);
  toast.error(error.userMessage);
}
```

---

## Migration Path

### Step 1: Add New Utils (No Breaking Changes)
- Add `onboardingHelpers.ts`
- Add `errorHandler.ts`
- Update tests

### Step 2: Refactor SessionManager (Backward Compatible)
- Add new methods
- Keep old methods for compatibility
- Add deprecation warnings

### Step 3: Create New Hook (Parallel)
- Create `useEventJourney.ts` with simplified API
- Keep `useEventNavigation.ts` for backward compat
- Update App.tsx to use new hook

### Step 4: Update Components
- Update HomePage to use new API
- Update OnboardingRouter with simplified logic
- Remove deprecated code

### Step 5: Cleanup
- Remove old hook
- Remove unused state flags
- Remove excessive logging
- Update types

---

## Benefits

### For Developers
- **50% less code** in event navigation logic
- **Clear flow** - easy to trace and debug
- **Single responsibility** - each function does one thing
- **Type safety** - better error catching

### For Users
- **Faster** - fewer database calls and state updates
- **More reliable** - single source of truth prevents sync issues
- **Better errors** - clear messages when something goes wrong

### For Maintenance
- **Easier testing** - pure functions, clear inputs/outputs
- **Easier debugging** - less state to track
- **Easier extending** - add new events without touching navigation logic

---

## Testing Strategy

### Unit Tests
- `getPhaseForStep()` - all step ranges
- `resolveStartStep()` - edge cases (0, 1, 17, invalid)
- `isValidStep()` - boundary conditions

### Integration Tests
- Join event flow (auth + no auth)
- Resume flow (has progress)
- Error cases (event not found, network failure)

### E2E Tests
- Complete user journey
- Multi-event participation
- Session persistence

---

## Risks & Mitigations

### Risk: Breaking existing user sessions
**Mitigation**: Keep backward compatibility in SessionManager for 30 days

### Risk: Progress data loss
**Mitigation**: Database is always source of truth, session is cache

### Risk: Auth modal race conditions
**Mitigation**: Use pendingAction ref to resume after auth

---

## Metrics to Track

- Time to complete onboarding (should decrease)
- Error rate (should decrease)
- Support tickets about flow confusion (should decrease)
- Code coverage (should increase)

---

## Next Steps

1. ✅ Create this analysis document
2. ⏳ Review with team
3. ⏳ Implement Phase 1 (utility functions)
4. ⏳ Add tests
5. ⏳ Implement Phase 2-5 iteratively
6. ⏳ Deploy to staging
7. ⏳ Monitor metrics
8. ⏳ Deploy to production
