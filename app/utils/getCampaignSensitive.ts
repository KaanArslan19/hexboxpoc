import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export async function getCampaign(campaignId: string, censored: boolean) {
  try {
    if (!ObjectId.isValid(campaignId)) {
      console.error("Invalid campaign ID");
      return null;
    }
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    const campaign = await db
      .collection("campaigns")
      .findOne({ _id: new ObjectId(campaignId) });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (censored) {
      return {
        _id: campaign._id,
        user_id: campaign.user_id,
        title: campaign.title,
        description: campaign.description,
        wallet_address: campaign.wallet_address,
        logo: campaign.logo,
        timestamp: campaign.timestamp,
        status: campaign.status,
        fund_amount: campaign.fund_amount,
        total_raised: campaign.total_raised,
        one_liner: campaign.one_liner,
        social_links: campaign.social_links,
        location: campaign.location,
        deadline: campaign.deadline,
        email: campaign.email,
        phoneNumber: campaign.phoneNumber,
        is_verified: campaign.is_verified,
        factCheck: campaign.factCheck,
        funding_type: campaign.funding_type,
        evm_wa: campaign.evm_wa,
        configured: campaign.configured,
        transactions: campaign.transactions,
        fundraiser_address: campaign.fundraiser_address,
        last_synced: campaign.last_synced,
        comments: campaign.comments,
        funds_management: campaign.funds_management,
      };
    }

    return campaign;
  } catch (e) {
    console.error(e);
    return null;
  }
}
