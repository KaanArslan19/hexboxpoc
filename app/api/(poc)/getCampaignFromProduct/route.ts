import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { MongoClient } from "mongodb";
import { getCampaignFromProduct } from "@/app/utils/poc_utils/getCampaignFromProduct";

/**
 * GET handler for fetching campaign data associated with a product
 * Supports field filtering via fields parameter (comma-separated list)
 * Example: /api/getCampaignFromProduct?productId=123&fields=title,description,fundraiser_address
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const fieldsParam = searchParams.get("fields");
  
  console.log("Product ID:", productId);
  console.log("Requested fields:", fieldsParam || "all");

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  try {
    // Get the full campaign data
    const fullCampaignData = await getCampaignFromProduct(productId);
    
    // If no specific fields requested, return all data
    if (!fieldsParam) {
      return NextResponse.json(fullCampaignData);
    }
    
    // Parse requested fields
    const requestedFields = fieldsParam.split(',').map(field => field.trim());
    
    // Filter the campaign data to include only requested fields
    const campaign = fullCampaignData.campaign as Record<string, any>;
    const filteredCampaign: Record<string, any> = {};
    
    // Always include _id for reference
    filteredCampaign._id = campaign._id;
    
    // Add requested fields
    requestedFields.forEach(field => {
      if (field in campaign && field !== '_id') {
        filteredCampaign[field] = campaign[field];
      }
    });
    
    console.log("Returning filtered campaign data with fields:", Object.keys(filteredCampaign));
    return NextResponse.json({ campaign: filteredCampaign });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
  }
}