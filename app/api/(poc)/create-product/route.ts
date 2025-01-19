import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { uploadImageToR2 } from "@/app/utils/imageUpload"; // Reused from your campaign
import { createToken } from "@/app/utils/poc_utils/createToken"; // You might want to adjust if you need tokenization for products
import { createWallet } from "@/app/utils/poc_utils/createWallet"; // Same as above, adjust for product creation if needed

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    /*     const session = await getServerSession(authOptions);

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

    const productImageFile = formData.get("image") as File;
    if (!productImageFile) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Upload image and handle the response (in this case, sending image to R2)
    const imageFileName = await uploadImageToR2(productImageFile);

    // Extract form entries into an object (Product data)
    const productEntries = Object.fromEntries(formData.entries());
    console.log("productEntries----", productEntries);

    let product = {
      /*       user_id: creatorWalletAddress,
       */
      name: productEntries.name,
      details: productEntries.details,
      image: imageFileName,
      price: productEntries.price,
      supply: productEntries.supply,
      status: "available", // Example status for product availability
      timestamp: Date.now(),
    };

    console.log(product);

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
