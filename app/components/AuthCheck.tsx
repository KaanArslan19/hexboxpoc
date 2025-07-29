'use client';
import { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { COOKIE_KEYS } from '@/app/lib/auth/constants';

// Maintain queue of pending requests that will be retried after re-auth
let pendingRequests: Array<() => void> = [];

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

  // Handle the initial auth check when component mounts or wallet connection changes
  useEffect(() => {
    const checkAuth = async () => {
      if (isConnected) {
        try {
          const response = await fetch('/api/auth/check', {
            credentials: 'include'
          });
          if (!response.ok) {
            setReauthReason('initial');
            setShowReauthModal(true);
            setReauthStatus('pending');
            try {
              await handleReauth(address as string, signMessageAsync);
              setReauthStatus('success');
              setTimeout(() => {
                setShowReauthModal(false);
                setReauthStatus('idle');
              }, 2000);
            } catch (error) {
              console.error('Reauth failed:', error);
              setReauthStatus('error');
              setTimeout(() => {
                disconnect();
                setShowReauthModal(false);
                setReauthStatus('idle');
              }, 3000);
            }
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
    };

    checkAuth();
  }, [isConnected, address, disconnect, signMessageAsync]);
  
  // Listen for session expiry events
  useEffect(() => {
    const handleSessionExpired = async () => {
      if (!isConnected || !address) {
        console.error('Cannot re-authenticate: wallet not connected');
        return;
      }
      
      setReauthReason('session-expired');
      setShowReauthModal(true);
      setReauthStatus('pending');
      
      try {
        await handleReauth(address, signMessageAsync);
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
      statement: 'Sign in with Ethereum to the app.',
      uri: window.location.origin,
      version: '1',
      chainId: 1,
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