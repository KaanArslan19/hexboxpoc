import { uploadProductImageToR2 } from "../imageUpload";
import { uploadProductMetadataToR2 } from "@/app/utils/metadataUpload";
import client from "@/app/utils/mongodb";

export async function createProduct(formData: FormData) {
  const productImageFile = formData.get("image") as File;
  if (!productImageFile) {
    throw new Error("Image is required");
  }

  const uuid = Math.floor(Math.random() * 1e16); // random 16 digit number for the product

  const imageFileName = await uploadProductImageToR2(
    productImageFile,
    uuid.toString()
  );

  const productEntries = Object.fromEntries(formData.entries());
  console.log("productEntries----", productEntries);

  let product = {
    productId: uuid,
    userId: productEntries.userId,
    campaignId: productEntries.campaignId,
    name: productEntries.name,
    description: productEntries.description,
    image: imageFileName,
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

  return [product.productId, product.price, product.supply];
}
