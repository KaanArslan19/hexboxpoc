import { createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";
import { signInAction, signOutAction } from "../actions/auth";
import { eventEmitter } from "../config/clients/eventEmitter";
import { EMITTER_EVENTS } from "../constants";

export const authenticationAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    try {
      const response = await fetch("/api/auth/nonce", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to get nonce");
      }
      const data = await response.json();
      return data.nonce;
    } catch (error) {
      console.error("Error getting nonce:", error);
      throw error;
    }
  },
  createMessage: ({ nonce, address, chainId }) => {
    return new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in with Ethereum to the app.",
      uri: window.location.origin,
      version: "1",
      chainId,
      nonce,
    });
  },
  getMessageBody: ({ message }) => {
    return message.prepareMessage();
  },
  verify: async ({ message, signature }) => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify signature");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error("Verification failed");
      }

      await signInAction({ jwt: data.jwt });
      eventEmitter.emit(EMITTER_EVENTS.SIGN_IN);
      return true;
    } catch (error) {
      console.error("Verification error:", error);
      throw error;
    }
  },
  signOut: async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to sign out");
      }
      await signOutAction();
      eventEmitter.emit(EMITTER_EVENTS.SIGN_OUT);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },
});

export const handleSignIn = async () => {
  try {
    await signInAction({ jwt: "dummy-jwt" }); // You might want to get a real JWT here
    eventEmitter.emit(EMITTER_EVENTS.SIGN_IN);
    return true;
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};

export const handleSignOut = async () => {
  try {
    const response = await fetch("/api/auth/logout", {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to sign out");
    }
    await signOutAction();
    eventEmitter.emit(EMITTER_EVENTS.SIGN_OUT);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};
