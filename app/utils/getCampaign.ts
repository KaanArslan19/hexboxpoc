import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export async function getCampaign(campaignId: string) {
  try {
    if (!ObjectId.isValid(campaignId)) {
      console.error("Invalid campaign ID");
      return null;
    }
    const mdbClient = client;
    const db = mdbClient.db("hexbox_main");
    const campaign = await db
      .collection("campaigns")
      .findOne({ _id: new ObjectId(campaignId) });
    return campaign;
  } catch (e) {
    console.error(e);
    return null;
  }
}
