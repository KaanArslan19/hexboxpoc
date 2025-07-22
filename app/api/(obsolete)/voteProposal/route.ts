// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";

// export const POST = async (req: NextRequest, res: NextResponse) => {
//   try {
//     /*         const session = await getServerSession(authOptions)

//         if (!session) {
//             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         } */

//     const formData = await req.formData();
//     if (!formData) {
//       return NextResponse.json(
//         { error: "Form data is required" },
//         { status: 400 }
//       );
//     }

//     const proposal_id = formData.get("proposal_id");
//     const agree = formData.get("agree");
//     let agreeBoolean = false;
//     if (!agree) {
//       return NextResponse.json({ error: "Agree is required" }, { status: 400 });
//     } else {
//       if (agree === "true") {
//         agreeBoolean = true;
//       } else {
//         agreeBoolean = false;
//       }
//     }

//     /*     const voteProposalResponse = await voteProposal(
//       "session?.user?.name" as string,
//       proposal_id as string,
//       agreeBoolean
//     );
//     console.log(voteProposalResponse);

//     if (
//       typeof voteProposalResponse === "object" &&
//       voteProposalResponse !== null &&
//       "error" in voteProposalResponse
//     ) {
//       return NextResponse.json(
//         { error: voteProposalResponse.error },
//         { status: 400 }
//       );
//     } */

//     return NextResponse.json(/* voteProposalResponse */ "", { status: 200 });
//   } catch (error) {
//     console.log(error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// };
