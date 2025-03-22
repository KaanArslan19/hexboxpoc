import client from "@/app/utils/mongodb";
import { ProductFetch } from "@/app/types";
import { ObjectId } from "mongodb";
import { ProductCategory, ProductOrService } from "@/app/types";
export const getProduct = async (
  productId: string
): Promise<ProductFetch | null> => {
  const mdbClient = client;
  const db = mdbClient.db("hexbox_poc");

  try {
    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });

    if (!product) {
      console.error("No product found with the given product ID:", productId);
      return null;
    }

    const formattedProduct: ProductFetch = {
      id: product._id.toString(),
      productId: product.productId || 0,
      manufacturerId: product.userId || "",
      name: product.name || "",
      type: "ProductOnly" as ProductOrService,
      countryOfOrigin: "",
      category: {
        name: "TECH" as ProductCategory,
      },
      description: product.description || "",
      price: {
        amount: Number(product.price) || 0,
        tax_inclusive: false, // Default value
        gst_rate: 0, // Default value
        gst_amount: 0, // Default value
      },
      inventory: {
        stock_level: Number(product.supply) || 0,
      },
      freeShipping: false, // Default value
      productReturnPolicy: {
        eligible: false, // Default value
        return_period_days: 0, // Default value
        conditions: "", // Default value
      },
      campaignId: product.campaignId || "",
      userId: product.userId || "",
      logo: product.logo || "",
      images: product.images || [],
      status: product.status || "",
      supply: Number(product.supply) || 0,
      sold_count: Number(product.sold_count) || 0,
    };

    return formattedProduct;
  } catch (error) {
    console.error("Error in getProduct:", error);
    return null;
  }
};
