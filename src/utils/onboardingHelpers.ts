import { Phase } from '../types/app';

/**
 * Calculate the phase for a given step ID.
 * Single source of truth for step → phase mapping.
 * 
 * @param stepId - The step number (0-17)
 * @returns The phase ('before' | 'start' | 'end')
 */
export function getPhaseForStep(stepId: number): Phase {
  if (stepId <= 9) return 'before';
  if (stepId <= 14) return 'start';
  return 'end';
}

/**
 * Resolve the starting step for a user based on their database progress.
 * 
 * Logic:
 * - If dbStep is 0 (no progress), start at step 1 (WELCOME)
 * - Otherwise, start where they left off
 * 
 * @param dbStep - The step from database (0 means no progress)
 * @returns The step to start at
 */
export function resolveStartStep(dbStep: number): number {
  // If no progress, start at WELCOME (step 1)
  // Otherwise continue from where they left off
  return dbStep > 0 ? dbStep : 1;
}

/**
 * Validate if a step ID is within the valid range.
 * 
 * @param stepId - The step number to validate
 * @returns true if valid, false otherwise
 */
export function isValidStep(stepId: number): boolean {
  return Number.isInteger(stepId) && stepId >= 0 && stepId <= 17;
}

/**
 * Calculate progress percentage for a given step.
 * 
 * @param stepId - The current step (0-17)
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(stepId: number): number {
  const totalSteps = 18; // Steps 0-17
  return Math.min(Math.round((stepId / (totalSteps - 1)) * 100), 100);
}

/**
 * Check if a user has meaningful progress (beyond the welcome screen).
 * 
 * @param stepId - The current step
 * @returns true if user has progressed beyond welcome
 */
export function hasSignificantProgress(stepId: number): boolean {
  return stepId > 1;
}

/**
 * Check if the journey is complete.
 * 
 * @param stepId - The current step
 * @returns true if at or beyond the final step
 */
export function isJourneyComplete(stepId: number): boolean {
  return stepId >= 17;
}

/**
 * Get a human-readable phase name.
 * 
 * @param phase - The phase
 * @returns A display-friendly phase name
 */
export function getPhaseName(phase: Phase): string {
  const names: Record<Phase, string> = {
    before: 'Pre-Ride',
    start: 'Start Line',
    end: 'Finish Line'
  };
  return names[phase];
}

/**
 * Get step count for a phase.
 * 
 * @param phase - The phase
 * @returns Number of steps in that phase
 */
export function getStepsInPhase(phase: Phase): number {
  const counts: Record<Phase, number> = {
    before: 10,  // Steps 0-9
    start: 5,    // Steps 10-14
    end: 3       // Steps 15-17
  };
  return counts[phase];
}
