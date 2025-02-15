import client from "@/app/utils/mongodb";
import { Product } from "@/app/types";
import { ObjectId } from "mongodb";
export const getProduct = async (
  productId: string
): Promise<Product | null> => {
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

    const formattedProduct: Product = {
      id: product._id.toString(),
      productId: product.productId || "", 
      userId: product.userId || "",
      status: product.status || "",
      campaignId: product.campaignId || "",
      image: product.image || "",
      name: product.name || "",
      description: product.description || "",
      price: Number(product.price) || 0,
      supply: Number(product.supply) || 0,
    };

    return formattedProduct;
  } catch (error) {
    console.error("Error in getProduct:", error);
    return null;
  }
};
