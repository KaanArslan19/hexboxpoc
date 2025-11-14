"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import CustomButton from "../ui/CustomButton";
import USDCFundraiserABI from "@/app/utils/contracts/artifacts/contracts/USDCFundraiserUpgradeable.sol/USDCFundraiserUpgradeable.json";
import { FundingType } from "@/app/types";
import { CONTRACTS, ABIS } from "@/app/utils/contracts/contracts";

const MIN_WITHDRAWABLE = BigInt(1); // 1 unit of the smallest denomination (1e-6 USDC)

interface WithdrawFundsButtonProps {
  fundraiserAddress: string;
  fundingType: FundingType;
  campaignOwner: boolean;
  businessWallet: string; // wallet_address - the business wallet to receive funds
}

export default function WithdrawFundsButton({
  fundraiserAddress,
  fundingType,
  campaignOwner,
  businessWallet,
}: WithdrawFundsButtonProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [hasFunds, setHasFunds] = useState(false);
  const [isCheckingFunds, setIsCheckingFunds] = useState(true);
  const [withdrawableAmount, setWithdrawableAmount] = useState<bigint>(
    BigInt(0)
  );
  const [usdcDecimals, setUsdcDecimals] = useState<number>(6);
  const { isConnected, address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  const formatWithdrawableAmount = (amount: bigint) => {
    try {
      const formatted = Number(ethers.formatUnits(amount, usdcDecimals));
      if (Number.isNaN(formatted)) return "0";
      return formatted.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: Math.min(usdcDecimals, 6),
      });
    } catch (error) {
      console.error("Error formatting withdrawable amount:", error);
      return amount.toString();
    }
  };

  // Check if there are funds available to withdraw
  useEffect(() => {
    // Only check if it's a Limitless campaign and user is owner
    if (
      fundingType !== FundingType.Limitless ||
      !campaignOwner ||
      !fundraiserAddress
    ) {
      setIsCheckingFunds(false);
      return;
    }
    const checkFundsAvailability = async () => {
      if (!fundraiserAddress) {
        setIsCheckingFunds(false);
        return;
      }

      try {
        setIsCheckingFunds(true);
        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_TESTNET_RPC_URL
        );

        // For Limitless funding, funds are in the escrow wallet (beneficiaryWallet)
        // not in the contract itself
        const contract = new ethers.Contract(
          fundraiserAddress,
          USDCFundraiserABI.abi,
          provider
        );

        // Get the escrow wallet address (beneficiaryWallet)
        const escrowWallet = await contract.beneficiaryWallet();

        // Check USDC balance of the escrow wallet
        // Use a complete ERC20 ABI for balance checking
        const ERC20_ABI = [
          "function balanceOf(address account) view external returns (uint256)",
        ];

        const usdcContract = new ethers.Contract(
          CONTRACTS.USDC.fuji,
          ERC20_ABI,
          provider
        );

        const ERC20_READ_ABI = [
          "function balanceOf(address account) view returns (uint256)",
          "function decimals() view returns (uint8)",
        ];

        const usdcReadContract = new ethers.Contract(
          CONTRACTS.USDC.fuji,
          ERC20_READ_ABI,
          provider
        );

        const [escrowBalance, decimals] = await Promise.all([
          usdcReadContract.balanceOf(escrowWallet),
          usdcReadContract.decimals().catch((err: unknown) => {
            console.warn(
              "Unable to fetch USDC decimals, defaulting to 6:",
              err
            );
            return 6;
          }),
        ]);

        setUsdcDecimals(Number(decimals));

        // For Limitless, funds are immediately transferred to escrow wallet
        // So we check the escrow wallet balance
        const hasAvailableFunds =
          typeof escrowBalance === "bigint" &&
          escrowBalance >= MIN_WITHDRAWABLE;

        setWithdrawableAmount(hasAvailableFunds ? escrowBalance : BigInt(0));
        setHasFunds(hasAvailableFunds);
      } catch (error) {
        console.error("Error checking funds availability:", error);
        setHasFunds(false);
      } finally {
        setIsCheckingFunds(false);
      }
    };

    checkFundsAvailability();

    // Refresh funds check every 30 seconds
    const interval = setInterval(checkFundsAvailability, 30000);

    return () => clearInterval(interval);
  }, [fundraiserAddress, fundingType, campaignOwner, businessWallet]);

  const handleWithdraw = async () => {
    if (!isConnected || !walletClient) {
      toast.error("Please connect your wallet first", { autoClose: 4000 });
      return;
    }

    if (!fundraiserAddress) {
      toast.error("Campaign contract address not found", { autoClose: 4000 });
      return;
    }

    // Double-check funds availability before proceeding
    if (!hasFunds || withdrawableAmount < MIN_WITHDRAWABLE) {
      toast.error("No funds available to withdraw from escrow wallet.", {
        autoClose: 6000,
      });
      return;
    }

    if (!businessWallet) {
      toast.error("Business wallet address not found", { autoClose: 4000 });
      return;
    }

    try {
      setIsWithdrawing(true);

      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_TESTNET_RPC_URL
      );
      const contract = new ethers.Contract(
        fundraiserAddress,
        USDCFundraiserABI.abi,
        provider
      );

      // Get the escrow wallet address (beneficiaryWallet)
      const escrowWallet = await contract.beneficiaryWallet();

      // Use a complete ERC20 ABI for USDC operations
      const ERC20_ABI = [
        "function transfer(address to, uint256 amount) external returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) view external returns (uint256)",
        "function allowance(address owner, address spender) view external returns (uint256)",
        "function decimals() view external returns (uint8)",
      ];

      const usdcContract = new ethers.Contract(
        CONTRACTS.USDC.fuji,
        ERC20_ABI,
        provider
      );

      // CRITICAL: Check balance BEFORE attempting any transaction
      const escrowBalance = await usdcContract.balanceOf(escrowWallet);

      // Validate balance is greater than zero
      if (
        typeof escrowBalance !== "bigint" ||
        escrowBalance < MIN_WITHDRAWABLE
      ) {
        // Update state to reflect no funds
        setHasFunds(false);
        setWithdrawableAmount(BigInt(0));
        throw new Error(
          "No funds available to withdraw from escrow wallet. The escrow wallet balance is zero."
        );
      }

      // Additional validation: ensure balance is a valid BigInt
      if (typeof escrowBalance !== "bigint") {
        throw new Error("Invalid balance data received from the contract.");
      }

      // FINAL BALANCE CHECK: Verify balance one more time right before transaction
      // This prevents race conditions where balance might have changed
      const finalBalanceCheck = await usdcContract.balanceOf(escrowWallet);

      if (
        typeof finalBalanceCheck !== "bigint" ||
        finalBalanceCheck < MIN_WITHDRAWABLE
      ) {
        setHasFunds(false);
        setWithdrawableAmount(BigInt(0));
        throw new Error(
          "No funds available to withdraw. The escrow wallet balance is zero."
        );
      }

      // Use the most recent balance for the transfer
      const transferAmount = finalBalanceCheck;
      setWithdrawableAmount(transferAmount);

      // For Limitless funding, transfer funds from escrow wallet (beneficiaryWallet) to business wallet
      // The escrow wallet should be controlled by the campaign owner
      // Check if connected wallet is the escrow wallet
      let hash: `0x${string}`;

      if (connectedAddress?.toLowerCase() !== escrowWallet.toLowerCase()) {
        // If not the escrow wallet, we need to use transferFrom with approval
        // But first check if we have approval
        try {
          const allowance = await usdcContract.allowance(
            escrowWallet,
            connectedAddress || ""
          );

          if (!allowance || allowance < transferAmount) {
            // Need approval first - but we can't approve from a different wallet
            // So we need the user to connect the escrow wallet
            throw new Error(
              `Please connect the escrow wallet (${escrowWallet}) to withdraw funds. The connected wallet does not have permission to transfer from the escrow wallet.`
            );
          }

          // Use transferFrom since we have approval
          const transferFromData = usdcContract.interface.encodeFunctionData(
            "transferFrom",
            [escrowWallet, businessWallet, transferAmount]
          );

          hash = await walletClient.sendTransaction({
            to: CONTRACTS.USDC.fuji as `0x${string}`,
            data: transferFromData as `0x${string}`,
          });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("escrow wallet")
          ) {
            throw error;
          }
          throw new Error(
            `Unable to check approval. Please ensure you have connected the escrow wallet (${escrowWallet}) or have proper approval.`
          );
        }
      } else {
        // Connected wallet IS the escrow wallet - can transfer directly
        try {
          const transferData = usdcContract.interface.encodeFunctionData(
            "transfer",
            [businessWallet, transferAmount]
          );

          hash = await walletClient.sendTransaction({
            to: CONTRACTS.USDC.fuji as `0x${string}`,
            data: transferData as `0x${string}`,
          });
        } catch (error) {
          if (error instanceof Error) {
            // Check for specific encoding errors
            if (
              error.message.includes("unknown function") ||
              error.message.includes("INVALID_ARGUMENT")
            ) {
              throw new Error(
                "Failed to encode transfer function. Please ensure the USDC contract supports standard ERC20 transfer operations."
              );
            }
          }
          throw error;
        }
      }

      const transferReceipt = await provider.waitForTransaction(hash);

      if (!transferReceipt || transferReceipt.status !== 1) {
        throw new Error("Withdrawal transaction failed");
      }

      // Attempt to finalize the campaign after successful withdrawal
      let finalizeSucceeded = false;
      let finalizeErrorMessage: string | null = null;

      try {
        const finalizeData = contract.interface.encodeFunctionData(
          "finalize",
          []
        );
        const finalizeHash = await walletClient.sendTransaction({
          to: fundraiserAddress as `0x${string}`,
          data: finalizeData as `0x${string}`,
        });

        const finalizeReceipt = await provider.waitForTransaction(finalizeHash);

        if (finalizeReceipt && finalizeReceipt.status === 1) {
          finalizeSucceeded = true;
        } else {
          throw new Error("Finalization transaction failed");
        }
      } catch (finalizeError) {
        if (finalizeError instanceof Error) {
          const finalizeMessage = finalizeError.message.toLowerCase();
          if (finalizeMessage.includes("already finalized")) {
            finalizeSucceeded = true;
          } else if (finalizeMessage.includes("not authorized")) {
            finalizeErrorMessage =
              "Campaign finalized requires the campaign admin or owner wallet. Please reconnect with the authorized wallet.";
          } else {
            finalizeErrorMessage = finalizeError.message;
          }
        } else {
          finalizeErrorMessage = "Unknown error while finalizing the campaign.";
        }
      }

      if (finalizeSucceeded) {
        toast.success("Funds withdrawn and campaign finalized successfully!", {
          autoClose: 4000,
        });
      } else if (finalizeErrorMessage) {
        toast.warning(
          `Funds withdrawn, but finalizing the campaign failed: ${finalizeErrorMessage}`,
          { autoClose: 6000 }
        );
      }

      // Update state after attempt
      setHasFunds(false);
      setWithdrawableAmount(BigInt(0));
      // Refresh funds check
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error withdrawing funds:", error);

      let userFriendlyMessage = "Failed to withdraw funds. Please try again.";
      let shouldUpdateFundsState = false;

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // User cancellation
        if (
          errorMessage.includes("user rejected") ||
          errorMessage.includes("user denied") ||
          errorMessage.includes("denied transaction signature") ||
          errorMessage.includes("user cancelled")
        ) {
          toast.info("Withdrawal cancelled by user.", { autoClose: 4000 });
          return;
        }

        // No funds available
        if (errorMessage.includes("no funds available")) {
          userFriendlyMessage =
            "No funds available in the escrow wallet to withdraw.";
          shouldUpdateFundsState = true;
        }
        // Encoding/ABI errors
        else if (
          errorMessage.includes("unknown function") ||
          errorMessage.includes("invalid_argument") ||
          errorMessage.includes("encodefunctiondata")
        ) {
          userFriendlyMessage =
            "Unable to process withdrawal. There may be an issue with the USDC contract interface. Please contact support if this persists.";
          console.error("USDC ABI encoding error:", error);
        }
        // Wallet connection issues
        else if (
          errorMessage.includes("escrow wallet") ||
          errorMessage.includes("connect the escrow")
        ) {
          userFriendlyMessage = error.message;
        }
        // Insufficient allowance
        else if (
          errorMessage.includes("allowance") ||
          errorMessage.includes("approval")
        ) {
          userFriendlyMessage =
            "Insufficient approval to transfer funds. Please connect the escrow wallet or request approval.";
        }
        // Network/transaction errors
        else if (
          errorMessage.includes("network") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("nonce")
        ) {
          userFriendlyMessage =
            "Network error occurred. Please check your connection and try again.";
        }
        // Use the original error message if it's user-friendly
        else if (error.message.length < 200) {
          userFriendlyMessage = error.message;
        }
      }

      toast.error(userFriendlyMessage, {
        autoClose: 6000,
      });

      if (shouldUpdateFundsState) {
        setHasFunds(false);
        setWithdrawableAmount(BigInt(0));
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Show loading state while checking funds
  if (isCheckingFunds) {
    return (
      <CustomButton
        disabled
        className="py-2 px-6 bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-300 rounded-lg cursor-not-allowed"
      >
        <span className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          Checking funds...
        </span>
      </CustomButton>
    );
  }

  // Only show for Limitless funding type and campaign owner
  if (fundingType !== FundingType.Limitless || !campaignOwner) {
    return null;
  }

  // Show disabled state if no funds
  if (!hasFunds || withdrawableAmount < MIN_WITHDRAWABLE) {
    return (
      <div className="relative group">
        <CustomButton
          disabled
          className="py-2 px-6 bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-300 rounded-lg cursor-not-allowed"
        >
          No Funds Available
        </CustomButton>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          No funds available in escrow wallet to withdraw.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <CustomButton
        onClick={handleWithdraw}
        disabled={
          isWithdrawing ||
          isCheckingFunds ||
          !isConnected ||
          !hasFunds ||
          withdrawableAmount < MIN_WITHDRAWABLE
        }
        className="py-2 px-6 hover:bg-blueColor/80 dark:hover:bg-blueColor/70 bg-blueColor dark:bg-blueColor/90 text-white rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
      >
        {isWithdrawing ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            Withdrawing...
          </span>
        ) : (
          "Withdraw Funds"
        )}
      </CustomButton>
      {withdrawableAmount >= MIN_WITHDRAWABLE && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Available to withdraw: {formatWithdrawableAmount(withdrawableAmount)}{" "}
          USDC
        </span>
      )}
    </div>
  );
}
