import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { deleteCampaignImage } from "@/app/utils/imageDelete";

export async function deleteCampaign(campaignId: string) {
    try {
        if (!ObjectId.isValid(campaignId)) {
            return { success: false, error: "Invalid campaign ID" };
        }

        const mdbClient = client;
        const db = mdbClient.db(process.env.HEXBOX_DB);
        const campaign = await db.collection("campaigns").findOne({ _id: new ObjectId(campaignId) });
        if (!campaign) {
            return { success: false, error: "Campaign not found" };
        }

        const deleteImageResult = await deleteCampaignImage(campaign.logo);
        if (!deleteImageResult) {
            console.error("Failed to delete campaign image");
        }

        const result = await db.collection("campaigns").deleteOne({ _id: new ObjectId(campaignId) });
        if (!result) {
            return { success: false, error: "Failed to delete campaign" };
        }
        return { success: true };
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return { success: false, error: String(error) };
    }
}
