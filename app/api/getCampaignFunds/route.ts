import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/utils/auth"
import { getCampaign } from "@/app/utils/getCampaign";
import axios from "axios";

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

        const campaign = await getCampaign(campaignId as string);
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }
        
        if (!campaign[0].hexboxAddress) {
            return NextResponse.json({ error: "Campaign hexbox address not found" }, { status: 404 });
        }

        const hexboxAddress = JSON.parse(campaign[0].hexboxAddress);

        const config = {
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [hexboxAddress.vault]
        }
        const walletBalance = await axios.post(`https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`, config,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )

        if (!walletBalance.data.result) {
            let errorMsg = `Hexbox wallet balance not found`
            if (walletBalance.data.error) {
                errorMsg += `: ${walletBalance.data.error}`
            }
            return NextResponse.json({ error: errorMsg }, { status: 404 });
        }

        const balanceInLamports = walletBalance.data.result.value
        const balance = balanceInLamports / 10 ** 9
        console.log(balance)
        
        return NextResponse.json(balance);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e }, { status: 500 });
    }
}
