import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { Product, TokenDetailsProps } from "@/app/types";

export const getProducts = async (campaignId: string) => {
  const mdbClient = client;
  const db = mdbClient.db("hexbox_poc");

  try {
    if (!ObjectId.isValid(campaignId)) {
      console.error("Invalid campaign ID provided:", campaignId);
      return null;
    }

    const campaign = await db
      .collection("campaigns")
      .findOne({ _id: new ObjectId(campaignId) });

    if (!campaign) {
      console.error("No campaign found with the given ID:", campaignId);
      return null;
    }

    return JSON.stringify(campaign.products || []);
  } catch (error) {
    console.error("Error in getProducts:", error);
    return null;
  }
};
