import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export const getCampaignFromProduct = async (productId: string) => {
  console.log(productId);

  // Check if productId is a valid ObjectId
  if (!ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID format");
  }

  try {
    const product = await client
      .db("hexbox_poc")
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });
    if (!product) {
      throw new Error("Product not found");
    }
    const campaignId = product.campaignId;
    console.log(campaignId);

    const campaign = await client
      .db("hexbox_poc")
      .collection("campaigns")
      .findOne({ _id: new ObjectId(campaignId) });
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const campaignData = {
      campaign: {
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
        is_verified: campaign.is_verified,
        factCheck: campaign.factCheck,
        funding_type: campaign.funding_type,
        evm_wa: campaign.evm_wa,
        configured: campaign.configured,
        transactions: campaign.transactions,
        fundraiser_address: campaign.fundraiser_address,
        last_synced: campaign.last_synced,
        funds_management: campaign.funds_management,
      },
    };

    return campaignData;
  } catch (error) {
    console.error("Error fetching campaign:", error);
    throw error;
  }
};
