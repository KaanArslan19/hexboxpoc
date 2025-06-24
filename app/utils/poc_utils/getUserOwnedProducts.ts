import client from "@/app/utils/mongodb";
import { ProductFetch } from "@/app/types";

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
  const mdbClient = client;
  const db = mdbClient.db("hexbox_poc");

  // Fetch all products and build a map by productId for quick lookup
  const products = await db.collection("products").find({}).toArray();
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
    productMap[String(product.productId)] = {
      id: product._id.toString(),
      productId: product.productId || 0,
      manufacturerId: product.userId || "",
      name: product.name || "",
      type: product.type || "ProductOnly",
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
        stock_level: Number(parsedInventory.stock_level) || 0,
      },
      freeShipping: product.freeShipping === "true" || false,
      productReturnPolicy: {
        eligible: product.returnPolicy === "true" || false,
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
    };
  });

  // Fetch all campaigns
  const campaigns = await db.collection("campaigns").find({}).toArray();
  const userAddressLower = userAddress.toLowerCase();
  const owned: UserProductTransaction[] = [];

  for (const campaign of campaigns) {
    if (!Array.isArray(campaign.transactions)) continue;
    for (const tx of campaign.transactions) {
      if (
        typeof tx.from === "string" &&
        tx.from.toLowerCase() === userAddressLower
      ) {
        // check decodedFunction exists and has args
        const decoded = tx.decodedFunction;
        if (decoded && Array.isArray(decoded.args) && decoded.args.length > 0) {
          const productId = String(decoded.args[0]);
          const product = productMap[productId];
          if (product) {
            owned.push({
              product,
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
  }
  return owned;
};
