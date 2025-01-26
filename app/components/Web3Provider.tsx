/* "use client";
import { ReactNode, useEffect, useState, useRef } from "react";
import { WagmiProvider, createConfig, http, useAccount } from "wagmi";
import { mainnet, polygon, avalanche, avalancheFuji } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { RainbowKitSiweNextAuthProvider } from "@rainbow-me/rainbowkit-siwe-next-auth";
import { SessionProvider, useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const config = getDefaultConfig({
  chains: [avalancheFuji],
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string,
  appName: "Get started with Nodie powered by POKT",
  appDescription: "Walllet Connect with Nodie",
});
console.log(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
function ConnectionManager({ children }: { children: ReactNode }) {
  const { isConnected, address } = useAccount();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isHandlingAuth, setIsHandlingAuth] = useState(false);
  const previousConnectedRef = useRef(isConnected);
  const previousStatusRef = useRef(status);

  useEffect(() => {
    const handleStateChange = async () => {
      console.log("Auth State Change:", {
        isConnected,
        status,
        previousStatus: previousStatusRef.current,
        address,
        sessionAddress: session?.user?.name,
      });

<<<<<<< Updated upstream
      // Handle initial authentication
      if (status === "authenticated" && previousStatusRef.current !== "authenticated") {
        console.log("Initial authentication detected");
        router.refresh();
=======
    const handleConnectionChange = async () => {
      if (isUpdating) return;
      isUpdating = true;

      try {
        console.log("Connection state changed:", {
          isConnected,
          status,
          address,
          sessionAddress: session?.user?.name,
        });

        if (isConnected) {
          if (status === "unauthenticated") {
            console.log("New wallet connected, signing in to refresh session");
            const signInResponse = await signIn("credentials", {
              redirect: false,
              message: address,
              signature: "",
            });

            console.log("SignIn response:", signInResponse);

            if (!signInResponse?.ok) {
              console.error("Error signing in");
            } else {
              await update();
            }
          } else if (status === "authenticated") {
            if (address?.toLowerCase() !== session?.user?.name?.toLowerCase()) {
              console.log("Address mismatch, signing out");
              await signOut({ redirect: false });
              await update();
            }
          }
        } else if (!isConnected && status === "authenticated") {
          console.log("Wallet disconnected, ending session");
          await signOut({ redirect: false });
          await update();
        }
      } catch (error) {
        console.error("Error handling connection change:", error);
      } finally {
        isUpdating = false;
>>>>>>> Stashed changes
      }

      // Handle disconnect
      if (!isConnected && previousConnectedRef.current && !isHandlingAuth) {
        setIsHandlingAuth(true);
        try {
          await signOut({ redirect: false });
          router.refresh();
        } finally {
          setIsHandlingAuth(false);
        }
      }

      // Update refs
      previousConnectedRef.current = isConnected;
      previousStatusRef.current = status;
    };

    handleStateChange();
  }, [isConnected, status, session, router]);

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
              <ConnectionManager>{children}</ConnectionManager>
            </RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
};
 */
