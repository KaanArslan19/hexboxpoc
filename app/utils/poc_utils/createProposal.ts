/* import client from "@/app/utils/mongodb";
import { v4 as uuidv4 } from "uuid";
import { getWalletTokenAddress } from "./getWalletTokenAddress";
import { getTokenDetails } from "./getTokenDetails";

const motionTypes = [
  "withdraw",
  // "consensus",
  // "termination"
];

// Example motion details (saved as json string)
// {
//     "amount": 100,
//     "wallet_address": "0x1234567890abcdef"
// }

export const createProposal = async (
  user: string,
  wallet_address: string,
  motionType: string,
  motionDetails: string
) => {
  try {
    const proposalUUID = uuidv4();

    const token = await getWalletTokenAddress(wallet_address);

    if (!token) {
      return { error: "Token not found" };
    }

    const tokenDetails = await getTokenDetails(token);
    if (!tokenDetails) {
      return { error: "Token details not found" };
    }

    if (!tokenDetails?.holders.some((holder: any) => holder.address === user)) {
      return { error: "User does not have any tokens" };
    }

    const userVotingPower =
      tokenDetails?.holders.find((holder: any) => holder.address === user)
        ?.voting_power || 0;
    const totalVotingPower = tokenDetails?.total_voting_power || 100;
    const neededVotes = totalVotingPower * 0.7; // 70% of total voting power needed

    const proposal = await client
      .db("hexbox_poc")
      .collection("proposals")
      .insertOne({
        created_timestamp: Date.now(),
        wallet_address: wallet_address,
        motion_type: motionType,
        motion_details: motionDetails,
        total_yes_votes: userVotingPower,
        total_no_votes: 0,
        needed_yes_votes: neededVotes, // 70% of total voting power
        voters: [
          {
            address: user,
            agree: true,
            amount: userVotingPower,
            timestamp: Date.now(),
          },
        ], // list of voters, their decision and their voting power
        waiting_audit: false, // is proposal waiting for audit (has it hit 70% yes votes)
        waiting_audit_timestamp: 0, // timestamp of when proposal hit 70% yes votes
        passed_audit: false, // has proposal passed audit
        audit_timestamp: 0, // timestamp of audit
        finished: false, // Is overall proposal active
        finished_result: false, // Result of proposal
        finished_timestamp: 0, // Timestamp of when proposal finished
      });

    return proposal;
  } catch (error) {
    console.log(error);
  }
};
 */
