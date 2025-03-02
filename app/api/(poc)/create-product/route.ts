import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import {
  uploadProductImageToR2,
  uploadProductImagesToR2,
} from "@/app/utils/imageUpload";
import { uploadProductMetadataToR2 } from "@/app/utils/metadataUpload";
import { createProduct } from "@/app/utils/poc_utils/createProduct";

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    /* const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const creatorWalletAddress = session.user?.name; */

    const formData = await req.formData();
    if (!formData) {
      return NextResponse.json(
        { error: "Product data is required" },
        { status: 400 }
      );
    }
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
    const logoFileName = await uploadProductImageToR2(
      productLogoFile,
      uuid.toString()
    );
    const imagesFileNames = await uploadProductImagesToR2(
      productImagesFiles,
      uuid.toString()
    );
    console.log("imagesFileNames", imagesFileNames);
    if (!productLogoFile) {
      return NextResponse.json({ error: "Logo is required" }, { status: 400 });
    }

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

    return NextResponse.json({ productId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
