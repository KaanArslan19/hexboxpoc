import { NextRequest, NextResponse } from "next/server";

// import { buyToken } from "@/app/utils/poc_utils/buyToken";

export const POST = async (req: NextRequest, res: NextResponse) => {
  // try {
  //   /*     const session = await getServerSession(authOptions)

  //       if (!session) {
  //           return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  //       } */

  //   const formData = await req.formData();
  //   if (!formData) {
  //     return NextResponse.json(
  //       { error: "Form data is required" },
  //       { status: 400 }
  //     );
  //   }

  //   const campaign_id = formData.get("campaign_id");
  //   const amount = formData.get("amount");

  //   const returnedTranasction = await buyToken(
  //     campaign_id as string,
  //     Number(amount)
  //   );
  //   console.log(returnedTranasction);

  //   return NextResponse.json(returnedTranasction, { status: 200 });
  // } catch (error) {
  //   console.log(error);
  //   return NextResponse.json(
  //     { error: "Internal server error" },
  //     { status: 500 }
  //   );
  // }
  return NextResponse.json("", { status: 200 });
};
