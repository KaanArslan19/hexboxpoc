import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/utils/auth"
import { getCampaign } from "@/app/utils/getCampaign";

// Add this export to mark the route as dynamic
export const dynamic = 'force-dynamic';

export const GET = async (req: NextRequest, res: NextResponse) => {
    try {
        // const session = await getServerSession(authOptions)

        // if (!session) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        console.log(req.nextUrl.searchParams);
        if (!req.nextUrl.searchParams.has("campaignId")) {
            return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
        }

        const campaignId = req.nextUrl.searchParams.get("campaignId");
        if (!ObjectId.isValid(campaignId as string)) {
            return NextResponse.json({ error: "Campaign ID is invalid" }, { status: 400 });
        }
        console.log(campaignId)

        const campaign = await getCampaign(campaignId as string);
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }
        return NextResponse.json(campaign);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e }, { status: 500 });
    }
}
