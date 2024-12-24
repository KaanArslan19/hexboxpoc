"use client";
import { ReactNode, useEffect } from "react";
import { WagmiProvider, createConfig, http, useAccount } from "wagmi";
import { mainnet, polygon, avalanche, avalancheFuji } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { RainbowKitSiweNextAuthProvider } from '@rainbow-me/rainbowkit-siwe-next-auth';
import { SessionProvider, useSession, signOut } from "next-auth/react";

const config = getDefaultConfig({
  chains: [avalancheFuji],
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string,
  appName: "Get started with Nodie powered by POKT",
  appDescription: "Walllet Connect with Nodie",
});

function ConnectionManager({ children }: { children: ReactNode }) {
  const { isConnected, address } = useAccount();
  const { data: session, status, update } = useSession();

  useEffect(() => {
    const handleConnectionChange = async () => {
      console.log("Connection state changed:", { 
        isConnected, 
        status, 
        address,
        sessionAddress: session?.user?.name 
      });

      // Handle wallet disconnect
      if (!isConnected && status === 'authenticated') {
        console.log("Wallet disconnected, ending session");
        await signOut({ redirect: false });
        await update();
        return;
      }

      // Handle wallet connect verification
      if (isConnected && status === 'authenticated') {
        if (address?.toLowerCase() !== session?.user?.name?.toLowerCase()) {
          console.log("Address mismatch, ending session");
          await signOut({ redirect: false });
          await update();
        }
      }
    };

    handleConnectionChange();
  }, [isConnected, status, address, session?.user?.name, update]);

  return <>{children}</>;
}

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <RainbowKitSiweNextAuthProvider>
            <RainbowKitProvider>
              <ConnectionManager>
                {children}
              </ConnectionManager>
            </RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
};
