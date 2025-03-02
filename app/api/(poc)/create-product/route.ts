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
    const [productId, price, supply] = await createProduct(formData);
    
    return NextResponse.json({ productId, price, supply });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
