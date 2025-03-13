import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCampaign } from "@/app/utils/getCampaign";
import { getServerSideUser } from "@/app/utils/getServerSideUser";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, res: NextResponse) => {
  try {
    /*     const session = await getServerSideUser(req);
    console.log("getServerSideUser------------", session);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      console.log(session.address);
    } */

    if (!req.nextUrl.searchParams.has("campaignId")) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const campaignId = req.nextUrl.searchParams.get("campaignId");
    if (!ObjectId.isValid(campaignId as string)) {
      return NextResponse.json(
        { error: "Campaign ID is invalid" },
        { status: 400 }
      );
    }

    const campaign = await getCampaign(campaignId as string);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(campaign);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
