import client from "@/app/utils/mongodb";
import { v4 as uuidv4 } from "uuid";

export const createWallet = async (token_address: string, campaign_id: string) => {
  try {

    const walletUUID = uuidv4();

    const wallet = await client.db("hexbox_poc").collection("wallets").insertOne({
      address: walletUUID,
      total_funds: 0,
      token_address: token_address,
      campaign_id: campaign_id,
    });

    return walletUUID

  } catch (error) {
    console.log(error);
  }
};
