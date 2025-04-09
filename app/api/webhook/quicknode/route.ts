import client from "@/app/utils/mongodb";
import { NextRequest } from "next/server";
import { getAllCampaignFundraisers } from "@/app/utils/poc_utils/getAllCampaignFundraisers";
import { ethers } from "ethers";
import USDCFundraiserABI from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";
import { syncExternalData } from "@/app/utils/sync/syncExternalData";
const WEBHOOK_SECRET = "jhsdhsdah"; //process.env.WEBHOOK_SECRET;

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

    console.log("reqData:", reqData);

    const campaignFundraisers = await getAllCampaignFundraisers();
    //console.log("Campaign fundraisers:", campaignFundraisers);

    // let isTransaction = false;
    // let isReceipt = false;
    // if (!reqData.transactions || reqData.transactions.length === 0) {
    //     console.log("No transactions received");
    //     isTransaction = false;
    // }
    // if (!reqData.receipts || reqData.receipts.length === 0) {
    //     console.log("No receipts received");
    //     isReceipt = false;    
    // }
    // if (!isTransaction && !isReceipt) {
    //     console.log("No transactions or receipts received");
    //     return Response.json({ message: "No transactions or receipts received" });
    // }

    const transactions = reqData.transactions;
    //console.log("Transactions:", transactions);

    // Initialize provider for checking transaction receipts
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_TESTNET_RPC_URL);

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
            // Get transaction receipt to check status
            let receipt;
            try {
                receipt = await provider.getTransactionReceipt(transaction.hash);
                
                // Skip if no receipt yet (transaction still pending)
                if (!receipt) {
                    console.log(`Transaction ${transaction.hash} is still pending. Skipping.`);
                    continue;
                }
                
                // Skip failed transactions
                if (receipt.status === 0) {
                    console.log(`Transaction ${transaction.hash} failed. Skipping.`);
                    continue;
                }
                
                // Only proceed with successful transactions
                console.log(`Transaction ${transaction.hash} was successful.`);
            } catch (error) {
                console.error(`Failed to get receipt for transaction ${transaction.hash}:`, error);
                continue;
            }

            // Initialize campaign transactions array if needed
            if (!campaignTransactions[relevantAddress]) {
                campaignTransactions[relevantAddress] = [];
            }

            console.log("Processing successful transaction:", transaction.hash);

            // Create interface for decoding
            const iface = new ethers.Interface(USDCFundraiserABI.abi);
            
            // Decode the input data
            let decodedData;
            try {
                decodedData = iface.parseTransaction({ 
                    data: transaction.input,
                    value: transaction.value 
                });

                console.log("decodedData:", decodedData);
                
                const transactionData = {
                    transactionHash: transaction.hash,
                    blockNumber: BigInt(transaction.blockNumber),
                    timestamp: new Date(),
                    from: transaction.from,
                    to: transaction.to,
                    input: transaction.input,
                    status: "success",
                    gasUsed: receipt.gasUsed.toString(),
                    decodedFunction: {
                        name: decodedData?.name,
                        args: decodedData?.args.toArray().map(arg => 
                            typeof arg === 'bigint' ? arg.toString() : arg
                        ),
                        signature: decodedData?.signature,
                        formatted: `${decodedData?.name}(${decodedData?.args.toArray().map(arg => 
                            typeof arg === 'bigint' ? arg.toString() : arg
                        ).join(', ')})`
                    }
                };
                campaignTransactions[relevantAddress].push(transactionData);
            } catch (error) {
                console.log("Failed to decode input for transaction:", transaction.hash);
                const transactionData = {
                    transactionHash: transaction.hash,
                    blockNumber: BigInt(receipt.blockNumber),
                    timestamp: new Date(),
                    from: transaction.from,
                    to: transaction.to,
                    input: transaction.input,
                    status: "success",
                    gasUsed: receipt.gasUsed.toString(),
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
                
                // All transactions at this point are successful, so sync product stock levels
                console.log(`Syncing external data for campaign: ${campaignAddress}`);
                const productUpdates = await syncExternalData(campaignAddress);
                console.log(`Product updates: ${JSON.stringify(productUpdates)}`);
            } catch (error) {
                console.error(`Failed to update transactions for campaign ${campaignAddress}:`, error);
            }
        }
    }

    return Response.json({ message: "Webhook processed successfully" });
}
