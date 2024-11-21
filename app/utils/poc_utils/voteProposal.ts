import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getUserTokens } from "./getUserTokens";
import { getWalletTokenAddress } from "./getWalletTokenAddress";

export const voteProposal = async (user: string, proposalID: string, vote: boolean) => {
    try {
  
      const proposal = await client.db("hexbox_poc").collection("proposals").findOne({ _id: new ObjectId(proposalID) });
      if (!proposal) {
        return { error: "Proposal not found" };
      }

      const token = await getWalletTokenAddress(proposal.wallet_address);
      if (!token) {
        return { error: "Token not found" };
      }

      const userTokens = await getUserTokens(user, token);
      if (!userTokens) {
        return { error: "User does not have any tokens" };
      }

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
        if (totalYesVotes + userTokens >= neededVotes) {
          proposal.waiting_audit = true;
        }
      } else {
        if (totalNoVotes + userTokens >= neededVotes || totalYesVotes + userTokens >= neededVotes) {
          proposal.waiting_audit = false;
          proposal.passed_audit = false;
          proposal.finished = true;
          proposal.finished_result = false
        }
      }

      const updatedProposal = await client.db("hexbox_poc").collection("proposals").updateOne({ _id: new ObjectId(proposalID) }, 
      { $set: 
        { 
          waiting_audit_timestamp: proposal.waiting_audit ? Date.now() : 0,
          waiting_audit: proposal.waiting_audit,
          passed_audit: proposal.passed_audit,
          finished: proposal.finished,
          voters: [...proposal.voters, {address: user, agree: vote, amount: userTokens}],
          total_yes_votes: proposal.total_yes_votes + (vote ? userTokens : 0),
          total_no_votes: proposal.total_no_votes + (vote ? 0 : userTokens),
          finished_result: proposal.finished_result || null,
          finished_timestamp: proposal.finished ? Date.now() : 0
        } 
      }); 

      return updatedProposal;
  
    } catch (error) {
      console.log(error);
    }
  };