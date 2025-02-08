import { useWalletClient, usePublicClient } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface TransactionConfig {
  onSuccess?: (hash: string, data?: any) => Promise<void> | void;
  onError?: (error: Error, data?: any) => Promise<void> | void;
  onSettled?: () => void;
}

export function useTransaction(config: TransactionConfig = {}) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTransaction = async (transaction: any, data?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Send transaction
      const hash = await walletClient?.sendTransaction({
        ...transaction,
        account: transaction.account,
      });

      console.log("Transaction hash:", hash);

      // Wait for confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        timeout: 60_000,
        onReplaced: (replacement) => {
          console.log("Transaction replaced:", replacement);
        },
      });

      // Check status
      if (receipt?.status === 'success') {
        console.log("Transaction successful:", receipt);
        if (config.onSuccess) {
          await config.onSuccess(hash as string, data);
        }
        return { success: true, hash, receipt };
      } else {
        throw new Error("Transaction failed");
      }

    } catch (err) {
      console.error("Transaction error:", err);
      setError(err instanceof Error ? err.message : "Transaction failed");
      if (config.onError) {
        await config.onError(err as Error, data);
      }
      throw err;
    } finally {
      setIsLoading(false);
      if (config.onSettled) {
        config.onSettled();
      }
    }
  };

  return {
    sendTransaction,
    isLoading,
    error,
  };
} 