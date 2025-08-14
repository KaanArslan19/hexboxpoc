'use client';

import { waitForReauth } from '@/app/components/AuthCheck';

// Track if we're currently in the process of re-authenticating
let isReauthenticating = false;

// Queue to store failed requests that need to be retried after reauth
let failedRequestsQueue: Array<{
  url: string;
  options: RequestInit;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
}> = [];

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
  
  // If we get a 401 Unauthorized response, handle reauth
  if (response.status === 401) {
    // If we're already re-authenticating, queue this request
    if (isReauthenticating) {
      console.log('Reauth in progress, queueing request');
      return new Promise<Response>((resolve, reject) => {
        failedRequestsQueue.push({ url, options: fetchOptions, resolve, reject });
      });
    }

    try {
      isReauthenticating = true;
      console.log('Session expired, triggering re-authentication');
      
      // Dispatch event to trigger the re-authentication modal
      const reauthEvent = new CustomEvent('session-expired');
      window.dispatchEvent(reauthEvent);
      
      // Wait for re-authentication to complete
      await waitForReauth();
      
      console.log('Re-authentication complete, retrying request');
      
      // Retry the original request
      response = await fetch(url, fetchOptions);
      
      // Process queued requests if reauth was successful
      if (response.ok || response.status !== 401) {
        console.log(`Processing ${failedRequestsQueue.length} queued requests`);
        const queuedRequests = [...failedRequestsQueue];
        failedRequestsQueue = [];
        
        // Process queued requests in parallel
        queuedRequests.forEach(async (queuedRequest) => {
          try {
            const retryResponse = await fetch(queuedRequest.url, queuedRequest.options);
            queuedRequest.resolve(retryResponse);
          } catch (error) {
            queuedRequest.reject(error as Error);
          }
        });
      } else {
        // If reauth failed, reject all queued requests
        const queuedRequests = [...failedRequestsQueue];
        failedRequestsQueue = [];
        queuedRequests.forEach(queuedRequest => {
          queuedRequest.reject(new Error('Authentication failed'));
        });
      }
    } catch (error) {
      console.error('Error during authentication flow:', error);
      
      // Reject all queued requests on error
      const queuedRequests = [...failedRequestsQueue];
      failedRequestsQueue = [];
      queuedRequests.forEach(queuedRequest => {
        queuedRequest.reject(error as Error);
      });
      
      throw error;
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
