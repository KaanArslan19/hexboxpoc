"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import {
  NewCampaignInfoResponse,
  CampaignInfoUpdate,
  FundingType,
} from "@/app/types";
import UpdateCampaignForm from "./UpdateCampaignForm";

interface Props {
  campaign: NewCampaignInfoResponse;
}

export default function UpdateCampaign({ campaign }: Props) {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaignId");
  console.log("campaign", campaign);
  const initialValues = {
    ...campaign,
    deadline: campaign.deadline
      ? new Date(Number(campaign.deadline)).toISOString().split("T")[0]
      : "",
    social_links: {
      telegram: campaign.social_links?.telegram || "",
      discord: campaign.social_links?.discord || "",
      website: campaign.social_links?.website || "",
      linkedIn: campaign.social_links?.linkedIn || "",
    },
    fund_amount: campaign.fund_amount || 0,
    funding_type: campaign.funding_type || FundingType,
    wallet_address: campaign.wallet_address || "",
  };
  console.log("initialValues", initialValues);
  const handleImageRemove = (source: string) => {
    console.log("Image removed", source);
  };

  const handleOnSubmit = async (values: CampaignInfoUpdate) => {
    console.log("Values Campaign update", values);

    try {
      if (!campaignId) {
        throw new Error("Campaign ID is missing");
      }

      console.log("Submitting values:", values);
      const formData = new FormData();

      formData.append("title", values.title);
      formData.append("email", values.email);
      formData.append("phoneNumber", values.phoneNumber);
      formData.append("description", values.description);
      formData.append("location", values.location);

      formData.append("funding_type", values.funding_type.toString());

      formData.append("wallet_address", values.wallet_address);

      formData.append("fund_amount", values.fund_amount.toString());

      if (values.deadline) {
        const deadlineValue =
          typeof values.deadline === "number"
            ? values.deadline
            : new Date(values.deadline).getTime();

        formData.append("deadline", String(deadlineValue));
        console.log("Deadline being sent:", deadlineValue);
      }

      if (values.one_liner) {
        formData.append("one_liner", values.one_liner);
      }

      formData.append(
        "social_links",
        JSON.stringify({
          telegram: values.social_links?.telegram || "",
          discord: values.social_links?.discord || "",
          website: values.social_links?.website || "",
          linkedIn: values.social_links?.linkedIn || "",
        })
      );

      if (values.logo && values.logo instanceof File) {
        formData.append("logo", values.logo);
      }

      console.log(
        "formData prepared, sending request with campaignId:",
        campaignId
      );

      const response = await fetch(
        `/api/updateCampaign?campaignId=${campaignId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update campaign");
      }

      const result = await response.json();
      console.log("Campaign updated successfully:", result);

      window.location.href = "/campaigns";
    } catch (error) {
      console.error("Failed to update campaign:", error);
      throw error;
    }
  };

  return (
    <UpdateCampaignForm
      initialValuesProp={initialValues}
      onImageRemove={handleImageRemove}
      onSubmit={handleOnSubmit}
    />
  );
}
