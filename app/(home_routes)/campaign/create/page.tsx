"use client";

import CampaignForm from "@/app/components/CampaignForm";
import useIsAuth from "@/app/lib/auth/hooks/useIsAuth";
import { NewCampaignInfo } from "@/app/types";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { createCampaignTransaction } from "@/app/utils/poc_utils/campaignCreationTransaction";
import { useTransaction } from "@/app/hooks/useTransaction";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { apiFetch } from "@/app/utils/api-client";
import { toast } from "react-toastify";

export default function CreateProject() {
  const router = useRouter();
  const { isAuth } = useIsAuth();
  const { address } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { sendTransaction, isLoading, error } = useTransaction({
    onSuccess: async (hash, responseData) => {
      try {
        setIsSubmitting(true);
        setSubmitError(null);

        const campaignCreationData = await createCampaignTransaction({
          hash,
          campaignId: responseData.campaignId,
        });

        if (campaignCreationData.success) {
          toast.success("Campaign created successfully!");
          router.push(`/thank-you?campaignId=${responseData.campaignId}`);
        } else {
          throw new Error(
            campaignCreationData.error || "Failed to finalize campaign creation"
          );
        }
      } catch (error) {
        console.error("Error finalizing campaign:", error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to finalize campaign creation"
        );
        toast.error("Failed to finalize campaign creation");
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: async (error, responseData) => {
      console.error("Campaign creation failed:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Transaction failed"
      );
      toast.error("Campaign creation failed. Please try again.");

      // Clean up the campaign from database
      if (responseData?.campaignId) {
        try {
          console.log(
            "Attempting to delete campaign:",
            responseData.campaignId
          );

          const cleanupResponse = await apiFetch("/api/deleteCampaign", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("hexbox_auth")}`,
            },
            body: JSON.stringify({
              campaignId: responseData.campaignId,
            }),
          });

          if (!cleanupResponse.ok) {
            throw new Error(
              `Cleanup failed with status: ${cleanupResponse.status}`
            );
          }

          const cleanupData = await cleanupResponse.json();
          console.log("Cleanup response data:", cleanupData);

          if (!cleanupData.success) {
            console.error("Failed to clean up campaign:", cleanupData.error);
            toast.warning(
              "Campaign created but cleanup failed. Please contact support."
            );
          } else {
            console.log("Campaign cleanup successful");
          }
        } catch (cleanupError) {
          console.error("Error cleaning up campaign:", cleanupError);
          toast.warning(
            "Campaign created but cleanup failed. Please contact support."
          );
        }
      }
    },
  });

  if (!isAuth) {
    return (
      <div className="flex items-center justify-center h-screen gap-4">
        <h1 className="text-2xl ">To continue, please sign in by clicking </h1>
        <ConnectButton
          showBalance={false}
          accountStatus="address"
          chainStatus="icon"
        />
      </div>
    );
  }

  const handleCreateProject = async (values: NewCampaignInfo) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Validate required fields
      if (!address) {
        throw new Error("Wallet connection is required");
      }

      const formData = new FormData();

      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("fund_amount", values.fundAmount.toString());
      formData.append("logo", values.logo);
      formData.append("location", values.location);
      formData.append("wallet_address", values.wallet_address);
      formData.append("deadline", values.deadline.toString());
      formData.append("email", values.email);
      formData.append("phoneNumber", values.phoneNumber);
      formData.append("one_liner", values.one_liner);
      formData.append("social_links", JSON.stringify(values.social_links));
      formData.append("funding_type", values.funding_type.toString());
      formData.append("funds_management", values.funds_management);
      if (values.turnstileToken) {
        formData.append("turnstileToken", values.turnstileToken);
      }
      const firstResponse = await apiFetch("/api/createCampaign", {
        method: "POST",
        body: formData,
      });

      if (!firstResponse.ok) {
        const errorData = await firstResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server error: ${firstResponse.status}`
        );
      }

      const responseData = await firstResponse.json();
      console.log("API Response:", responseData);

      // Check if there's an error in the response
      if (responseData.error) {
        throw new Error(responseData.error);
      }

      if (!responseData.transaction) {
        throw new Error("Failed to prepare transaction");
      }

      // Send transaction
      await sendTransaction(
        {
          ...responseData.transaction,
          account: address,
        },
        responseData
      );
    } catch (error) {
      console.error("Error creating campaign:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
      throw error; // Re-throw to allow form to handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Global Error Display */}
      {(error || submitError) && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mx-auto max-w-[1000px]">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Campaign Creation Failed
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300 break-words max-w-[900px]">
                {error || submitError}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => {
                    setSubmitError(null);
                    window.location.reload();
                  }}
                  className="text-sm bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading States */}
      {(isLoading || isSubmitting) && (
        <>
          <div className="fixed top-0 left-0 w-full bg-blueColor text-white p-3 text-center z-50 shadow-lg">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              {isLoading
                ? "Transaction in progress..."
                : "Creating campaign..."}
            </div>
          </div>
          <div className="absolute inset-0 bg-white/50 dark:bg-dark-surface/50 cursor-not-allowed z-40" />
        </>
      )}

      <CampaignForm onSubmit={handleCreateProject} />
    </div>
  );
}
