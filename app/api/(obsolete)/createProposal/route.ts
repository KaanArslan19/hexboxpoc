import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";

export const POST = async (req: NextRequest, res: NextResponse) => {
  // try {
  //   /*   const session = await getServerSession(authOptions)

  //       if (!session) {
  //           return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  //       } */
  //   const user = "session.user?.name";

  //   const formData = await req.formData();
  //   if (!formData) {
  //     return NextResponse.json(
  //       { error: "Form data is required" },
  //       { status: 400 }
  //     );
  //   }

  //   const walletAddress = formData.get("wallet_address");
  //   const motionType = formData.get("motion_type");
  //   const motionDetails = formData.get("motion_details");

  //   /*  const createProposalResponse = await createProposal(
  //     user as string,
  //     walletAddress as string,
  //     motionType as string,
  //     motionDetails as string
  //   );
  //   console.log(createProposalResponse);

  //   if (
  //     typeof createProposalResponse === "object" &&
  //     "error" in createProposalResponse
  //   ) {
  //     return NextResponse.json(createProposalResponse, { status: 400 });
  //   } else {
  //     return NextResponse.json(createProposalResponse, { status: 200 });
  //   } */
  // } catch (error) {
  //   console.log(error);
  //   return NextResponse.json(
  //     { error: "Internal server error" },
  //     { status: 500 }
  //   );
  // }
  return NextResponse.json("", { status: 200 });
};
