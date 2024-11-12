"use client";
import React, { useCallback, useRef, useEffect } from "react";
import {
  useSession,
  signIn,
  signOut,
  getCsrfToken,
} from "next-auth/react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import { serializeData } from "../utils/serializeData";

const WalletMultiButtonDynamic = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

// Singleton to track global auth state
const globalAuthState = {
  isProcessing: false,
  lastConnected: null as boolean | null,
  lastStatus: null as string | null,
};

const SignInButton = () => {
  const { status } = useSession();
  const wallet = useWallet();

  const handleSignIn = useCallback(async () => {
    if (!wallet.signIn) {
      console.warn("Wallet doesn't support signIn");
      return;
    }

    const input: SolanaSignInInput = {
      domain: window.location.host,
      address: wallet.publicKey?.toBase58() || "",
      statement: "Sign in to the App",
      nonce: await getCsrfToken(),
    };

    const output: SolanaSignInOutput = await wallet.signIn(input);
    const { jsonInput, jsonOutput } = serializeData(input, output);

    const result = await signIn("credentials", {
      output: jsonOutput,
      input: jsonInput,
      redirect: false,
    });

    if (result?.ok !== true) {
      console.error("Failed to sign in");
    }
  }, [wallet]);

  useEffect(() => {
    // Skip if already processing or no state change
    if (globalAuthState.isProcessing || 
        (globalAuthState.lastConnected === wallet.connected && 
         globalAuthState.lastStatus === status)) {
      return;
    }

    const handleAuth = async () => {
      try {
        globalAuthState.isProcessing = true;
        console.log("Processing auth:", { connected: wallet.connected, status });

        if (wallet.connected === false && status === "authenticated") {
          await signOut({ redirect: false });
        } else if (wallet.connected === true && status === "unauthenticated") {
          await handleSignIn();
        }
      } finally {
        globalAuthState.lastConnected = wallet.connected;
        globalAuthState.lastStatus = status;
        globalAuthState.isProcessing = false;
      }
    };

    handleAuth();
  }, [wallet.connected, status, handleSignIn]);

  return <WalletMultiButtonDynamic />;
};

export default SignInButton;
