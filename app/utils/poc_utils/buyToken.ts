import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getUserTokens } from "./getUserTokens";
import { getWalletTokenAddress } from "./getWalletTokenAddress";
import { getTokenDetails } from "./getTokenDetails";

export const buyToken = async (
  user: string,
  token_address: string,
  amount: number
) => {
  try {
    const tokenDetails = await getTokenDetails(token_address);
    if (!tokenDetails) {
      return { error: "Token not found" };
    }

    const tokenSupply = tokenDetails.supply;
    const availableSupply = tokenDetails.available_supply;
    if (availableSupply + amount > tokenSupply) {
      return { error: "Token supply limit reached" };
    }

    if (amount > availableSupply) {
      return { error: "Not enough tokens available" };
    }

    const userTokens = await getUserTokens(user, token_address);
    let userTokenBalance = 0;
    if (!userTokens) {
      userTokenBalance = amount;
    } else {
      userTokenBalance = userTokens + amount;
    }

    tokenDetails.available_supply = availableSupply - amount;

    const holderExists = tokenDetails.holders.some(
      (holder: any) => holder.address === user
    );

    let updateOperation: any;
    if (holderExists) {
      // Update existing holder
      updateOperation = {
        $set: { available_supply: tokenDetails.available_supply },
        $inc: { "holders.$[holder].balance": amount },
        $push: {
          transactions: {
            address: user,
            type: "buy",
            amount: amount,
            timestamp: new Date(),
          },
        },
      };
    } else {
      // Add new holder
      updateOperation = {
        $set: { available_supply: tokenDetails.available_supply },
        $push: {
          holders: { address: user, balance: amount },
          transactions: {
            address: user,
            type: "buy",
            amount: amount,
            timestamp: new Date(),
          },
        },
      };
    }

    const updatedToken = await client
      .db("hexbox_poc")
      .collection("tokens")
      .updateOne(
        { _id: new ObjectId(token_address) },
        updateOperation,
        holderExists
          ? { arrayFilters: [{ "holder.address": user }] }
          : undefined
      );
    const walletAddress = (await getWalletTokenAddress(
      token_address
    )) as string;
    console.log("WALLLLETTT", walletAddress);
    if (!walletAddress) {
      return { error: "Wallet not found" };
    }
    const wallet = await client
      .db("hexbox_poc")
      .collection("wallets")
      .updateOne(
        { _id: new ObjectId(walletAddress) },
        { $inc: { balance: amount } }
      );

    return updatedToken;
  } catch (error) {
    console.log(error);
  }
};
