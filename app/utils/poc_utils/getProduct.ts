import client from "@/app/utils/mongodb";
import { ProductFetch } from "@/app/types";
import { ObjectId } from "mongodb";
import { ProductCategory, ProductOrService } from "@/app/types";
export const getProduct = async (
  productId: string
): Promise<ProductFetch | null> => {
  const mdbClient = client;
  const db = mdbClient.db(process.env.HEXBOX_DB);

  try {
    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(productId) });

    if (!product) {
      console.error("No product found with the given product ID:", productId);
      return null;
    }
    console.log("product details", product);

    const formattedProduct: ProductFetch = {
      id: product._id.toString(),
      productId: product.productId || 0,
      manufacturerId: product.userId || "",
      name: product.name || "",
      type: (product.type as ProductOrService) || ProductOrService.ProductOnly,
      countryOfOrigin: product.countryOfOrigin || "",
      category: {
        name: "TECH" as ProductCategory,
      },
      description: product.description || "",
      price: {
        amount:
          typeof product.price === "object"
            ? Number(product.price.amount) || 0
            : Number(product.price) || 0,
        tax_inclusive:
          typeof product.price === "object"
            ? Boolean(product.price.tax_inclusive)
            : false,
        gst_rate:
          typeof product.price === "object"
            ? Number(product.price.gst_rate) || 0
            : 0,
        gst_amount:
          typeof product.price === "object"
            ? Number(product.price.gst_amount) || 0
            : 0,
      },
      inventory: {
        stock_level:
          typeof product.inventory === "object"
            ? Number(product.inventory?.stock_level) || 0
            : Number(product.supply) || 0,
      },
      isUnlimitedStock:
        product.type === ProductOrService.ServiceOnly
          ? Boolean(product.isUnlimitedStock)
          : false,
      freeShipping:
        product.type === ProductOrService.ServiceOnly
          ? false
          : product.freeShipping === "true" ||
            product.freeShipping === true ||
            false,
      productReturnPolicy:
        product.type === ProductOrService.ServiceOnly
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
      images: product.images || { uploadedFiles: [], errors: null },
      status: product.status || "",
      supply: Number(product.supply) || 0,
      sold_count: Number(product.sold_count) || 0,
      fulfillmentDetails: product.fulfillmentDetails || "",
      deliveryDate: product.deliveryDate || "",
      originalProductId: Number(product.originalProductId) || 0,
    };

    return formattedProduct;
  } catch (error) {
    console.error("Error in getProduct:", error);
    return null;
  }
};
