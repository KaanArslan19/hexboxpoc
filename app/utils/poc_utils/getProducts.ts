import client from "@/app/utils/mongodb";
import { Product } from "@/app/types";

export const getProducts = async (campaignId: string): Promise<Product[]> => {
  const mdbClient = client;
  const db = mdbClient.db("hexbox_poc");

  try {
    const products = await db
      .collection("products")
      .find({ campaignId: campaignId })
      .toArray();

    if (!products.length) {
      console.error(
        "No products found with the given campaign ID:",
        campaignId
      );
      return [];
    }
    console.log("getProducts----", products);

    const formattedProducts: Product[] = products.map((product) => ({
      id: product._id.toString(),
      userId: product.userId || "",
      status: product.status || "",
      campaignId: product.campaignId || "",
      image: product.image || "",
      name: product.name || "",
      description: product.description || "",
      price: Number(product.price) || 0,
      supply: Number(product.supply) || 0,
      productId: product.productId || 0
    }));

    return formattedProducts;
  } catch (error) {
    console.error("Error in getProducts:", error);
    return [];
  }
};
