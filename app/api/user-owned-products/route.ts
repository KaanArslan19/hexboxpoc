import { NextRequest, NextResponse } from "next/server";
import { getUserOwnedProducts } from "@/app/utils/poc_utils/getUserOwnedProducts";

export async function GET(req: NextRequest) {
  const userAddress = req.nextUrl.searchParams.get("userAddress");
  if (!userAddress) {
    return NextResponse.json({ error: "Missing userAddress" }, { status: 400 });
  }
  try {
    const data = await getUserOwnedProducts(userAddress);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
