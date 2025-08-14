'use client';
import { useEffect, useState, useRef } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { COOKIE_KEYS, EMITTER_EVENTS } from '@/app/lib/auth/constants';
import { authDebugger } from '@/app/utils/authDebug';
import { eventEmitter } from '@/app/lib/auth/config/clients/eventEmitter';

// Maintain queue of pending requests that will be retried after re-auth
let pendingRequests: Array<() => void> = [];

// Global state to prevent multiple simultaneous authentication attempts
let globalAuthState = {
  isAuthenticating: false,
  lastAuthCheck: 0,
  authCheckCooldown: 5000, // 5 second cooldown between auth checks
};

// Function to create a fresh nonce for auth
async function createNonce(): Promise<string> {
  const nonceResponse = await fetch('/api/auth/nonce');
  const { nonce } = await nonceResponse.json();
  return nonce;
}

/**
 * AuthCheck component that handles both initial auth check and session expiry events
 */
export function AuthCheck() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthStatus, setReauthStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [reauthReason, setReauthReason] = useState<'initial' | 'session-expired'>('initial');

  // Track previous connection state to avoid unnecessary checks
  const prevConnectionState = useRef<{ isConnected: boolean; address: string | undefined }>({ 
    isConnected: false, 
    address: undefined 
  });
  
  // Track if we need to force auth on next connection
  const forceAuthOnConnect = useRef(false);
  
  // Handle the initial auth check when component mounts or wallet connection changes
  useEffect(() => {
    const checkAuth = async () => {
      // Prevent multiple simultaneous auth attempts
      if (globalAuthState.isAuthenticating) {
        authDebugger.log('auth_check_skipped', { reason: 'already_authenticating' }, 'AuthCheck');
        console.log('Authentication already in progress, skipping');
        return;
      }

      // Implement cooldown to prevent rapid successive auth checks (but skip cooldown for wallet reconnections)
      const now = Date.now();
      const prevState = prevConnectionState.current;
      const isWalletReconnection = !prevState.isConnected && isConnected;
      
      if (!isWalletReconnection && now - globalAuthState.lastAuthCheck < globalAuthState.authCheckCooldown) {
        authDebugger.log('auth_check_skipped', { 
          reason: 'cooldown_active', 
          timeSinceLastCheck: now - globalAuthState.lastAuthCheck,
          cooldownPeriod: globalAuthState.authCheckCooldown 
        }, 'AuthCheck');
        console.log('Auth check cooldown active, skipping');
        return;
      }

      // Only check auth if wallet is connected and we have an address
      if (!isConnected || !address) {
        authDebugger.log('auth_check_skipped', { 
          reason: 'wallet_not_ready', 
          isConnected, 
          hasAddress: !!address 
        }, 'AuthCheck');
        console.log('Wallet not connected or no address, skipping auth check');
        
        // If wallet was disconnected, set flag to force auth on next connection
        if (prevConnectionState.current.isConnected && !isConnected) {
          forceAuthOnConnect.current = true;
          console.log('Wallet disconnected, will force auth on next connection');
        }
        
        return;
      }

      // Check if connection state actually changed to avoid unnecessary checks
      const currentState = { isConnected, address };
      
      // Force authentication if wallet was previously disconnected or if explicitly requested
      const shouldForceAuth = forceAuthOnConnect.current || !prevState.isConnected;
      
      if (!shouldForceAuth && 
          prevState.isConnected === currentState.isConnected && 
          prevState.address === currentState.address) {
        authDebugger.log('auth_check_skipped', { 
          reason: 'state_unchanged', 
          currentState, 
          prevState 
        }, 'AuthCheck');
        console.log('Connection state unchanged, skipping auth check');
        return;
      }
      
      // Reset force auth flag since we're proceeding with auth
      forceAuthOnConnect.current = false;
      
      // Update previous state
      prevConnectionState.current = currentState;
      globalAuthState.lastAuthCheck = now;
      globalAuthState.isAuthenticating = true;

      try {
        authDebugger.log('auth_check_started', { address, currentState, prevState }, 'AuthCheck');
        console.log('Performing auth check for address:', address);
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          authDebugger.log('auth_check_failed', { status: response.status, address }, 'AuthCheck');
          console.log('Auth check failed, initiating reauth');
          setReauthReason('initial');
          setShowReauthModal(true);
          setReauthStatus('pending');
          
          try {
            authDebugger.log('reauth_started', { address, reason: 'initial' }, 'AuthCheck');
            await handleReauth(address as string, signMessageAsync);
            authDebugger.log('reauth_success', { address }, 'AuthCheck');
            setReauthStatus('success');
            setTimeout(() => {
              setShowReauthModal(false);
              setReauthStatus('idle');
            }, 2000);
          } catch (error) {
            authDebugger.log('reauth_failed', { address, error: error instanceof Error ? error.message : String(error) }, 'AuthCheck');
            console.error('Reauth failed:', error);
            setReauthStatus('error');
            setTimeout(() => {
              disconnect();
              setShowReauthModal(false);
              setReauthStatus('idle');
            }, 3000);
          }
        } else {
          authDebugger.log('auth_check_success', { address }, 'AuthCheck');
          console.log('Auth check successful');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        globalAuthState.isAuthenticating = false;
      }
    };

    // Add a small delay to allow wallet state to stabilize
    const timeoutId = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [isConnected, address]);
  
  // Listen for session expiry events
  useEffect(() => {
    const handleSessionExpired = async () => {
      // Prevent multiple simultaneous session reauth attempts
      if (globalAuthState.isAuthenticating) {
        authDebugger.log('session_expired_ignored', { reason: 'already_authenticating' }, 'AuthCheck');
        console.log('Authentication already in progress, ignoring session expired event');
        return;
      }

      if (!isConnected || !address) {
        authDebugger.log('session_reauth_failed', { reason: 'wallet_not_connected', isConnected, hasAddress: !!address }, 'AuthCheck');
        console.error('Cannot re-authenticate: wallet not connected');
        return;
      }
      
      globalAuthState.isAuthenticating = true;
      setReauthReason('session-expired');
      setShowReauthModal(true);
      setReauthStatus('pending');
      
      try {
        authDebugger.log('session_reauth_started', { address }, 'AuthCheck');
        await handleReauth(address, signMessageAsync);
        authDebugger.log('session_reauth_success', { address, pendingRequestsCount: pendingRequests.length }, 'AuthCheck');
        setReauthStatus('success');
        
        // Resolve all pending requests
        pendingRequests.forEach(resolve => resolve());
        pendingRequests = [];
        
        setTimeout(() => {
          setShowReauthModal(false);
          setReauthStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Session re-auth failed:', error);
        setReauthStatus('error');
        
        // Clear pending requests on failure
        pendingRequests = [];
        
        setTimeout(() => {
          setShowReauthModal(false);
          setReauthStatus('idle');
        }, 3000);
      } finally {
        globalAuthState.isAuthenticating = false;
      }
    };
    
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [address, isConnected, signMessageAsync]);

  if (!showReauthModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {reauthStatus === 'pending' && (
            <>
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-4">
                {reauthReason === 'initial' 
                  ? 'Please sign the message that has been sent to your crypto wallet to continue using the application.'
                  : 'Your session has expired. Please sign the message that has been sent to your crypto wallet to continue.'}
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <button 
                onClick={() => {
                  setShowReauthModal(false);
                  setReauthStatus('idle');
                  globalAuthState.isAuthenticating = false;
                  // Clear any pending requests
                  pendingRequests = [];
                  // Disconnect wallet to reset state
                  disconnect();
                }}
                className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Cancel Authentication
              </button>
            </>
          )}

          {reauthStatus === 'success' && (
            <div className="text-green-600">
              <h3 className="text-lg font-semibold mb-2">Success!</h3>
              <p>Authentication completed.</p>
            </div>
          )}

          {reauthStatus === 'error' && (
            <div className="text-red-600">
              <h3 className="text-lg font-semibold mb-2">Authentication Failed</h3>
              <p>{reauthReason === 'initial' ? 'Your wallet will be disconnected.' : 'Please try again or refresh the page.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Handles the re-authentication process using wallet signatures
 * 
 * @param address The wallet address to authenticate
 * @param signMessageAsync Function to sign messages with the wallet
 * @returns A promise that resolves when auth is complete
 */
async function handleReauth(
  address: string, 
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>
) {
  try {
    // Get a fresh nonce for authentication
    const nonce = await createNonce();
    
    // Create the SIWE message for signing
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign in with Avalanche to the app.',
      uri: window.location.origin,
      version: '1',
      chainId: 43113,
      nonce
    });
    
    const messageToSign = message.prepareMessage();

    // Request wallet signature
    const signature = await signMessageAsync({
      message: messageToSign,
    });

    // Verify the signature with the backend
    const verifyResponse = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, signature })
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify signature');
    }
    
    const verifyData = await verifyResponse.json();
    if (verifyData.success) {
      // Emit the SIGN_IN event to notify other components
      eventEmitter.emit(EMITTER_EVENTS.SIGN_IN);
    }
    
    return true;
  } catch (error) {
    console.error('Reauth failed:', error);
    throw error;
  }
} 

/**
 * Add a request to the queue of requests waiting for re-authentication
 * @returns Promise that resolves when re-auth is complete
 */
export function waitForReauth(): Promise<void> {
  return new Promise<void>((resolve) => {
    pendingRequests.push(resolve);
  });
}