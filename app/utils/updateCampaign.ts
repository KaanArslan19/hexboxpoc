"use server";

import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { uploadImageToR2 } from "@/app/utils/imageUpload";

export async function updateCampaign(campaignId: string, campaignData: any) {
  try {
    if (!ObjectId.isValid(campaignId)) {
      console.error("Invalid campaign ID");
      return null;
    }

    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");

    const existingCampaign = await db
      .collection("campaigns")
      .findOne({ _id: new ObjectId(campaignId) });
    console.log("-------------", existingCampaign);
    if (!existingCampaign) {
      console.error("No campaign found with the provided ID");
      return null;
    }

    let updatedFields = { ...campaignData };

    if (campaignData.logo instanceof File) {
      const newLogoFileName = await uploadImageToR2(campaignData.logo);
      updatedFields.logo = newLogoFileName;
    } else {
      updatedFields.logo = existingCampaign.logo;
    }

    const result = await db
      .collection("campaigns")
      .updateOne({ _id: new ObjectId(campaignId) }, { $set: updatedFields });

    if (result.matchedCount === 0) {
      console.error("No campaign found with the provided ID");
      return null;
    }
    console.log(" --------------------------", result);
    return result;
  } catch (e) {
    console.error("Error updating campaign:", e);
    return null;
  }
}
