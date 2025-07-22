// import { isUserAuditor } from "@/app/utils/poc_utils/isUserAuditor";
// import { NextRequest, NextResponse } from "next/server";

// export const GET = async (req: NextRequest) => {
//   try {

//     console.log(req.nextUrl.searchParams);
//     if (!req.nextUrl.searchParams.has("walletAddress")) {
//         return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
//     }

//     const walletAddress = req.nextUrl.searchParams.get("walletAddress")

//     if (!walletAddress) {
//       return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
//     }

//     const isAuditor = isUserAuditor(walletAddress);

//     return NextResponse.json(isAuditor);
//   } catch (e) {
//     console.error(e);
//     return NextResponse.json({ error: e }, { status: 500 });
//   }
// };
