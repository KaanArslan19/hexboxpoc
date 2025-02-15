import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { MongoClient } from "mongodb";
import { getCampaignFromProduct } from "@/app/utils/poc_utils/getCampaignFromProduct";
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  console.log(productId);

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const campaign = await getCampaignFromProduct(productId);
  console.log(campaign);
  return NextResponse.json({ campaign });
  
}   