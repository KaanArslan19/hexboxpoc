import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export const getUserTokens = async (user: string, token_address: string) => {
    try {
  
        const mdbClient = client;
        const db = mdbClient.db("hexbox_poc");
        const token = await db
        .collection("tokens")
        .findOne({ 
            _id: new ObjectId(token_address),
        });

        console.log(token)
        
        const userBalance = token?.holders.find((holder: any) => holder.address === user)?.balance;

        return userBalance || 0;
  
    } catch (error) {
        console.log(error);
    }
  };