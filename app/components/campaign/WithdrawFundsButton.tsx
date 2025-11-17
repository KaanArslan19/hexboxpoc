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
        setHasFunds(false);
        setWithdrawableAmount(BigInt(0));
        return;
      }

      try {
        setIsCheckingFunds(true);
        // Reset state at the start to prevent showing stale values
        setHasFunds(false);
        setWithdrawableAmount(BigInt(0));
        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_TESTNET_RPC_URL
        );

        // For Limitless funding, check both contract balance and beneficiaryWallet balance
        // According to the contract, funds go to the contract first, then to beneficiaryWallet on finalization
        const contract = new ethers.Contract(
          fundraiserAddress,
          USDCFundraiserABI.abi,
          provider
        );

        // Get the beneficiaryWallet address (this is the business wallet where funds should go)
        // and check if finalized
        const [beneficiaryWallet, isFinalizedRaw] = await Promise.all([
          contract.beneficiaryWallet(),
          contract.finalized().catch((err) => {
            console.warn("Error checking finalized status:", err);
            return false; // If finalized() fails, assume not finalized
          }),
        ]);

        // Ensure isFinalized is a boolean
        const isFinalized = Boolean(isFinalizedRaw);

        // Verify beneficiaryWallet matches businessWallet (they should be the same)
        if (beneficiaryWallet.toLowerCase() !== businessWallet.toLowerCase()) {
          console.warn(
            "Beneficiary wallet mismatch:",
            beneficiaryWallet,
            "vs business wallet:",
            businessWallet
          );
        }

        // Use a complete ERC20 ABI for balance checking
        const ERC20_READ_ABI = [
          "function balanceOf(address account) view returns (uint256)",
          "function decimals() view returns (uint8)",
        ];

        const usdcReadContract = new ethers.Contract(
          CONTRACTS.USDC.fuji,
          ERC20_READ_ABI,
          provider
        );

        // Since beneficiaryWallet === businessWallet, we only need to check contract balance
        const [contractBalance, decimals] = await Promise.all([
          usdcReadContract.balanceOf(fundraiserAddress),
          usdcReadContract.decimals().catch((err: unknown) => {
            console.warn(
              "Unable to fetch USDC decimals, defaulting to 6:",
              err
            );
            return 6;
          }),
        ]);

        setUsdcDecimals(Number(decimals));

        // For Limitless funding:
        // - beneficiaryWallet === businessWallet (they're always the same - executor's wallet)
        // - If not finalized: funds are in the contract, executor can finalize to release them
        // - If finalized: funds are already in beneficiaryWallet (executor's wallet), nothing to withdraw
        // So we only need to check contract balance when not finalized
        let availableBalance: bigint;

        if (isFinalized) {
          // Campaign is finalized, funds are already in executor's wallet
          // Nothing available to withdraw
          availableBalance = BigInt(0);
        } else {
          // Campaign is NOT finalized, funds are in the contract
          // This is what can be withdrawn by calling finalize()
          if (contractBalance < MIN_WITHDRAWABLE) {
            availableBalance = BigInt(0);
          } else {
            availableBalance = contractBalance;
          }
        }

        // Validate the balance
        const hasAvailableFunds =
          typeof availableBalance === "bigint" &&
          availableBalance >= MIN_WITHDRAWABLE;

        // Debug logging
        console.log("Balance check:", {
          fundraiserAddress,
          beneficiaryWallet,
          businessWallet,
          isFinalized,
          contractBalance: contractBalance.toString(),
          availableBalance: availableBalance.toString(),
          hasAvailableFunds,
          note: isFinalized
            ? "Campaign finalized - funds already in executor's wallet, nothing to withdraw"
            : "Campaign not finalized - checking contract balance (can be withdrawn by finalizing)",
        });

        // Only set funds if we have a valid balance from the correct source
        if (hasAvailableFunds) {
          setWithdrawableAmount(availableBalance);
          setHasFunds(true);
        } else {
          setWithdrawableAmount(BigInt(0));
          setHasFunds(false);
        }
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
      toast.error("No funds available to withdraw from the wallet.", {
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

      // Get the beneficiaryWallet address (this is the business wallet where funds should go)
      // and check if finalized
      const [beneficiaryWallet, isFinalizedRaw] = await Promise.all([
        contract.beneficiaryWallet(),
        contract.finalized().catch(() => false),
      ]);

      const isFinalized = Boolean(isFinalizedRaw);

      // Verify beneficiaryWallet matches businessWallet (they should be the same)
      if (beneficiaryWallet.toLowerCase() !== businessWallet.toLowerCase()) {
        console.warn(
          "Beneficiary wallet mismatch in withdrawal:",
          beneficiaryWallet,
          "vs business wallet:",
          businessWallet
        );
      }

      // CRITICAL: Check balance BEFORE attempting any transaction
      // For Limitless: if not finalized, funds are in contract; if finalized, funds are already in beneficiaryWallet (executor's wallet)
      // Since beneficiaryWallet === businessWallet, we only need to check contract balance when not finalized

      if (isFinalized) {
        // Campaign is already finalized, funds are already in executor's wallet
        // Nothing to withdraw
        toast.info("Campaign is already finalized. Funds are in your wallet.", {
          autoClose: 4000,
        });
        setHasFunds(false);
        setWithdrawableAmount(BigInt(0));
        return;
      }

      // Campaign is NOT finalized, check contract balance
      const ERC20_READ_ABI = [
        "function balanceOf(address account) view returns (uint256)",
      ];

      const usdcReadContract = new ethers.Contract(
        CONTRACTS.USDC.fuji,
        ERC20_READ_ABI,
        provider
      );

      // Check contract balance
      const contractBalance = await usdcReadContract.balanceOf(
        fundraiserAddress
      );

      // Validate balance is greater than zero
      if (
        typeof contractBalance !== "bigint" ||
        contractBalance < MIN_WITHDRAWABLE
      ) {
        // Update state to reflect no funds
        setHasFunds(false);
        setWithdrawableAmount(BigInt(0));
        throw new Error(
          "No funds available to withdraw. Contract balance is zero."
        );
      }

      // FINAL BALANCE CHECK: Verify balance one more time right before transaction
      // This prevents race conditions where balance might have changed
      const finalContractBalance = await usdcReadContract.balanceOf(
        fundraiserAddress
      );

      if (
        typeof finalContractBalance !== "bigint" ||
        finalContractBalance < MIN_WITHDRAWABLE
      ) {
        setHasFunds(false);
        setWithdrawableAmount(BigInt(0));
        throw new Error(
          "No funds available to withdraw. Contract balance is zero."
        );
      }

      if (isFinalized) {
        // Campaign is already finalized, funds are already in beneficiaryWallet (executor's wallet)
        toast.info("Campaign is already finalized. Funds are in your wallet.", {
          autoClose: 4000,
        });
        setHasFunds(false);
        setWithdrawableAmount(BigInt(0));
        return;
      }

      // Campaign is NOT finalized, funds are in the contract
      // Call finalize() to release funds to beneficiaryWallet (executor's wallet)
      // For Limitless: finalize() checks if caller is owner or campaignAdmin, then transfers funds
      const finalizeData = contract.interface.encodeFunctionData(
        "finalize",
        []
      );
      const finalizeHash = await walletClient.sendTransaction({
        to: fundraiserAddress as `0x${string}`,
        data: finalizeData as `0x${string}`,
      });

      const finalizeReceipt = await provider.waitForTransaction(finalizeHash);

      if (!finalizeReceipt || finalizeReceipt.status !== 1) {
        throw new Error("Failed to finalize campaign and release funds");
      }

      // Finalization successful - funds are now in beneficiaryWallet (executor's wallet)
      toast.success(
        "Campaign finalized successfully! Funds have been released to your wallet.",
        {
          autoClose: 4000,
        }
      );

      // Update state after successful withdrawal
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
        className="py-2 px-6 bg-textMuted dark:bg-dark-surfaceHover text-white dark:text-dark-text rounded-lg cursor-not-allowed"
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
          className="py-2 px-6 bg-textMuted dark:bg-dark-surfaceHover text-white dark:text-dark-text rounded-lg cursor-not-allowed "
        >
          No Funds Available
        </CustomButton>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-blackColor dark:bg-dark-surface text-white dark:text-dark-text text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border dark:border-dark-border">
          No funds available in the wallet to withdraw.
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
        <span className="text-xs text-textMuted dark:text-dark-textMuted">
          Available to withdraw: {formatWithdrawableAmount(withdrawableAmount)}{" "}
          USDC
        </span>
      )}
    </div>
  );
}
