import { NextRequest, NextResponse } from "next/server";
import client from "@/app/utils/mongodb";   
import { getServerSideUser } from "@/app/utils/getServerSideUser";

export async function GET(req: NextRequest) {

    const session = await getServerSideUser(req);
    // console.log("Server side session:", session);

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

    if (isNaN(Number(productId)) || isNaN(Number(quantity))) {
        return NextResponse.json({ error: "Product ID and quantity must be numbers" }, { status: 400 });
    }

    // check if quantity is above 0
    if (Number(quantity) <= 0) {
        return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
    }

   // console.log(productId, quantity);
    const product = await client.db("hexbox_poc").collection("products").findOne({ productId: Number(productId) });
    // console.log(product);

    if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const priceObj = typeof product.price === "string" ? JSON.parse(product.price) : product.price;
    const price = priceObj.amount;
    
    // Use proper decimal arithmetic to avoid floating-point precision errors
    // Convert to integers by multiplying by 1000000 (6 decimal places for USDC), do the math, then divide back
    const priceInMicroUnits = Math.round(Number(price) * 1000000);
    const totalPriceInMicroUnits = priceInMicroUnits * Number(quantity);
    const totalPrice = totalPriceInMicroUnits / 1000000;

    return NextResponse.json({ productId, totalPrice });
}