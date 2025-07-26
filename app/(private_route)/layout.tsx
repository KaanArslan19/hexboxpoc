"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import Navbar from "@components/navbar";
import HexagonLoading from "@components/ui/HexagonLoading";

interface Props {
  children: ReactNode;
}

export default function PrivateLayout({ children }: Props) {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  console.log(userId, "-----", address);
  useEffect(() => {
    // Check if wallet is connected
    if (!isConnected || !address) {
      router.push("/");
      return;
    }

    // Check if userId matches the connected address
    if (!userId || userId.toLowerCase() !== address.toLowerCase()) {
      router.push("/");
      return;
    }
  }, [address, isConnected, userId, router]);

  if (
    !isConnected ||
    !address ||
    !userId ||
    userId.toLowerCase() !== address.toLowerCase()
  ) {
    return (
      <div className="h-screen flex items-center justify-center">
        <HexagonLoading />
      </div>
    );
  }

  return (
    <div className="max-w-screen-[80vh] mx-auto p-4">
      <Navbar />
      {children}
    </div>
  );
}
