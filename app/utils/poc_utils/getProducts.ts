import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { TokenDetailsProps } from "@/app/types";

export const getProducts = async (campaignId: string) => {
  const mdbClient = client;
  const db = mdbClient.db("hexbox_poc");
  const products = await db
    .collection("campaign")
    .find({ campaignId: campaignId })
    .toArray();
  console.log(`Products: ${products}`);
  return products;
};
