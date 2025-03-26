"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { State, WagmiProvider, useAccount } from "wagmi";
import { RainbowKitProvider as NextRainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ReactNode, useState, useEffect } from "react";
import ReactQueryProvider from "./ReactQueryProvider";

import { EMITTER_EVENTS } from "@/app/lib/auth/constants";
import { isAuthAction, signOutAction } from "@/app/lib/auth/actions/auth";
import { eventEmitter } from "@/app/lib/auth/config/clients/eventEmitter";
import { Optional } from "@/app/lib/auth/types/common";
import wagmiConfig from "@/app/lib/auth/config/wagmi";
import { useRouter } from "next/navigation";

function WalletWatcher() {
  const { isConnected } = useAccount();

  useEffect(() => {
    const handleDisconnect = async () => {
      if (!isConnected) {
        try {
          await signOutAction();
          eventEmitter.emit(EMITTER_EVENTS.SIGN_OUT);
        } catch (error) {
          console.error("Error signing out:", error);
        }
      }
    };

    handleDisconnect();
  }, [isConnected]);

  return null;
}

type RainbowKitProviderProps = {
  children: ReactNode;
  initialState: State | undefined;
};

export default function RainbowKitProvider({
  children,
  initialState,
}: RainbowKitProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState<Optional<boolean>>();
  const router = useRouter();

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isAuth } = await isAuthAction();
        setIsAuth(isAuth);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuth(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleSignIn = () => setIsAuth(true);
    const handleSignOut = () => setIsAuth(false);

    eventEmitter.on(EMITTER_EVENTS.SIGN_IN, handleSignIn);
    eventEmitter.on(EMITTER_EVENTS.SIGN_OUT, handleSignOut);

    return () => {
      eventEmitter.off(EMITTER_EVENTS.SIGN_IN, handleSignIn);
      eventEmitter.off(EMITTER_EVENTS.SIGN_OUT, handleSignOut);
    };
  }, []);

  useEffect(() => {
    if (isAuth) {
      router.refresh();
    }
  }, [isAuth, router]);

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <ReactQueryProvider>
        <NextRainbowKitProvider coolMode>
          <WalletWatcher />
          {children}
        </NextRainbowKitProvider>
      </ReactQueryProvider>
    </WagmiProvider>
  );
}
