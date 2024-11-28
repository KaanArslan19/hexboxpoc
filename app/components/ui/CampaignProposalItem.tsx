"use client";

import { TokenDetailsProps } from "@/app/types";
import { useSession } from "next-auth/react";
import CustomButton from "./CustomButton";
import axios from "axios";
import { useState } from "react";

export default function CampaignProposalItem(props: any) {
  const { proposal, holders, isInvestor, isAuditor, supply } = props;
  const { data: session } = useSession();
  const [buttonDisabled, setButtonDisabled] = useState(false);

  async function handleVote(agree: boolean) {
    setButtonDisabled(true);
    try {
      console.log(agree);
      const formData = new FormData();
      formData.append("proposal_id", proposal._id);
      formData.append("agree", agree.toString());
      const voteProposalResponse = await axios.post(
        "/api/voteProposal",
        formData
      );
      console.log(voteProposalResponse);
      window.location.reload();
    } catch (error) {
      console.log(error);
      setButtonDisabled(false);
    } finally {
      setButtonDisabled(false);
    }
  }

  async function handleAudit(approve: boolean) {
    setButtonDisabled(true);
    try {
      console.log(approve);
      const formData = new FormData();
      formData.append("proposal_id", proposal._id);
      formData.append("approve", approve.toString());
      const auditProposalResponse = await axios.post(
        "/api/auditProposal",
        formData
      );
      console.log(auditProposalResponse);
      window.location.reload();
    } catch (error) {
      console.log(error);
      setButtonDisabled(false);
    } finally {
      setButtonDisabled(false);
    }
  }

  return (
    <div
      className={`flex flex-col gap-2 justify-between items-center shadow-sm rounded-md overflow-hidden shadow-lightBlueColor border-2 border-lightBlueColor ${
        proposal.waiting_audit
          ? "bg-yellow-100"
          : proposal.passed_audit
          ? "bg-green-100"
          : proposal.waiting_audit === false && proposal.finished === true
          ? "bg-red-100"
          : "bg-white"
      }`}
    >
      <h3 className="text-lg font-bold">{proposal.motion_type}</h3>
      <p>{proposal.motion_details}</p>
      <p>Proposal ID: {proposal._id}</p>
      <p>Total yes votes: {proposal.total_yes_votes}</p>
      <p>Total no votes: {proposal.total_no_votes}</p>
      <p>Needed yes votes: {proposal.needed_yes_votes}</p>
      <p>Supply: {supply}</p>

      <div className="w-full px-4 py-2">
        <div className="relative h-6 bg-gray-200 rounded-full">
          {/* Yes votes bar and label */}
          <div
            className="absolute h-full bg-green-500 rounded-l-full"
            style={{
              width: `${(proposal.total_yes_votes / supply) * 100}%`,
            }}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-green-600">
              {((proposal.total_yes_votes / supply) * 100).toFixed(1)}%
            </span>
          </div>

          {/* No votes bar and label */}
          <div
            className="absolute h-full bg-red-500"
            style={{
              left: `${(proposal.total_yes_votes / supply) * 100}%`,
              width: `${(proposal.total_no_votes / supply) * 100}%`,
            }}
          >
            <span className="absolute top-8 left-1/2 -translate-x-1/2 text-xs text-red-600">
              {((proposal.total_no_votes / supply) * 100).toFixed(1)}%
            </span>
          </div>
          
          {/* 70% threshold marker */}
          <div 
            className="absolute w-0.5 h-8 bg-blue-600 -top-1"
            style={{
              left: '70%',
            }}
          >
          </div>
        </div>
        <div className="text-xs  mt-4">
          Total Voted: {(((proposal.total_yes_votes + proposal.total_no_votes) / supply) * 100).toFixed(1)}% of Token Supply
        </div>
      </div>

      <p>Waiting audit: {proposal.waiting_audit.toString()}</p>
      <p>Passed audit: {proposal.passed_audit.toString()}</p>
      <p>Finished: {proposal.finished.toString()}</p>
      {proposal.finished === true && (
        <>
          <p>Finished result: {proposal.finished_result.toString()}</p>
          <p>Finished timestamp: {proposal.finished_timestamp}</p>
        </>
      )}
      <p>Voters: {proposal.voters.length}</p>
      {proposal.voters.map((voter: any) => (
        <p key={voter.address}>
          Voter: {voter.address} - {voter.agree.toString()} - {voter.amount}
        </p>
      ))}
      {/* Need timestamps for created at, audited at, passed audit at */}

      <div className="flex flex-row gap-2 p-2">
        {isInvestor &&
          !proposal.waiting_audit &&
          !proposal.finished && (
            <>
              <CustomButton
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                onClick={() => handleVote(true)}
                disabled={buttonDisabled}
              >
                Yes
              </CustomButton>
              <CustomButton
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                onClick={() => handleVote(false)}
                disabled={buttonDisabled}
              >
                No
              </CustomButton>
            </>
          )}

        {isAuditor &&
          proposal.waiting_audit &&
          !proposal.passed_audit &&
          !proposal.finished && (
            <>
              <CustomButton
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={() => handleAudit(true)}
                disabled={buttonDisabled}
              >
                Approve
              </CustomButton>
              <CustomButton
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                onClick={() => handleAudit(false)}
                disabled={buttonDisabled}
              >
                Reject
              </CustomButton>
            </>
          )}
      </div>
    </div>
  );
}
