import client from "@/app/utils/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { uploadImageToR2 } from "@/app/utils/imageUpload";
import { ObjectId } from "mongodb";
import { getCampaign } from "@/app/utils/getCampaign";
import { buyToken } from "@/app/utils/poc_utils/buyToken";
import { auditProposal } from "@/app/utils/poc_utils/auditProposal";

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    /*     const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
 */
    const formData = await req.formData();
    if (!formData) {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400 }
      );
    }

    const proposal_id = formData.get("proposal_id");
    const approve = formData.get("approve");
    let approveBoolean = false;
    if (!approve) {
      return NextResponse.json({ error: "Agree is required" }, { status: 400 });
    } else {
      if (approve === "true") {
        approveBoolean = true;
      } else {
        approveBoolean = false;
      }
    }

    const auditProposalResponse = await auditProposal(
      "user",
      /*       session?.user?.name as string,
       */ proposal_id as string,
      approveBoolean
    );
    console.log(auditProposalResponse);

    if (
      typeof auditProposalResponse === "object" &&
      auditProposalResponse !== null &&
      "error" in auditProposalResponse
    ) {
      return NextResponse.json(
        { error: auditProposalResponse.error },
        { status: 400 }
      );
    }

    return NextResponse.json(auditProposalResponse, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
