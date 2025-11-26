// import client from "@/app/utils/mongodb";
// import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  // try {

  //   console.log(req.nextUrl.searchParams);
  //   if (!req.nextUrl.searchParams.has("walletAddress")) {
  //       return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
  //   }

  //   const walletAddress = req.nextUrl.searchParams.get("walletAddress")

  //   const mdbClient = client;
  //   const db = mdbClient.db(process.env.HEXBOX_DB);

  //   const token = await db
  //     .collection("proposals")
  //     .find({wallet_address: walletAddress})
  //     .toArray();

  //   console.log(token)

  //   return NextResponse.json(token);
  // } catch (e) {
  //   console.error(e);
  //   return NextResponse.json({ error: e }, { status: 500 });
  // }
  return NextResponse.json("", { status: 200 });
};
