import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { TokenDetailsProps } from "@/app/types";

export const getProposals = async (wallet_address: string) => {
  console.log(`Wallet Address: ${wallet_address}`);
  const mdbClient = client;
  const db = mdbClient.db("hexbox_poc");
  const proposals = await db
    .collection("proposals")
    .find({ wallet_address: wallet_address })
    .toArray();
  console.log(`Proposals: ${proposals}`);
  return proposals;
};