import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getTokenDetails } from "./getTokenDetails";
import { getTokenWalletAddress } from "./getTokenWalletAddress";
import { createUSDCTransaction } from "./createUSDCTransaction";
import { getPublicCampaign } from "../campaigns";

export const buyToken = async (campaign_id: string, amount: number) => {
  try {
    const campaign = await getPublicCampaign(campaign_id);
    if (!campaign) {
      return { error: "Campaign not found" };
    }

    const walletAddress = campaign.wallet_address;

    const transaction = await createUSDCTransaction(walletAddress, amount);
    console.log(transaction);

    return transaction;
  } catch (error) {
    console.log(error);
    return { error: "Failed to process token purchase" };
  }
};

// export const buyToken = async (
//   user: string,
//   token_address: string,
//   amount: number
// ) => {
//   try {
//     const tokenDetails = await getTokenDetails(token_address);
//     if (!tokenDetails) {
//       return { error: "Token not found" };
//     }

//     const tokenSupply = tokenDetails.supply;
//     const availableSupply = tokenDetails.available_supply;
//     if (availableSupply + amount > tokenSupply) {
//       return { error: "Token supply limit reached" };
//     }

//     if (amount > availableSupply) {
//       return { error: "Not enough tokens available" };
//     }

//     const oldVotingPower = tokenDetails.holders.find(
//       (h: any) => h.address === user
//     )?.voting_power || 0;

//     const userTokens = await getUserTokens(user, token_address);
//     let userTokenBalance = 0;
//     if (!userTokens) {
//       userTokenBalance = amount;
//     } else {
//       userTokenBalance = userTokens + amount;
//     }

//     tokenDetails.available_supply = availableSupply - amount;

//     const holderExists = tokenDetails.holders.some(
//       (holder: any) => holder.address === user
//     );

//     const availableVotingPower = 60; // 60% is available for investors
//     const totalInvestorTokens = tokenDetails.supply * 0.6; // 60% of tokens for investors
//     const purchaseVotingPower = (amount / totalInvestorTokens) * availableVotingPower;

//     const roundToTwo = (num: number): number => {
//       return Math.round((num + Number.EPSILON) * 100) / 100;
//     };

//     const recalculateVotingPowers = (tokenDetails: any, newHolder: any) => {
//       let updatedHolders = [...tokenDetails.holders];
//       const existingHolderIndex = updatedHolders.findIndex(h => h.address === newHolder.address);

//       // Update or add holder balance
//       if (existingHolderIndex >= 0) {
//         updatedHolders[existingHolderIndex].balance = roundToTwo(newHolder.balance);
//       } else {
//         updatedHolders.push({
//           address: newHolder.address,
//           balance: roundToTwo(newHolder.balance)
//         });
//       }

//       // Calculate total investor tokens owned
//       const investorHolders = updatedHolders.filter(h => h.address !== updatedHolders[0].address);
//       const totalInvestorTokens = roundToTwo(investorHolders.reduce(
//         (sum, holder) => sum + holder.balance,
//         0
//       ));

//       // Check if transition threshold is reached
//       const thresholdReached = totalInvestorTokens >= tokenDetails.transition_threshold;

//       if (!thresholdReached) {
//         // Before threshold: Creator keeps 40%, investors share 60%
//         return updatedHolders.map(holder => ({
//           ...holder,
//           balance: roundToTwo(holder.balance),
//           voting_power: holder.address === updatedHolders[0].address
//             ? 40 // Creator keeps 40%
//             : roundToTwo((holder.balance / totalInvestorTokens) * 60) // Investors share 60%
//         }));
//       } else {
//         // After threshold: Voting power proportional to token ownership
//         const totalTokens = roundToTwo(updatedHolders.reduce(
//           (sum, holder) => sum + holder.balance,
//           0
//         ));

//         return updatedHolders.map(holder => ({
//           ...holder,
//           balance: roundToTwo(holder.balance),
//           voting_power: roundToTwo((holder.balance / totalTokens) * 100)
//         }));
//       }
//     };

//     let updateOperation: any;
//     if (holderExists) {
//       const recalculatedHolders = recalculateVotingPowers(tokenDetails, {
//         address: user,
//         balance: userTokenBalance
//       });

//       updateOperation = {
//         $set: {
//           available_supply: tokenDetails.available_supply,
//           holders: recalculatedHolders
//         }
//       };
//     } else {
//       const recalculatedHolders = recalculateVotingPowers(tokenDetails, {
//         address: user,
//         balance: amount
//       });

//       updateOperation = {
//         $set: {
//           available_supply: tokenDetails.available_supply,
//           holders: recalculatedHolders
//         }
//       };
//     }

//     const updatedToken = await client
//       .db(process.env.HEXBOX_DB)
//       .collection("tokens")
//       .updateOne(
//         { _id: new ObjectId(token_address) },
//         updateOperation
//       );

//     // After updating token holdings, get the new voting power
//     const updatedTokenDetails = await getTokenDetails(token_address);
//     if (!updatedTokenDetails) {
//       return { error: "Token not found" };
//     }
//     const newVotingPower = updatedTokenDetails.holders.find(
//       (h: any) => h.address === user
//     )?.voting_power || 0;

//     // Update active proposals
//     const activeProposals = await client
//       .db(process.env.HEXBOX_DB)
//       .collection("proposals")
//       .find({
//         wallet_address: await getTokenWalletAddress(token_address),
//         finished: false,
//         waiting_audit: false
//       }).toArray();

//     for (const proposal of activeProposals) {
//       const existingVote = proposal.voters.find(
//         (voter: any) => voter.address === user
//       );

//       if (existingVote) {
//         const voteDifference = roundToTwo(newVotingPower - oldVotingPower);

//         // Update vote totals and voter amount
//         if (existingVote.agree) {
//           proposal.total_yes_votes = roundToTwo(proposal.total_yes_votes + voteDifference);
//         } else {
//           proposal.total_no_votes = roundToTwo(proposal.total_no_votes + voteDifference);
//         }

//         // Update voter amount
//         proposal.voters = proposal.voters.map((voter: any) =>
//           voter.address === user
//             ? { ...voter, amount: roundToTwo(newVotingPower) }
//             : voter
//         );

//         // Check if proposal now meets threshold
//         if (proposal.total_yes_votes >= proposal.needed_yes_votes) {
//           proposal.waiting_audit = true;
//           proposal.waiting_audit_timestamp = Date.now();
//         }

//         await client.db(process.env.HEXBOX_DB).collection("proposals").updateOne(
//           { _id: proposal._id },
//           { $set: proposal }
//         );
//       }
//     }

//     const walletAddress = (await getTokenWalletAddress(
//       token_address
//     )) as string;
//     console.log("WALLLLETTT", walletAddress);
//     if (!walletAddress) {
//       return { error: "Wallet not found" };
//     }
//     const wallet = await client
//       .db(process.env.HEXBOX_DB)
//       .collection("wallets")
//       .updateOne(
//         { _id: new ObjectId(walletAddress) },
//         { $inc: { total_funds: Math.round(amount * tokenDetails.price) } }
//       );

//     return updatedToken;
//   } catch (error) {
//     console.log(error);
//   }
// };
