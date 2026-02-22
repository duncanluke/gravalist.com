/**
 * Authentication utility functions
 */

// Request authentication modal
export const requestAuth = (mode: 'signin' | 'signup' = 'signin') => {
  window.dispatchEvent(new CustomEvent('requestAuth', { detail: { mode } }));
};

// Request email input (fallback for non-authenticated users)
export const requestEmailInput = () => {
  window.dispatchEvent(new CustomEvent('requestEmailInput'));
};

// Check if user needs to authenticate for a feature
export const requireAuth = (isAuthenticated: boolean, callback?: () => void) => {
  if (!isAuthenticated) {
    requestAuth('signin');
    return false;
  }
  
  if (callback) callback();
  return true;
};