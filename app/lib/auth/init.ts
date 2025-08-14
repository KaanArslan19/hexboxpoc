// Authentication system initialization
// This file ensures JWT validation runs only once on server startup

import { initializeAuthValidation } from './startup/validateAuth';

// Singleton pattern to ensure validation runs only once
let validationCompleted = false;

/**
 * Initialize authentication validation with singleton pattern
 * This ensures validation runs only once, regardless of how many times it's called
 */
function runValidationOnce(): void {
  // Only run on server-side and only once
  if (typeof window === 'undefined' && !validationCompleted) {
    console.log('🔧 DEBUG: Auth validation init starting...');
    try {
      initializeAuthValidation();
      validationCompleted = true;
      console.log('🔧 DEBUG: Auth validation init completed successfully');
    } catch (error) {
      console.error('🚨 CRITICAL: Authentication initialization failed:', error);
      // The validation function will handle process.exit(1) for critical failures
    }
  } else if (typeof window === 'undefined' && validationCompleted) {
    console.log('🔧 DEBUG: Auth validation already completed, skipping');
  } else {
    console.log('🔧 DEBUG: Skipping auth validation (client-side)');
  }
}

// Run validation immediately when this module is first imported
runValidationOnce();

export { initializeAuthValidation, runValidationOnce };
