import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export const getTokenWalletAddress = async (token_address: string) => {
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    const token = await db.collection("tokens").findOne({ _id: new ObjectId(token_address) });
    if (!token) {
        console.log("Token not found");
        return null;
    }

    const wallet = await db.collection("wallets").findOne({ token_address: token_address });

    if (!wallet) {
        console.log("Wallet not found");
        return null;
    }

    const walletAddress = wallet?._id;
    const walletAddressString = walletAddress?.toString();

    return walletAddressString;
}
