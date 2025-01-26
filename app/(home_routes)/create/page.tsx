"use client";

import CampaignForm from "@/app/components/CampaignForm";
import useIsAuth from "@/app/lib/auth/hooks/useIsAuth";
import { NewCampaignInfo } from "@/app/types";
import { useRouter } from "next/navigation";
import React from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
export default function CreateProject() {
  const router = useRouter();
  const { isAuth } = useIsAuth();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  if (!isAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">
          To continue, please sign in by clicking{" "}
          <span className="text-orangeColor">Connect Wallet</span>
        </h1>
      </div>
    );
  }
  const handleCreateProject = async (values: NewCampaignInfo) => {
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("fund_amount", values.fundAmount.toString());
      formData.append("logo", values.logo);
      formData.append("wallet_address", values.walletAddress);
      formData.append("deadline", values.deadline.toString());
      formData.append("one_liner", values.one_liner);
      formData.append("social_links", values.social_links.toString());
      formData.append("funding_type", values.funding_type.toString());
      formData.append(
        "product_or_service",
        values.product_or_service.toString()
      );
      console.log(formData);
      const firstResponse = await fetch("/api/createCampaign", {
        method: "POST",
        body: formData,
      });

      const data = await firstResponse.json();
      if (!data.transaction) {
        throw new Error("Failed to create campaign");
      }

      // Send the transaction
      const hash = await walletClient?.sendTransaction({
        ...data.transaction,
        account: address,
      });
      console.log(hash);

      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        timeout: 60_000,
        onReplaced: (replacement) => {
          console.log("Transaction replaced:", replacement);
        },
      });
      console.log(receipt);
      console.log("start 2nd");
      const secondResponse = await fetch("/api/confirmCreationOfCampaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Make sure this header is set
        },
        body: JSON.stringify({
          // Properly stringify the body
          transactionHash: hash,
          status: "success",
          campaignId: data.campaignId,
        }),
      });
      console.log("done 2nd");
      const secondData = await secondResponse.json();
      console.log(secondData);

      //router.push("/campaigns");
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  return (
    <div>
      <CampaignForm onSubmit={handleCreateProject} />
    </div>
  );
}
