'use client';

import { waitForReauth } from '@/app/components/AuthCheck';

// Track if we're currently in the process of re-authenticating
let isReauthenticating = false;

/**
 * Custom fetch function with built-in authentication handling.
 * Automatically handles 401 responses by triggering the auth event
 * and retrying when authentication is complete.
 */
export const apiFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // Add credentials to ensure cookies are sent
  const fetchOptions = {
    ...options,
    credentials: 'include' as RequestCredentials,
  };
  
  // Make the initial request
  let response = await fetch(url, fetchOptions);
  
  // If we get a 401 Unauthorized response and not already re-authenticating
  if (response.status === 401 && !isReauthenticating) {
    try {
      isReauthenticating = true;
      console.log('Session expired, triggering re-authentication');
      
      // Dispatch event to trigger the re-authentication modal
      const reauthEvent = new CustomEvent('session-expired');
      window.dispatchEvent(reauthEvent);
      
      // Wait for re-authentication to complete
      await waitForReauth();
      
      console.log('Re-authentication complete, retrying request');
      
      // Retry the request now that we're authenticated
      response = await fetch(url, fetchOptions);
    } catch (error) {
      console.error('Error during authentication flow:', error);
    } finally {
      isReauthenticating = false;
    }
  }
  
  return response;
};

/**
 * React hook for using authenticated fetch in components
 */
export const useAuthenticatedFetch = () => {
  return apiFetch;
};

export default apiFetch;
