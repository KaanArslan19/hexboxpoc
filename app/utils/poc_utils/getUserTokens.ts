/* import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export const getUserTokens = async (user: string, token_address: string): Promise<number | null> => {
    try {
  
        const mdbClient = client;
        const db = mdbClient.db(process.env.HEXBOX_DB);
        const token = await db
        .collection("tokens")
        .findOne({ 
            _id: new ObjectId(token_address),
        });

        if (!token) {
            return null
        }

        console.log(token)
        
        const userBalance = token?.holders.find((holder: any) => holder.address === user)?.balance;

        return userBalance as number | null;
  
    } catch (error) {
        console.log(error);
        return null;
    }
  }; */
