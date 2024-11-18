import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export const getWalletTokenAddress = async (token_address: string) => {
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    const token = await db.collection("tokens").findOne({ _id: new ObjectId(token_address) });
    const wallet = token?.wallet_address;

    if (!wallet) {
        console.log("Wallet not found");
        return null;
    }
    console.log(wallet)

    return wallet;
}
