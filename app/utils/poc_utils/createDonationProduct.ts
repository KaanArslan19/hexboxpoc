import { uploadProductImageToR2 } from "../imageUpload";
import { uploadProductMetadataToR2 } from "@/app/utils/metadataUpload";
import client from "@/app/utils/mongodb";

export async function createDonationProduct(formData: FormData) {
  const uuid = Math.floor(Math.random() * 1e16); // random 16 digit number for the product

  const productLogoFile = formData.get("logo") as File;
  if (!productLogoFile) {
    throw new Error("Logo is required");
  }
  const logoFileName = await uploadProductImageToR2(
    productLogoFile,
    uuid.toString()
  );

  const productEntries = Object.fromEntries(formData.entries());

  // Parse price safely
  const parsePrice = (priceInput: any) => {
    if (!priceInput) {
      return { amount: 1, tax_inclusive: false, gst_rate: 0, gst_amount: 0 };
    }

    const price =
      typeof priceInput === "string" ? JSON.parse(priceInput) : priceInput;

    return {
      amount: Number(price.amount) || 1, // Default to 1 if not provided
      tax_inclusive: Boolean(price.tax_inclusive),
      gst_rate: Number(price.gst_rate) || 0,
      gst_amount: Number(price.gst_amount) || 0,
    };
  };

  // Create donation product with simplified structure
  let donationProduct = {
    productId: uuid,
    type: productEntries.type,
    logo: logoFileName,
    userId: productEntries.userId,
    campaignId: productEntries.campaignId,
    name: productEntries.name,
    description: productEntries.description,

    // Simplified inventory for donations
    inventory: { stock_level: 0 },

    // No shipping for donations
    freeShipping: false,

    // Minimal image structure
    images: {
      uploadedFiles: [],
      errors: null,
    },

    // Basic category
    category: productEntries.category
      ? typeof productEntries.category === "string"
        ? JSON.parse(productEntries.category)
        : productEntries.category
      : { name: "Donation" },

    // No return policy for donations
    returnPolicy: {
      eligible: false,
      return_period_days: 0,
      conditions: "Donations are not eligible for returns",
    },

    // Parse price or set default
    price: parsePrice(productEntries.price),

    // Always 0 for donations
    supply: 0,

    // No service terms for donations
    serviceTerms: null,

    // Status
    status: productEntries.status || "available",
    timestamp: Date.now(),
  };

  // Upload metadata
  const metadata = await uploadProductMetadataToR2(donationProduct);

  // Store in database
  const mdbClient = client;
  const db = mdbClient.db(process.env.HEXBOX_DB);
  const result = await db.collection("products").insertOne(donationProduct);

  return [
    donationProduct.productId,
    donationProduct.price.amount,
    0, // Supply is always 0 for donations
  ];
}
