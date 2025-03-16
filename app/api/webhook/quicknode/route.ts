import client from "@/app/utils/mongodb";
import { NextRequest } from "next/server";
import { getAllCampaignFundraisers } from "@/app/utils/poc_utils/getAllCampaignFundraisers";
import { ethers } from "ethers";
import USDCFundraiserABI from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";
import { syncExternalData } from "@/app/utils/sync/syncExternalData";
const WEBHOOK_SECRET = "jhsdhsdah" //process.env.WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("secret");

    if (token !== WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const reqData = await req.json();
    //console.log("Data:", reqData);

    // TODO: Handle the webhook data
    if (!reqData || reqData.length === 0) {
        console.log("No data received");
        return Response.json({ message: "No data received" });
    }

    const campaignFundraisers = await getAllCampaignFundraisers();
    //console.log("Campaign fundraisers:", campaignFundraisers);

    if (!reqData.data[0] || !reqData.data[0].transactions) {
        console.log("No transactions received");
        return Response.json({ message: "No transactions received" });
    }
    console.log("No. blocks in stream:", reqData.data.length);
    console.log("Block number:", BigInt(reqData.data[0].number));

    const transactions = reqData.data[0].transactions;
    //console.log("Transactions:", transactions);

    // Group transactions by campaign address
    const campaignTransactions: { [key: string]: any[] } = {};

    for (const transaction of transactions) {
        const campaignAddress = transaction.to?.toLowerCase();
        const fromAddress = transaction.from?.toLowerCase();
        
        // Check if this transaction involves a campaign (either as sender or receiver)
        const relevantAddress = campaignFundraisers.includes(campaignAddress) 
            ? campaignAddress 
            : campaignFundraisers.includes(fromAddress) 
                ? fromAddress 
                : null;

        if (relevantAddress) {
            if (!campaignTransactions[relevantAddress]) {
                campaignTransactions[relevantAddress] = [];
            }

            // Create interface for decoding
            const iface = new ethers.Interface(USDCFundraiserABI.abi);
            
            // Decode the input data
            let decodedData;
            try {
                decodedData = iface.parseTransaction({ 
                    data: transaction.input,
                    value: transaction.value 
                });
                
                const transactionData = {
                    transactionHash: transaction.hash,
                    blockNumber: BigInt(reqData.data[0].number),
                    timestamp: new Date(),
                    from: transaction.from,
                    to: transaction.to,
                    input: transaction.input,
                    decodedFunction: {
                        name: decodedData?.name,
                        args: decodedData?.args.map(arg => 
                            typeof arg === 'bigint' ? arg.toString() : arg
                        ),
                        signature: decodedData?.signature,
                        formatted: `${decodedData?.name}(${decodedData?.args.map(arg => 
                            typeof arg === 'bigint' ? arg.toString() : arg
                        ).join(', ')})`
                    }
                };
                campaignTransactions[relevantAddress].push(transactionData);
            } catch (error) {
                console.log("Failed to decode input for transaction:", transaction.transactionHash);
                const transactionData = {
                    transactionHash: transaction.hash,
                    blockNumber: BigInt(reqData.data[0].number),
                    timestamp: new Date(),
                    from: transaction.from,
                    to: transaction.to,
                    input: transaction.input,
                    decodedFunction: null
                };
                campaignTransactions[relevantAddress].push(transactionData);
            }
        }
    }

    // Update MongoDB for each campaign
    const db = client.db("hexbox_poc");
    const campaignsCollection = db.collection("campaigns");

    for (const [campaignAddress, txs] of Object.entries(campaignTransactions)) {
        if (txs.length > 0) {
            try {
                await campaignsCollection.updateOne(
                    { fundraiser_address: campaignAddress },
                    { 
                        $addToSet: { 
                            transactions: { 
                                $each: txs 
                            }
                        }
                    },
                    { upsert: true }
                );
                console.log(`Updated transactions for campaign: ${campaignAddress}`);
                // Sync product stock levels
                const productUpdates = await syncExternalData(campaignAddress);
                console.log(`Product updates: ${JSON.stringify(productUpdates)}`);
            } catch (error) {
                console.error(`Failed to update transactions for campaign ${campaignAddress}:`, error);
            }
        }
    }

    return Response.json({ message: "Webhook processed successfully" });
}
