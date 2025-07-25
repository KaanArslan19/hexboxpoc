import client from "@/app/utils/mongodb";

export async function isAddressValidCampaign(address: string): Promise<boolean> {
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    try {
        const campaign = await db
            .collection("campaigns")
            .findOne({ fundraiser_address: address });
        if (!campaign) {
            console.error("No campaign found with the given address:", address);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error checking campaign address:", error);
        return false;
    }
}