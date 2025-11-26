import client from "@/app/utils/mongodb";
import { ProductFetch } from "@/app/types";
import { ProductCategory, ProductOrService } from "@/app/types";

export const getUserProducts = async (
  userId: string
): Promise<ProductFetch[]> => {
  const mdbClient = client;
  const db = mdbClient.db(process.env.HEXBOX_DB);
  try {
    const products = await db
      .collection("products")
      .find({
        userId: userId,
      })
      .toArray();

    if (!products.length) {
      console.error(
        "No products found with the given campaign ID and user ID:",
        userId
      );
      return [];
    }

    const formattedProducts: ProductFetch[] = products.map((product) => {
      // Safe parsing for price
      let parsedPrice;
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
      } catch (error) {
        console.error("Error parsing price:", error);
        parsedPrice = {
          amount: 0,
          tax_inclusive: false,
          gst_rate: 0,
          gst_amount: 0,
        };
      }

      // Safe parsing for inventory
      let parsedInventory;
      try {
        parsedInventory =
          typeof product.inventory === "string"
            ? JSON.parse(product.inventory)
            : product.inventory || { stock_level: 0 };
      } catch (error) {
        console.error("Error parsing inventory:", error);
        parsedInventory = { stock_level: 0 };
      }

      return {
        id: product._id.toString(),
        productId: product.productId || 0,
        manufacturerId: product.userId || "",
        name: product.name || "",
        type: (product.type as ProductOrService) || ProductOrService.ProductOnly,
        countryOfOrigin: product.countryOfOrigin || "",
        category: {
          name: product.category
            ? typeof product.category === "string"
              ? JSON.parse(product.category).name
              : product.category.name
            : ("TECH" as ProductCategory),
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
          (product.type as ProductOrService) === ProductOrService.ServiceOnly
            ? Boolean(product.isUnlimitedStock)
            : false,
        freeShipping:
          (product.type as ProductOrService) === ProductOrService.ServiceOnly
            ? false
            : product.freeShipping === "true" ||
              product.freeShipping === true ||
              false,
        productReturnPolicy:
          (product.type as ProductOrService) === ProductOrService.ServiceOnly
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

    return formattedProducts;
  } catch (error) {
    console.error("Error in getUserProducts:", error);
    return [];
  }
};
