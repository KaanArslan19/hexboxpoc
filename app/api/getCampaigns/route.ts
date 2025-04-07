import { createProposal } from "@/app/utils/poc_utils/createProposal";
import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { buyToken } from "@/app/utils/poc_utils/buyToken";
import { voteProposal } from "@/app/utils/poc_utils/voteProposal";
import { auditProposal } from "@/app/utils/poc_utils/auditProposal";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { COOKIE_KEYS } from "@/app/lib/auth/constants";

export const GET = async (req: NextRequest) => {
  try {
    const mdbClient = client;
    const db = mdbClient.db("hexbox_poc");

    // const tokenId = await createToken("Test Token", 10000, 1000000, "4ypD7kxRj9DLF3PMxsY3qvp8YdNhAHZRnN3fyVDh5CFX")
    // console.log(tokenId);
    // const walletId = await createWallet(tokenId)
    // console.log(walletId);

    // const prop = await createProposal("4ypD7kxRj9DLF3PMxsY3qvp8YdNhAHZRnN3fyVDh5CFX", "67356c4d48dfe32ab5c7e154", "withdraw", JSON.stringify({address: '', amount: ''}))
    // console.log(prop);
    // const buySomeTokens = await buyToken("8pwsPPVQuAPHVsz2xHXqUgKMHqy376senkBcHrFbnmHr", "67356c4d48dfe32ab5c7e153", 4300)
    // console.log(buySomeTokens);
    // const voteProp = await voteProposal("8pwsPPVQuAPHVsz2xHXqUgKMHqy376senkBcHrFbnmHr", "6735f42c48dfe32ab5c7e155", true)
    // console.log(voteProp);
    // const auditProp = await auditProposal("0x0000000000000000000000000000000000000000", "6735f42c48dfe32ab5c7e155", true)
    // console.log(auditProp);

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
    const skip = parseInt(req.nextUrl.searchParams.get("skip") || "0");
    const sortBy = req.nextUrl.searchParams.get("sortBy") || "totalRaised";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc";
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    const campaigns = await db
      .collection("campaigns")
      .find({})
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json(campaigns);
  } catch (e) {
    console.error("Error in getCampaigns:", e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
};
