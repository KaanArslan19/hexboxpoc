/* "use client";

import React, { useEffect, useState } from "react";
import CustomButton from "./CustomButton";
import CampaignProposalItem from "./CampaignProposalItem";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
export default function CampaignProposal({
  proposals,
  holders,
  businessWallet,
  supply,
}: any) {
  const [showForm, setShowForm] = useState(false);
  const [proposalType, setProposalType] = useState("");
  const [proposalAction, setProposalAction] = useState({});
  const [isAuditor, setIsAuditor] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);
  const { address: session } = useAccount();
  const router = useRouter();
  useEffect(() => {
    console.log(proposals);
  }, [proposals]);
  ("");
  useEffect(() => {
    if (session) {
      const isInvestor = holders.some(
        (holder: any) => holder.address === session
      );
      setIsInvestor(isInvestor);

      axios.get(`/api/isUserAuditor?walletAddress=${session}`).then((res) => {
        setIsAuditor(res.data);
      });
    } else {
      setIsAuditor(false);
      setIsInvestor(false);
    }
  }, [session, holders]);

  if (!session) {
    return <div>Please sign in to continue</div>;
  }

  async function handleCreateProposal() {
    setShowForm(false);
    setProposalType("");

    const formData = new FormData();
    formData.append("wallet_address", businessWallet);
    formData.append("motion_type", proposalType);
    formData.append("motion_details", JSON.stringify(proposalAction));

    const response = await axios.post("/api/createProposal", formData);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <h2 className="text-xl lg:text-2xl mt-4 mb-2 text-center">Proposals</h2>
      {isInvestor && (
        <CustomButton
          className="bg-none border-[1px] border-blueColor mx-auto"
          onClick={() => setShowForm(true)}
        >
          Create a Proposal
        </CustomButton>
      )}

      {showForm && (
        <div className="border p-4 rounded-lg max-w-md mx-auto w-full">
          <select
            className="w-full p-2 mb-4 border rounded"
            value={proposalType}
            onChange={(e) => setProposalType(e.target.value)}
          >
            <option value="">Select Proposal Type</option>
            <option value="withdraw">Withdraw</option>
          </select>

          {proposalType === "withdraw" && (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Wallet Address"
                className="p-2 border rounded"
                onChange={(e) =>
                  setProposalAction({
                    ...proposalAction,
                    wallet_address: e.target.value,
                  })
                }
              />
              <input
                type="number"
                placeholder="Amount"
                className="p-2 border rounded"
                onChange={(e) =>
                  setProposalAction({
                    ...proposalAction,
                    amount: e.target.value,
                  })
                }
              />
              <CustomButton
                className="bg-blueColor text-white"
                onClick={handleCreateProposal}
              >
                Create
              </CustomButton>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 ">
        {proposals.map((proposal: any) => (
          <CampaignProposalItem
            key={proposal._id}
            holders={holders}
            proposal={proposal}
            isInvestor={isInvestor}
            isAuditor={isAuditor}
            supply={supply}
          />
        ))}
      </div>
    </div>
  );
}
 */
