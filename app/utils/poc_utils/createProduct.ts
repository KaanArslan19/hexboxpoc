import { uploadProductImageToR2, uploadProductImagesToR2 } from "../imageUpload";
import { uploadProductMetadataToR2 } from "@/app/utils/metadataUpload";
import client from "@/app/utils/mongodb";

export async function createProduct(formData: FormData) {
  // const productImageFile = formData.get("image") as File;
  // if (!productImageFile) {
  //   throw new Error("Image is required");
  // }

  let isDonationProduct = formData.get("isDonationProduct") === "true" ? true : false;
  console.log("formDAta BACKEND--", formData);
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
  const logoFileName = await uploadProductImageToR2(
    productLogoFile,
    uuid.toString()
  );

  const imagesFileNames = await uploadProductImagesToR2(
    productImagesFiles,
    uuid.toString()
  ); 
  console.log("imagesFileNames", imagesFileNames);

  const productEntries = Object.fromEntries(formData.entries());
  console.log("productEntries----", productEntries);

  let product = {
    productId: uuid,
    manufacturerId: productEntries.manufacturerId,
    countryOfOrigin: productEntries.countryOfOrigin,
    type: productEntries.type,
    logo: logoFileName,
    userId: productEntries.userId,
    campaignId: productEntries.campaignId,
    name: productEntries.name,
    description: productEntries.description,
    inventory: productEntries.inventory,
    freeShipping: productEntries.freeShipping,
    images: imagesFileNames,
    category: productEntries.category,
    returnPolicy: productEntries.productReturnPolicy,
    price: productEntries.price,
    supply: productEntries.supply,
    status: "available",
    timestamp: Date.now(),
  };

  console.log("CREATE-PRODUCT ROUTE", product);

  const metadata = await uploadProductMetadataToR2(product);
  console.log("METADATA", metadata);

  const mdbClient = client;
  const db = mdbClient.db("hexbox_poc");
  const result = await db.collection("products").insertOne(product);
  console.log("Product Inserted:", result);
  const productId = result.insertedId.toString();


  return [product.productId, JSON.parse(productEntries.price as string).amount, product.supply];
}
