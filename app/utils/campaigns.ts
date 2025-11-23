import "server-only";
import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

function getFindOptions(includeSensitive: boolean) {
  if (includeSensitive) {
    return {};
  }
  return {
    projection: {
      email: 0,
      phoneNumber: 0,
    },
  };
}

async function fetchCampaign(campaignId: string, includeSensitive: boolean) {
  if (!ObjectId.isValid(campaignId)) {
    console.error("Invalid campaign ID");
    return null;
  }
  const db = client.db(process.env.HEXBOX_DB);
  try {
    const campaign = await db
      .collection("campaigns")
      .findOne(
        { _id: new ObjectId(campaignId) },
        getFindOptions(includeSensitive)
      );
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    return campaign;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getPublicCampaign(campaignId: string) {
  return fetchCampaign(campaignId, false);
}

export async function getExecutorCampaign(campaignId: string) {
  // Ensure you call this only from server code and after validating executor/owner.
  return fetchCampaign(campaignId, true);
}
