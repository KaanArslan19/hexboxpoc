import { ethers, EventLog } from "ethers";
import { CONTRACTS } from "@/app/utils/contracts/contracts";
import ProductTokenABI from "@/app/utils/contracts/artifacts/contracts/ProductToken.sol/ProductToken.json";
import USDCFundraiserABI from "@/app/utils/contracts/artifacts/contracts/USDCFundraiser.sol/USDCFundraiser.json";
import { ProductFetch } from "@/app/types";

export interface ProductTransaction {
  productId: number;
  productName: string;
  quantity: number;
  amount: number;
  timestamp: number;
  txHash: string;
} 

// Helper to query logs in chunks
async function queryFilterInChunks(
  contract: any,
  filter: any,
  fromBlock: number,
  toBlock: number,
  chunkSize = 2000
) {
  let events: any[] = [];
  let start = fromBlock;
  while (start <= toBlock) {
    const end = Math.min(start + chunkSize - 1, toBlock);
    const chunkEvents = await contract.queryFilter(filter, start, end);
    events = events.concat(chunkEvents);
    start = end + 1;
  }
  return events;
}

export async function getUserProductTransactions(
  products: ProductFetch[],
  userAddress: string,
  providerUrl: string
): Promise<{ [productId: number]: ProductTransaction[] }> {
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const productTokenContract = new ethers.Contract(
    CONTRACTS.ProductToken.fuji,
    ProductTokenABI.abi,
    provider
  );

  const result: { [productId: number]: ProductTransaction[] } = {};
  const latestBlock = await provider.getBlockNumber();

  for (const product of products) {
    // Get user's token balance for this product
    const tokenId = ethers.parseUnits(product.productId.toString(), 0);
    const balance = await productTokenContract.balanceOf(userAddress, tokenId);
    if (balance <= 0) continue; // User has no tokens for this product

    // Only filter by indexed params (to=userAddress)
    const filter = productTokenContract.filters.TransferSingle(
      null,
      null,
      userAddress
    );
    // Query logs in chunks to avoid provider limits
    const events = await queryFilterInChunks(
      productTokenContract,
      filter,
      0,
      latestBlock,
      2000
    );
    // Now filter by tokenId in JS
    const filteredEvents = events.filter(
      (event) =>
        "args" in event &&
        event.args &&
        event.args.id &&
        event.args.id.eq(tokenId)
    );

    // For each event, get the transaction details
    const txs: ProductTransaction[] = [];
    for (const event of filteredEvents) {
      // Only consider mint (from == 0x0) as purchase
      if (
        "args" in event &&
        event.args &&
        event.args.from === ethers.ZeroAddress
      ) {
        const tx = await event.getTransaction();
        const receipt = await event.getTransactionReceipt();
        const block = await provider.getBlock(event.blockNumber);
        txs.push({
          productId: product.productId,
          productName: product.name,
          quantity: Number(event.args.value),
          amount: Number(product.price.amount) * Number(event.args.value),
          timestamp: block && block.timestamp ? block.timestamp * 1000 : 0,
          txHash: event.transactionHash,
        });
      }
    }
    if (txs.length > 0) {
      result[product.productId] = txs;
    }
  }
  return result;
}
