import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getUserTokens } from "./getUserTokens";
import { getWalletTokenAddress } from "./getWalletTokenAddress";
import { isUserAuditor } from "./isUserAuditor";

export const auditProposal = async (user: string, proposalID: string, vote: boolean) => {
    try {
  
      const proposal = await client.db("hexbox_poc").collection("proposals").findOne({ _id: new ObjectId(proposalID) });
      if (!proposal) {
        return { error: "Proposal not found" };
      }

      const isAuditor = isUserAuditor(user);
      if (!isAuditor) {
        return { error: "User is not an auditor" };
      }

      if (proposal.finished === true) {
        return { error: "Proposal has finished" };
      }

      if (proposal.passed_audit) {
        return { error: "Proposal has already been audited" };
      }

      if (proposal.waiting_audit) {
        proposal.audit_timestamp = Date.now();
        proposal.passed_audit = vote;
        proposal.waiting_audit = false;
        proposal.finished = true;
        proposal.finished_result = vote;
        proposal.finished_timestamp = Date.now();
      }

      const updatedProposal = await client.db("hexbox_poc").collection("proposals").updateOne({ _id: new ObjectId(proposalID) }, { $set: proposal });

      return updatedProposal;
  
    } catch (error) {
      console.log(error);
    }
  };