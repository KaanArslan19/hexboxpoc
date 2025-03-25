"use client";

import CampaignForm from "@/app/components/CampaignForm";
import useIsAuth from "@/app/lib/auth/hooks/useIsAuth";
import { NewCampaignInfo } from "@/app/types";
import { useRouter } from "next/navigation";
import React from "react";
import { useAccount } from "wagmi";
import { createCampaignTransaction } from "@/app/utils/poc_utils/campaignCreationTransaction";
import { useTransaction } from "@/app/hooks/useTransaction";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function CreateProject() {
  const router = useRouter();
  const { isAuth } = useIsAuth();
  const { address } = useAccount();

  const { sendTransaction, isLoading, error } = useTransaction({
    onSuccess: async (hash, responseData) => {
      const campaignCreationData = await createCampaignTransaction({
        hash,
        campaignId: responseData.campaignId,
      });

      if (campaignCreationData.success) {
        router.push(`/thank-you?campaignId=${responseData.campaignId}`);
      }
    },
    onError: async (error, responseData) => {
      console.error("Campaign creation failed:", error);

      // Clean up the campaign from database
      if (responseData?.campaignId) {
        try {
          console.log(
            "Attempting to delete campaign:",
            responseData.campaignId
          );
          const cleanupResponse = await fetch("/api/deleteCampaign", {
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

          console.log("Cleanup response status:", cleanupResponse.status);
          const cleanupData = await cleanupResponse.json();
          console.log("Cleanup response data:", cleanupData);

          if (!cleanupData.success) {
            console.error("Failed to clean up campaign:", cleanupData.error);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up campaign:", cleanupError);
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
      const formData = new FormData();

      // Append all form data
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("fund_amount", values.fundAmount.toString());
      formData.append("logo", values.logo);
      formData.append("location", values.location);
      formData.append("wallet_address", values.walletAddress);
      formData.append("deadline", values.deadline.toString());
      formData.append("email", values.email);
      formData.append("phoneNumber", values.phoneNumber);
      formData.append("one_liner", values.one_liner);
      formData.append("social_links", JSON.stringify(values.social_links));
      formData.append("funding_type", values.funding_type.toString());
      formData.append("product_or_service", values.productOrService.toString());
      formData.append("walletAddress", values.walletAddress);

      const firstResponse = await fetch("/api/createCampaign", {
        method: "POST",
        body: formData,
      });

      const responseData = await firstResponse.json();

      if (!responseData.transaction) {
        throw new Error("Failed to create campaign");
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
      throw error; // Re-throw to allow form to handle the error
    }
  };

  return (
    <div className="relative">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {isLoading && (
        <>
          <div className="fixed top-0 left-0 w-full bg-blueColor text-white p-2 text-center z-50">
            Transaction in progress...
          </div>
          <div className="absolute inset-0 bg-white/50 cursor-not-allowed z-40" />
        </>
      )}
      <CampaignForm onSubmit={handleCreateProject} />
    </div>
  );
}
