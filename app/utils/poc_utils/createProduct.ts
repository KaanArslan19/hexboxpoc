import {
  uploadProductImageToR2,
  uploadProductImagesToR2,
} from "../imageUpload";
import { uploadProductMetadataToR2 } from "@/app/utils/metadataUpload";
import client from "@/app/utils/mongodb";
import { parse } from "path";

// Define the return types for createProduct function
export type ProductCreationSuccess = {
  productId: number | string;
  price: number;
  supply: number;
};

export type ProductCreationError = {
  error: string;
};

export type ProductCreationResult = ProductCreationSuccess | ProductCreationError;

export async function createProduct(formData: FormData): Promise<ProductCreationResult> {
  try {
  const uuid = Math.floor(Math.random() * 1e16); // random 16 digit number for the product

  const productImagesFiles: File[] = [];
  const entries = Array.from(formData.entries());

  for (const [key, value] of entries) {
    if (key.startsWith("images[") || key === "images") {
      if (value instanceof File) {
        productImagesFiles.push(value);
      }
    }
  }
  console.log("productImagesFiles", productImagesFiles);

  const productLogoFile = formData.get("logo") as File;
  if (!productLogoFile) {
    throw new Error("Logo is required");
  }
  
  // Upload product logo
  const logoUploadResult = await uploadProductImageToR2(
    productLogoFile,
    uuid.toString()
  );
  
  // Check if logo upload returned an error
  if (typeof logoUploadResult === 'object' && 'error' in logoUploadResult) {
    console.error("Logo upload failed:", logoUploadResult.error);
    return {
      error: "Logo upload failed " + logoUploadResult.error,
    }
  }
  
  const logoFileName = logoUploadResult;
  
  // Upload product images
  const imagesUploadResult = await uploadProductImagesToR2(
    productImagesFiles,
    uuid.toString()
  );
  
  // Check if there were any errors during image uploads
  if (imagesUploadResult.errors && imagesUploadResult.errors.length > 0) {
    console.error("Image upload errors:", imagesUploadResult.errors);
    return {
      error: "Image upload failed " + imagesUploadResult.errors.join(", "),
    }
  }
  
  const imagesFileNames = imagesUploadResult.uploadedFiles;
  console.log("imagesFileNames", imagesFileNames);

  const productEntries = Object.fromEntries(formData.entries());

  const parsePrice = (priceInput: any) => {
    // Handle cases where price might come as string or object
    const price =
      typeof priceInput === "string"
        ? JSON.parse(priceInput)
        : priceInput || {};

    return {
      amount: Number(price.amount) || 0,
      tax_inclusive: Boolean(price.tax_inclusive),
      gst_rate: Number(price.gst_rate) || 0,
      gst_amount: Number(price.gst_amount) || 0,
    };
  };
  console.log(parsePrice(productEntries.price), "parsePrice");
  // Parse inventory safely
  const parseInventory = (inventoryInput: any) => {
    if (inventoryInput === "null" || !inventoryInput) {
      return { stock_level: 0 };
    }

    if (typeof inventoryInput === "string") {
      try {
        return JSON.parse(inventoryInput);
      } catch (error) {
        console.error("Error parsing inventory:", error);
        return { stock_level: 0 };
      }
    }
    console.log(parseInventory(productEntries.inventory), "parseInventory");
    // If it's somehow a File or another unexpected type, return default
    if (!(inventoryInput instanceof Object) || inventoryInput instanceof File) {
      return { stock_level: 0 };
    }

    return inventoryInput as { stock_level: number };
  };

  let product = {
    productId: uuid,
    manufacturerId: productEntries.manufacturerId || "",
    countryOfOrigin: productEntries.countryOfOrigin || "",
    type: productEntries.type,
    logo: logoFileName,
    userId: productEntries.userId,
    campaignId: productEntries.campaignId,
    name: productEntries.name,
    description: productEntries.description || "",
    fulfillmentDetails: productEntries.fulfillmentDetails || "",
    deliveryDate: productEntries.deliveryDate || "",

    inventory:
      productEntries.type === "ServiceOnly"
        ? { stock_level: 0 }
        : parseInventory(productEntries.inventory),

    freeShipping:
      productEntries.type === "ServiceOnly"
        ? false
        : productEntries.freeShipping === "true" || false,

    images: imagesFileNames,
    category:
      typeof productEntries.category === "string"
        ? JSON.parse(productEntries.category)
        : productEntries.category,

    returnPolicy:
      productEntries.type === "ServiceOnly"
        ? null
        : productEntries.productReturnPolicy
        ? typeof productEntries.productReturnPolicy === "string"
          ? JSON.parse(productEntries.productReturnPolicy)
          : productEntries.productReturnPolicy
        : {
            eligible: false,
            return_period_days: 0,
            conditions: "",
          },

    price: parsePrice(productEntries.price),

    supply:
      productEntries.type === "ServiceOnly"
        ? 0
        : (() => {
            const parsedInventory = parseInventory(productEntries.inventory);
            return parsedInventory?.stock_level || 0;
          })(),

    serviceTerms:
      productEntries.type === "ServiceOnly" && productEntries.service_terms
        ? typeof productEntries.service_terms === "string"
          ? JSON.parse(productEntries.service_terms)
          : productEntries.service_terms
        : null,

    isDonationProduct: false,

    status: productEntries.status || "available",
    timestamp: Date.now(),
  };

  console.log("CREATE-PRODUCT ROUTE", product);

  const metadata = await uploadProductMetadataToR2(product);
  console.log("METADATA", metadata);

  const mdbClient = client;
  const db = mdbClient.db("hexbox_poc");
  const result = await db.collection("products").insertOne(product);
  const productId = result.insertedId.toString();

  return {
    productId: product.productId,
    price: (() => {
      try {
        if (product.price && typeof product.price.amount === "number") {
          return product.price.amount;
        }

        // Second attempt: Try parsing if it's a string
        if (typeof productEntries.price === "string") {
          const parsedPrice = JSON.parse(productEntries.price);
          return parsedPrice.amount || 1;
        }

        return 1;
      } catch (error) {
        console.error("Error extracting price amount:", error);
        return 1;
      }
    })(),
    supply: product.supply,
  };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      error: "Error creating product",
    }
  }
}
