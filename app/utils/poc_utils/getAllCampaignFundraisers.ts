import client from "@/app/utils/mongodb";

export async function getAllCampaignFundraisers(): Promise<string[]> {
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    
    // Project only the _id and fundraiser_address fields
    const campaigns = await db.collection("campaigns")
        .find({})
        .project({ fundraiser_address: 1 })
        .toArray();
    
    // Map and filter out undefined/null addresses
    const fundraiserAddresses = campaigns
        .map(campaign => campaign.fundraiser_address)
        .filter((address): address is string => 
            address !== undefined && 
            address !== null && 
            address !== ''
        );
        
    return fundraiserAddresses;
}
