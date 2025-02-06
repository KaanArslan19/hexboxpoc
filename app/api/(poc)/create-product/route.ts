import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { uploadProductImageToR2 } from "@/app/utils/imageUpload"; // Reused from your campaign
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

    const productImageFile = formData.get("image") as File;
    if (!productImageFile) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const imageFileName = await uploadProductImageToR2(productImageFile);

    const productEntries = Object.fromEntries(formData.entries());
    console.log("productEntries----", productEntries);

    let product = {
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
