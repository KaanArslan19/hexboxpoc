import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/utils/auth"
import { uploadImageToR2 } from "@/app/utils/imageUpload";
import { ObjectId } from "mongodb";
import { getCampaign } from "@/app/utils/getCampaign";


export const PUT = async (req: NextRequest, res: NextResponse) => {

    try {
        // const session = await getServerSession(authOptions)

        // if (!session) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        const formData = await req.formData()
        if (!formData) {
            return NextResponse.json({ error: "Campaign data is required" }, { status: 400 });
        }

        if (!req.nextUrl.searchParams.get('campaignId')) {
            return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
        }
        const campaignId = req.nextUrl.searchParams.get('campaignId')
        if (!ObjectId.isValid(campaignId as string)) {
            return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
        }

        const campaign = await getCampaign(campaignId as string);
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        } 

        const campaignDetails = campaign[0];

        if (formData.get('title')) {
            if (formData.get('title') !== campaignDetails.title) {
                campaignDetails.title = formData.get('title')
            }
        }
        if (formData.get('description')) {
            if (formData.get('description') !== campaignDetails.description) {
                campaignDetails.description = formData.get('description')
            }
        }
        if (formData.get('logo')) {
            const logoFileName = await uploadImageToR2(formData.get('logo') as File)
            campaignDetails.logo = logoFileName
        }

        console.log(campaignDetails)

        const mdbClient = client;
        const db = mdbClient.db("hexbox_main");
        const campaignIdObj = new ObjectId(campaignId as string)
        const result = await db.collection("campaigns").updateOne({ _id: campaignIdObj}, { $set: campaignDetails });

        return NextResponse.json({ message: "Campaign updated successfully" }, { status: 200 });    
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error }, { status: 500 });
    }
}