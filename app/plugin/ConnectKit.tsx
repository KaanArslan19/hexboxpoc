"use client";
import { useAccount } from "wagmi";

export function useWalletStatus() {
  const { address, isConnecting, isDisconnected } = useAccount();
  if (isConnecting) return "Connecting...";
  if (isDisconnected) return "Disconnected";
  return `Connected Wallet: ${address}`;
}
