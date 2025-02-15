import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export const getCampaignFromProduct = async (productId: string) => {
    console.log(productId);
  const product = await client.db("hexbox_poc").collection("products").findOne({ _id: new ObjectId(productId) });
  if (!product) {
    throw new Error("Product not found");
  }
  const campaignId = product.campaignId;
  console.log(campaignId);

  const campaign = await client.db("hexbox_poc").collection("campaigns").findOne({ _id: new ObjectId(campaignId) });
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return campaign;
}
