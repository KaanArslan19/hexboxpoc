import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/utils/auth"
import { uploadImageToR2 } from "@/app/utils/imageUpload";
import { ObjectId } from "mongodb";
import { getCampaign } from "@/app/utils/getCampaign";
import { buyToken } from "@/app/utils/poc_utils/buyToken";

export const POST = async (req: NextRequest, res: NextResponse) => {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData()
        if (!formData) {
            return NextResponse.json({ error: "Form data is required" }, { status: 400 });
        }

        const token_address = formData.get('token_address')
        const amount = formData.get('amount')
        const user = formData.get('user')   

        const buyTokenResponse = await buyToken(user as string, token_address as string, Number(amount))
        console.log(buyTokenResponse)
        
        return NextResponse.json(buyTokenResponse, { status: 200 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}