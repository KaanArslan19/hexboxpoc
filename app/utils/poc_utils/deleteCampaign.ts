import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export async function deleteCampaign(campaignId: string) {
    try {
        if (!ObjectId.isValid(campaignId)) {
            return { success: false, error: "Invalid campaign ID" };
        }

        const mdbClient = client;
        const db = mdbClient.db("hexbox_poc");
        const campaign = await db.collection("campaigns").findOne({ _id: new ObjectId(campaignId) });
        if (!campaign) {
            return { success: false, error: "Campaign not found" };
        }
        const result = await db.collection("campaigns").deleteOne({ _id: new ObjectId(campaignId) });
        return { success: true, result };
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return { success: false, error: String(error) };
    }
}
