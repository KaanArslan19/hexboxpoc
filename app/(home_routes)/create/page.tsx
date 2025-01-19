"use client";

import CampaignForm from "@/app/components/CampaignForm";
import useIsAuth from "@/app/lib/auth/hooks/useIsAuth";
import { NewCampaignInfo } from "@/app/types";
import { useRouter } from "next/navigation";
import React, { use, useEffect } from "react";

export default function CreateProject() {
  const router = useRouter();
  const { isAuth } = useIsAuth();

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
      const response = await fetch("/api/createCampaign", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create campaign");
      }
      router.push("/campaigns");
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
