import client from "@/app/utils/mongodb";
import { ProductFetch, ProductOrService } from "@/app/types";
import { isValidEthAddress } from "./isValidEthAddress";

interface UserProductTransaction {
  product: ProductFetch;
  transaction: {
    transactionHash: string;
    blockNumber: string;
    timestamp: string;
    from: string;
    to: string;
    functionName: string;
    args: string[];
    status: string;
  };
}

export const getUserOwnedProducts = async (
  userAddress: string
): Promise<UserProductTransaction[]> => {
  const isValidAddress = isValidEthAddress(userAddress);
  if (!isValidAddress) {
    throw new Error("Invalid Ethereum address format");
  }

  const mdbClient = client;
  const db = mdbClient.db("hexbox_poc");
  const userAddressLower = userAddress.toLowerCase();

  // Step 1: Find campaigns with transactions from the user
  const escapedAddress = userAddressLower.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
  const campaignsWithUserTx = await db
    .collection("campaigns")
    .find({
      "transactions.from": { $regex: new RegExp(`^${escapedAddress}$`, "i") },
    })
    .toArray();

  // Step 2: Extract product IDs from user's transactions
  const productIds = new Set<string>();
  const userTransactions: Array<{
    productId: string;
    transaction: any;
  }> = [];

  for (const campaign of campaignsWithUserTx) {
    if (!Array.isArray(campaign.transactions)) continue;

    for (const tx of campaign.transactions) {
      if (
        typeof tx.from === "string" &&
        tx.from.toLowerCase() === userAddressLower
      ) {
        const decoded = tx.decodedFunction;
        if (decoded && Array.isArray(decoded.args) && decoded.args.length > 0) {
          const productId = String(decoded.args[0]);
          productIds.add(productId);
          userTransactions.push({
            productId,
            transaction: {
              transactionHash: tx.transactionHash,
              blockNumber: tx.blockNumber,
              timestamp: tx.timestamp?.$date || tx.timestamp || "",
              from: tx.from,
              to: tx.to,
              functionName: decoded.name || "",
              args: decoded.args.map(String),
              status: tx.status || "",
            },
          });
        }
      }
    }
  }

  // Step 3: Fetch only the products that the user owns
  const productIdsArray = Array.from(productIds)
    .map((id) => parseInt(id))
    .filter((id) => !isNaN(id));
  const products = await db
    .collection("products")
    .find({
      productId: { $in: productIdsArray },
    })
    .toArray();

  // Step 4: Build product map with formatting
  const productMap: { [id: string]: ProductFetch } = {};
  products.forEach((product) => {
    //same formatting as getProducts/getUserProducts
    let parsedPrice, parsedInventory;
    try {
      parsedPrice =
        typeof product.price === "string"
          ? JSON.parse(product.price)
          : product.price || {
              amount: 0,
              tax_inclusive: false,
              gst_rate: 0,
              gst_amount: 0,
            };
    } catch {
      parsedPrice = {
        amount: 0,
        tax_inclusive: false,
        gst_rate: 0,
        gst_amount: 0,
      };
    }
    try {
      parsedInventory =
        typeof product.inventory === "string"
          ? JSON.parse(product.inventory)
          : product.inventory || { stock_level: 0 };
    } catch {
      parsedInventory = { stock_level: 0 };
    }
    const productType =
      (product.type as ProductOrService) || ProductOrService.ProductOnly;
    productMap[String(product.productId)] = {
      id: product._id.toString(),
      productId: product.productId || 0,
      manufacturerId: product.userId || "",
      name: product.name || "",
      type: productType,
      countryOfOrigin: product.countryOfOrigin || "",
      category: {
        name: product.category
          ? typeof product.category === "string"
            ? JSON.parse(product.category).name
            : product.category.name
          : "TECH",
      },
      description: product.description || "",
      price: {
        amount: Number(parsedPrice.amount) || 0,
        tax_inclusive: parsedPrice.tax_inclusive || false,
        gst_rate: Number(parsedPrice.gst_rate) || 0,
        gst_amount: Number(parsedPrice.gst_amount) || 0,
      },
      inventory: {
        stock_level: Number(parsedInventory?.stock_level) || 0,
      },
      isUnlimitedStock:
        productType === ProductOrService.ServiceOnly
          ? Boolean(product.isUnlimitedStock)
          : false,
      freeShipping:
        productType === ProductOrService.ServiceOnly
          ? false
          : product.freeShipping === "true" ||
            product.freeShipping === true ||
            false,
      productReturnPolicy:
        productType === ProductOrService.ServiceOnly
          ? null
          : product.productReturnPolicy
          ? typeof product.productReturnPolicy === "string"
            ? JSON.parse(product.productReturnPolicy)
            : product.productReturnPolicy
          : {
              eligible: false,
              return_period_days: 0,
              conditions: "",
            },
      campaignId: product.campaignId || "",
      userId: product.userId || "",
      logo: product.logo || "",
      images: {
        uploadedFiles: product.images?.uploadedFiles || [],
        errors: product.images?.errors || null,
      },
      status: product.status || "",
      supply: Number(product.supply) || 0,
      sold_count: Number(product.sold_count) || 0,
      fulfillmentDetails: product.fulfillmentDetails || "",
      deliveryDate: product.deliveryDate || "",
      originalProductId: product.originalProductId || 0,
    };
  });

  // Step 5: Combine transactions with product data
  const owned: UserProductTransaction[] = [];
  for (const userTx of userTransactions) {
    const product = productMap[userTx.productId];
    if (product) {
      owned.push({
        product,
        transaction: userTx.transaction,
      });
    }
  }
  return owned;
};
