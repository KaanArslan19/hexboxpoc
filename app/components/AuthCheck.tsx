'use client';
import { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { COOKIE_KEYS } from '@/app/lib/auth/constants';

export function AuthCheck() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthStatus, setReauthStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  useEffect(() => {
    const checkAuth = async () => {
      if (isConnected) {
        try {
          const response = await fetch('/api/auth/check', {
            credentials: 'include'
          });
          if (!response.ok) {
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

  if (!showReauthModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {reauthStatus === 'pending' && (
            <>
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-4">
                Please sign the message that has been sent to your crypto wallet to continue using the application.
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
              <p>Your wallet will be disconnected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function handleReauth(
  address: string, 
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>
) {
  try {
    const nonceResponse = await fetch('/api/auth/nonce');
    const { nonce } = await nonceResponse.json();
    
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

    const signature = await signMessageAsync({
      message: messageToSign,
    });

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
  } catch (error) {
    console.error('Reauth failed:', error);
    throw error;
  }
} 