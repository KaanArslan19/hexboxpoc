// import client from "@/app/utils/mongodb";
// import { ObjectId } from "mongodb";
// import { NextRequest, NextResponse } from "next/server";

// export const GET = async (req: NextRequest) => {
//   try {

//     console.log(req.nextUrl.searchParams);
//     if (!req.nextUrl.searchParams.has("tokenAddress")) {
//         return NextResponse.json({ error: "Token address is required" }, { status: 400 });
//     }

//     const tokenAddress = req.nextUrl.searchParams.get("tokenAddress")

//     const mdbClient = client;
//     const db = mdbClient.db("hexbox_poc");

//     const token = await db
//       .collection("tokens")
//       .find({_id: new ObjectId(tokenAddress as string)})
//       .toArray();

//     console.log(token)

//     return NextResponse.json(token[0]);
//   } catch (e) {
//     console.error(e);
//     return NextResponse.json({ error: e }, { status: 500 });
//   }
// };
