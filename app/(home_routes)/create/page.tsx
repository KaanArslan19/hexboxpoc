"use client";

import CampaignForm from "@/app/components/CampaignForm";
import { NewCampaignInfo } from "@/app/types";
import { useRouter } from "next/navigation"; // Use `next/navigation` for the new app router
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import SignInButton from "@/app/components/SignInButton";

export default function CreateProject() {
  const router = useRouter();
  const { data: session } = useSession();

  /*   useEffect(() => {
    if (session) {
      console.log(session);
    }
  }, [session]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">To continue, please sign in by clicking <span className="text-orangeColor">Select Wallet</span></h1>
      </div>
    )
  } */

  const handleCreateProject = async (values: NewCampaignInfo) => {
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("fund_amount", values.fundAmount.toString());
      formData.append("logo", values.logo);
      //formData.append("hexboxAddress", values.hexboxAddress);
      formData.append("totalSupply", values.totalSupply.toString());

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
