"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import CustomButton from "./CustomButton";

export default function CampaignProposalItem(props: any) {
  const { proposal, holders, isInvestor, isAuditor, supply } = props;
  const { data: session } = useSession();
  const [buttonDisabled, setButtonDisabled] = useState(false);

  async function handleVote(agree: boolean) {
    setButtonDisabled(true);
    try {
      const formData = new FormData();
      formData.append("proposal_id", proposal._id);
      formData.append("agree", agree.toString());
      await axios.post("/api/voteProposal", formData);
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setButtonDisabled(false);
    }
  }

  async function handleAudit(approve: boolean) {
    setButtonDisabled(true);
    try {
      const formData = new FormData();
      formData.append("proposal_id", proposal._id);
      formData.append("approve", approve.toString());
      await axios.post("/api/auditProposal", formData);
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setButtonDisabled(false);
    }
  }

  const getStatusStyles = () => {
    if (proposal.passed_audit) return "bg-green-50  text-green-800";
    if (proposal.waiting_audit) return "bg-yellowColor/30 text-yellowColor/80";
    if (proposal.finished && !proposal.passed_audit)
      return "bg-redColor/30  text-redColor/80";
    return "bg-white border-gray-200";
  };

  const getStatusText = () => {
    if (proposal.passed_audit) return "Approved";
    if (proposal.waiting_audit) return "Pending Audit";
    if (proposal.finished && !proposal.passed_audit) return "Rejected";
    return "In Progress";
  };

  return (
    <div
      className={`
      border-2 rounded-lg shadow-md p-6 mb-4 
      transition-all duration-300 ease-in-out
      ${getStatusStyles()}
    `}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 capitalize">
            {proposal.motion_type}
          </h2>
          <p className="text-sm text-gray-500 mb-1">
            Proposal ID: {proposal._id}
          </p>
        </div>
        <div
          className={`
          px-3 py-1 rounded-full text-sm font-semibold
          ${
            proposal.passed_audit
              ? "bg-green-100 text-green-800"
              : proposal.waiting_audit
              ? "bg-yellow-100 text-yellowColor/80"
              : proposal.finished
              ? "bg-red-100 text-redColor/80"
              : "bg-blue-100 text-blueColor/80"
          }
        `}
        >
          {getStatusText()}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Proposal Details
        </h3>
        <p className="text-gray-600">{proposal.motion_details}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Yes Votes</h4>
          <p className="text-lg font-bold text-green-600">
            {proposal.total_yes_votes} / {proposal.needed_yes_votes}
          </p>
        </div>
        <div className="bg-white border rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-500 mb-1">No Votes</h4>
          <p className="text-lg font-bold text-redColor/60">
            {proposal.total_no_votes}
          </p>
        </div>
      </div>

      {proposal.finished && (
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            Final Result
          </h4>
          <p className="font-semibold">
            {proposal.finished_result ? "Passed" : "Rejected"}
            <span className="text-sm text-gray-500 ml-2">
              on {new Date(proposal.finished_timestamp).toLocaleString()}
            </span>
          </p>
        </div>
      )}

      <div className="flex flex-row gap-4 justify-center">
        {isInvestor && !proposal.waiting_audit && !proposal.finished && (
          <>
            <CustomButton
              className="px-6 py-2 bg-blueColor/80 text-white rounded-md hover:bg-blueColor/60 transition-colors border-none"
              onClick={() => handleVote(true)}
              disabled={buttonDisabled}
            >
              Vote Yes
            </CustomButton>
            <CustomButton
              className="px-6 py-2 bg-redColor/80 text-white rounded-md hover:bg-redColor/60 transition-colors border-none"
              onClick={() => handleVote(false)}
              disabled={buttonDisabled}
            >
              Vote No
            </CustomButton>
          </>
        )}

        {isAuditor &&
          proposal.waiting_audit &&
          !proposal.passed_audit &&
          !proposal.finished && (
            <>
              <CustomButton
                className="px-6 py-2 bg-blueColor/80 text-white rounded-md hover:bg-blueColor/60 transition-colors border-none"
                onClick={() => handleAudit(true)}
                disabled={buttonDisabled}
              >
                Approve Audit
              </CustomButton>
              <CustomButton
                className="px-6 py-2 bg-orangeColor/80 text-white rounded-md hover:bg-orangeColor/60 transition-colors border-none"
                onClick={() => handleAudit(false)}
                disabled={buttonDisabled}
              >
                Reject Audit
              </CustomButton>
            </>
          )}
      </div>
    </div>
  );
}
