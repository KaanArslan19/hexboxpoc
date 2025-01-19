"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { State, WagmiProvider, useDisconnect, useAccount } from "wagmi";
import {
  RainbowKitProvider as NextRainbowKitProvider,
  RainbowKitAuthenticationProvider,
} from "@rainbow-me/rainbowkit";
import { ReactNode, useState, useEffect } from "react";
import ReactQueryProvider from "./ReactQueryProvider";

import { EMITTER_EVENTS } from "@/app/lib/auth/constants";
import { authenticationAdapter } from "@/app/lib/auth/utils/authenticationAdapter";
import useAsyncEffect from "@/app/lib/auth/hooks/useAsyncEffect";
import { isAuthAction } from "@/app/lib/auth/actions/auth";
import { eventEmitter } from "@/app/lib/auth/config/clients/eventEmitter";
import { Optional } from "@/app/lib/auth/types/common";
import wagmiConfig from "@/app/lib/auth/config/wagmi";

function WalletWatcher() {
  const { isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected) {
      authenticationAdapter.signOut();
    }
  }, [isConnected]);

  useAsyncEffect(async () => {
    if (isConnected) {
      const { isAuth } = await isAuthAction();
      if (isAuth) {
        eventEmitter.emit(EMITTER_EVENTS.SIGN_IN);
      }
    }
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

  useAsyncEffect(async () => {
    const { isAuth } = await isAuthAction();
    setIsAuth(isAuth);
    setIsLoading(false);

    const handleSignIn = () => setIsAuth(true);
    const handleSignOut = () => setIsAuth(false);

    eventEmitter.on(EMITTER_EVENTS.SIGN_IN, handleSignIn);
    eventEmitter.on(EMITTER_EVENTS.SIGN_OUT, handleSignOut);

    return () => {
      eventEmitter.off(EMITTER_EVENTS.SIGN_IN, handleSignIn);
      eventEmitter.off(EMITTER_EVENTS.SIGN_OUT, handleSignOut);
    };
  }, []);

  const status = isLoading
    ? "loading"
    : isAuth
    ? "authenticated"
    : "unauthenticated";

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <ReactQueryProvider>
        <RainbowKitAuthenticationProvider
          adapter={authenticationAdapter}
          status={status}
        >
          <NextRainbowKitProvider coolMode>
            <WalletWatcher />
            {children}
          </NextRainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </ReactQueryProvider>
    </WagmiProvider>
  );
}
