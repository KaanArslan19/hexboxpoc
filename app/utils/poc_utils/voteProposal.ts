/* import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getWalletTokenAddress } from "./getWalletTokenAddress";
import { getTokenDetails } from "./getTokenDetails";

export const voteProposal = async (
  user: string,
  proposalID: string,
  vote: boolean
) => {
  try {
    const proposal = await client
      .db(process.env.HEXBOX_DB)
      .collection("proposals")
      .findOne({ _id: new ObjectId(proposalID) });
    if (!proposal) {
      return { error: "Proposal not found" };
    }

    const token = await getWalletTokenAddress(proposal.wallet_address);
    if (!token) {
      return { error: "Token not found" };
    }

    const tokenDetails = await getTokenDetails(token);
    if (!tokenDetails) {
      return { error: "Token details not found" };
    }

    const userHolder = tokenDetails.holders.find(
      (h: any) => h.address === user
    );
    if (!userHolder) {
      return { error: "User does not have any tokens" };
    }

    const userVotingPower = userHolder.voting_power;

    const voters = proposal.voters;
    const existingVote = voters.find((voter: any) => voter.address === user);

    if (proposal.finished === true) {
      return { error: "Proposal has finished" };
    }

    if (existingVote) {
      // If user already voted the same way, return error
      if (existingVote.agree === vote) {
        return { error: "User has already voted this way" };
      }

      // If vote is different, remove old vote from totals
      if (existingVote.agree) {
        proposal.total_yes_votes -= existingVote.amount;
      } else {
        proposal.total_no_votes -= existingVote.amount;
      }

      // Remove the old vote from voters array
      proposal.voters = voters.filter((voter: any) => voter.address !== user);
    }

    const neededVotes = proposal.needed_yes_votes;
    const totalYesVotes = proposal.total_yes_votes;
    const totalNoVotes = proposal.total_no_votes;
    if (vote) {
      if (totalYesVotes + userVotingPower >= neededVotes) {
        proposal.waiting_audit = true;
      }
    } else {
      if (
        totalNoVotes + userVotingPower >= neededVotes ||
        totalYesVotes + userVotingPower >= neededVotes
      ) {
        proposal.waiting_audit = false;
        proposal.passed_audit = false;
        proposal.finished = true;
        proposal.finished_result = false;
      }
    }

    const updatedProposal = await client
      .db(process.env.HEXBOX_DB)
      .collection("proposals")
      .updateOne(
        { _id: new ObjectId(proposalID) },
        {
          $set: {
            waiting_audit_timestamp: proposal.waiting_audit ? Date.now() : 0,
            waiting_audit: proposal.waiting_audit,
            passed_audit: proposal.passed_audit,
            finished: proposal.finished,
            voters: [
              ...proposal.voters,
              { address: user, agree: vote, amount: userVotingPower },
            ],
            total_yes_votes:
              proposal.total_yes_votes + (vote ? userVotingPower : 0),
            total_no_votes:
              proposal.total_no_votes + (vote ? 0 : userVotingPower),
            finished_result: proposal.finished_result || false,
            finished_timestamp: proposal.finished ? Date.now() : 0,
          },
        }
      );

    return updatedProposal;
  } catch (error) {
    console.log(error);
  }
};
 */
