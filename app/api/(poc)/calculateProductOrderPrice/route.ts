import { NextRequest, NextResponse } from "next/server";
import client from "@/app/utils/mongodb";   
import { getServerSideUser } from "@/app/utils/getServerSideUser";

export async function GET(req: NextRequest) {

    const session = await getServerSideUser(req);
    console.log("Server side session:", session);

    if (!session.isAuthenticated) {
        console.log("User not authenticated");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creatorWalletAddress = session.address;

    const productId = req.nextUrl.searchParams.get("productId");
    const quantity = req.nextUrl.searchParams.get("quantity");
    if (!productId || !quantity) {
        return NextResponse.json({ error: "Product ID and quantity are required" }, { status: 400 });
    }

    console.log(productId, quantity);
    const product = await client.db("hexbox_poc").collection("products").findOne({ productId: Number(productId) });
    console.log(product);

    if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const price = product.price.amount;
    const totalPrice = Number(price) * Number(quantity);

    return NextResponse.json({ productId, totalPrice });
}