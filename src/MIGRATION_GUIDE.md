# Migration Guide: Simplified Event Navigation

## Overview

This migration simplifies the user flow for joining routes and registering through onboarding. The changes make the codebase more maintainable, reduce complexity, and improve reliability.

## What Changed

### Before (Complex)
```typescript
// Multiple entry points
onEventSelect(eventName);  // Shows details OR starts onboarding
onEnterEvent(eventName);   // Triggers auth OR starts onboarding

// Dual progress tracking
const dbStep = getCurrentStepForEvent(eventId);
const sessionStep = SessionManager.getCurrentStepForEvent(eventName);
const actualStep = Math.max(dbStep, sessionStep); // ⚠️ Sync issues

// Complex state flags
isInSpecificEventFlow={true}  // What does this even mean?

// Scattered phase calculation
if (stepId <= 9) return 'before';
else if (stepId <= 14) return 'start';
// ... duplicated in 5 places
```

### After (Simple)
```typescript
// Single entry point
joinEvent(eventName);  // Handles everything

// Single source of truth
const dbStep = getCurrentStepForEvent(eventId);  // DB is authoritative
const startStep = resolveStartStep(dbStep);      // Simple function

// Utility functions
const phase = getPhaseForStep(stepId);  // DRY principle

// No confusing flags needed
```

## Migration Steps

### Step 1: Install New Utils (Safe - No Breaking Changes)

The new utility functions are pure functions with no dependencies. They're safe to add immediately.

✅ Files added:
- `/utils/onboardingHelpers.ts` - Step/phase calculations
- `/utils/errorHandler.ts` - Centralized error handling
- `/hooks/useSimplifiedEventNavigation.ts` - New simplified hook

### Step 2: Update App.tsx to Use New Hook

Replace the old hook with the new one:

```typescript
// OLD
import { useEventNavigation } from './hooks/useEventNavigation';
const { handleEventSelect, handleEnterEvent } = useEventNavigation({
  userEmail: user?.email || state.userEmail,
  setState,
  isAuthenticated
});

// NEW
import { useSimplifiedEventNavigation } from './hooks/useSimplifiedEventNavigation';
const { joinEvent, resumePendingAction } = useSimplifiedEventNavigation({
  userEmail: user?.email || state.userEmail,
  setState,
  isAuthenticated
});

// Add effect to resume after auth
useEffect(() => {
  if (isAuthenticated) {
    resumePendingAction();
  }
}, [isAuthenticated, resumePendingAction]);
```

### Step 3: Update Components to Use joinEvent

Replace all uses of `onEventSelect` and `onEnterEvent` with `joinEvent`:

```typescript
// In HomePage, EventPages, etc.

// OLD
<Button onClick={() => onEventSelect(eventName)}>View Event</Button>
<Button onClick={() => onEnterEvent(eventName)}>Start Journey</Button>

// NEW - Same function for both!
<Button onClick={() => joinEvent(eventName)}>View Event</Button>
<Button onClick={() => joinEvent(eventName)}>Start Journey</Button>
```

### Step 4: Update OnboardingRouter

Simplify the step sync logic:

```typescript
// OLD - Complex sync with dual sources
const databaseStep = getCurrentStepForEvent(currentEvent.id);
const sessionStep = SessionManager.getCurrentStepForEvent(state.currentEvent);
const correctStep = Math.max(databaseStep, sessionStep);
// ... 30 more lines of sync logic

// NEW - Trust the database
const databaseStep = getCurrentStepForEvent(currentEvent.id);
if (databaseStep > state.currentStepId) {
  const correctPhase = getPhaseForStep(databaseStep);
  setState({ 
    currentStepId: databaseStep,
    currentPhase: correctPhase 
  });
}
```

Use the helper functions:

```typescript
// OLD - Inline calculation
if (stepId <= 9) return 'before';
else if (stepId <= 14) return 'start';
else return 'end';

// NEW - Use helper
import { getPhaseForStep } from '../utils/onboardingHelpers';
const phase = getPhaseForStep(stepId);
```

### Step 5: Update SessionManager Usage

The SessionManager API stays the same, but now it's used as a cache, not a source of truth:

```typescript
// Database is authoritative
const dbStep = await fetchStepProgress(event.id);

// Session is write-through cache
SessionManager.updateStepProgress(dbStep, phase, eventName);

// When reading, prefer database if available
const cachedStep = SessionManager.getCurrentStepForEvent(eventName);
// Only use cached if offline or DB not available
```

### Step 6: Remove Deprecated Code

After testing thoroughly, remove:

- `isInSpecificEventFlow` flag from AppState (no longer needed)
- Duplicate phase calculation logic
- Excessive console.log statements
- Old `useEventNavigation` hook (after all components updated)

## Testing Checklist

### Unit Tests
- [ ] `getPhaseForStep()` returns correct phase for all step ranges
- [ ] `resolveStartStep()` handles 0, 1, and >1 correctly
- [ ] `isValidStep()` validates boundaries
- [ ] Error handlers create correct error messages

### Integration Tests
- [ ] Join event while unauthenticated shows auth modal
- [ ] Join event after auth starts onboarding at step 1
- [ ] Resume event with progress continues from correct step
- [ ] Event not found shows error and stays on home page
- [ ] Network error shows retry-able error message

### Manual Testing
- [ ] Fresh user: Click "Join Event" → Sign up → Lands on Welcome step
- [ ] Returning user (step 5): Click event → Continues from step 5
- [ ] Completed user: Click event → Sees completion state
- [ ] Multiple events: Can join different events independently
- [ ] Offline: Session cache allows continued progress

### Regression Testing
- [ ] Existing user sessions still work
- [ ] Progress data preserved
- [ ] Multi-event participation works
- [ ] Session expiry (30 days) still functions

## Rollback Plan

If issues arise, rollback is simple:

### Quick Rollback (Keep New Files)
```typescript
// In App.tsx, switch back to old hook
import { useEventNavigation } from './hooks/useEventNavigation';
// Use old handlers
const { handleEventSelect, handleEnterEvent } = useEventNavigation(...);
```

### Full Rollback (Remove New Files)
```bash
git revert <commit-hash>
# Or manually delete:
rm /utils/onboardingHelpers.ts
rm /utils/errorHandler.ts
rm /hooks/useSimplifiedEventNavigation.ts
rm /MIGRATION_GUIDE.md
rm /REFACTORING_ANALYSIS.md
```

## Common Issues & Solutions

### Issue: "Event not found" errors
**Cause**: Events haven't loaded from API yet  
**Solution**: Add loading state check before calling joinEvent

```typescript
if (eventsLoading) {
  return <LoadingSpinner />;
}
```

### Issue: Auth modal doesn't resume journey
**Cause**: Forgot to call `resumePendingAction()`  
**Solution**: Add useEffect in App.tsx

```typescript
useEffect(() => {
  if (isAuthenticated) {
    resumePendingAction();
  }
}, [isAuthenticated, resumePendingAction]);
```

### Issue: Progress seems to reset
**Cause**: Database and session out of sync  
**Solution**: Force refresh from database

```typescript
// In OnboardingRouter
await fetchStepProgress(event.id);
const freshStep = getCurrentStepForEvent(event.id);
```

## Benefits Recap

### Code Quality
- **-150 lines** in useEventNavigation (300 → 150)
- **-50 lines** in OnboardingRouter (syncing logic)
- **+100 lines** in utility functions (reusable)
- **Net: -100 lines overall**

### Maintainability
- Single source of truth for progress
- DRY principle for phase calculation
- Clear error messages
- Easy to test (pure functions)

### Reliability
- No more sync issues between DB and session
- No race conditions from dual tracking
- Clear error handling
- Predictable behavior

### User Experience
- Faster (fewer checks and syncs)
- More reliable (single source of truth)
- Better error messages
- Smoother auth flow

## Questions?

If you encounter any issues during migration:

1. Check this guide for common issues
2. Review `/REFACTORING_ANALYSIS.md` for architectural details
3. Look at unit tests for usage examples
4. Check console for error messages (now more helpful!)

## Timeline

- **Week 1**: Add new utility files (no breaking changes)
- **Week 2**: Update App.tsx and test thoroughly
- **Week 3**: Update all components to use joinEvent
- **Week 4**: Remove deprecated code and clean up
- **Week 5**: Monitor production metrics

Good luck! 🚀
