import client from "@/app/utils/mongodb";
import { NextRequest } from "next/server";


const WEBHOOK_SECRET = "jhsdhsdah" //process.env.WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("secret");

    if (token !== WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const data = await req.json();

    // TODO: Handle the webhook data
    // Connect to MongoDB and save the data
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");
    const collection = db.collection("sample_blockchain_data");
    await collection.insertOne({
        data: data
    });

    console.log("✅ Webhook verified:", data);


    return Response.json({ message: "Webhook received securely" });
}
