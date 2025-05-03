/* import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { WalletDetails } from "@/app/types";

export const getWallet = async (wallet_address: string): Promise<WalletDetails | null> => {
    try {
  
        const mdbClient = client;
        const db = mdbClient.db("hexbox_poc");
        const wallet = await db
        .collection("wallets")
        .findOne({ 
            _id: new ObjectId(wallet_address),
        });

        if (!wallet) {
            return null
        }

        console.log(wallet)
        
        const walletDetails = {
            total_funds: wallet.total_funds,
            token_address: wallet.token_address,
        }

        return walletDetails as WalletDetails;
  
    } catch (error) {
        console.log(error);
        return null;
    }
}; */
