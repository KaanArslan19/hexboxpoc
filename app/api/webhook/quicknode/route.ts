import client from "@/app/utils/mongodb";
import { NextRequest } from "next/server";
import { getAllCampaignFundraisers } from "@/app/utils/poc_utils/getAllCampaignFundraisers";

const WEBHOOK_SECRET = "jhsdhsdah" //process.env.WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("secret");

    if (token !== WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const reqData = await req.json();
    console.log("Data:", reqData);

    // TODO: Handle the webhook data
    if (!reqData || reqData.length === 0) {
        console.log("No data received");
        return Response.json({ message: "No data received" });
    }

    const campaignFundraisers = await getAllCampaignFundraisers();
    console.log("Campaign fundraisers:", campaignFundraisers);

    if (!reqData.data[0] || !reqData.data[0].transactions) {
        console.log("No transactions received");
        return Response.json({ message: "No transactions received" });
    }

    const transactions = reqData.data[0].transactions;
    let filteredTransactions = [];

    for (const transaction of transactions) {
        if (campaignFundraisers.includes(transaction.to)) {
            const transactionData = {
                transactionHash: transaction.transactionHash,
                transactionIndex: transaction.transactionIndex,
                from: transaction.from,
                to: transaction.to,
                value: transaction.value,
                gas: transaction.gas,
                gasPrice: transaction.gasPrice,
                input: transaction.input,
            }
            filteredTransactions.push(transactionData);
        }
        
        if (campaignFundraisers.includes(transaction.from)) {
            const transactionData = {
                transactionHash: transaction.transactionHash,
                transactionIndex: transaction.transactionIndex,
                from: transaction.from,
                to: transaction.to,
                value: transaction.value,
                gas: transaction.gas,
                gasPrice: transaction.gasPrice,
                input: transaction.input,
            }
            filteredTransactions.push(transactionData);
        }
    }
    if (filteredTransactions.length > 0) {
        // Connect to MongoDB and save the data
        const mdbClient = client;
        const db = mdbClient.db("hexbox_poc");
        const collection = db.collection("sample_blockchain_data");
        await collection.insertOne({
            data: filteredTransactions
        });
    } else {
        console.log("No transactions to save");
    }

    //console.log("✅ Webhook verified:", data);


    return Response.json({ message: "Webhook received securely" });
}
