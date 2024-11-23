import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export const getWalletTokenAddress = async (
  wallet_address: string
): Promise<string | null> => {
  const mdbClient = client;
  const db = mdbClient.db("hexbox_poc");
  const wallet = await db
    .collection("wallets")
    .findOne({ _id: new ObjectId(wallet_address) });
  const token = wallet?.token_address;

  if (!token) {
    console.log("Token not found");
    return null;
  }
  console.log(token);
  return token as string;
};
