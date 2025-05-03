/* import { MongoClient, ObjectId } from "mongodb";
import client from "@/app/utils/mongodb";

async function getCampaignTransactions(campaignId: string) {
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    const collection = db.collection("campaigns");
    const campaign = await collection.findOne({ _id: new ObjectId(campaignId) });
    
    return campaign?.transactions;
}

export default getCampaignTransactions;
 */
