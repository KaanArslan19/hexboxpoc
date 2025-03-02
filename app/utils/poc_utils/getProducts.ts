import client from "@/app/utils/mongodb";
import { ProductFetch } from "@/app/types";
import { ProductCategory, ProductOrService } from "@/app/types";
export const getProducts = async (
  campaignId: string
): Promise<ProductFetch[]> => {
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

    const formattedProducts: ProductFetch[] = products.map((product) => ({
      id: product._id.toString(),
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
      images: {
        uploadedFiles: product.images.uploadedFiles || [], // Default empty array for images
        errors: product.images.errors || null,
      },
      status: product.status || "",
      supply: Number(product.supply) || 0,
    }));

    return formattedProducts;
  } catch (error) {
    console.error("Error in getProducts:", error);
    return [];
  }
};
