import client from "@/app/utils/mongodb";
import { v4 as uuidv4 } from "uuid";

export const createToken = async (name: string, supply: number, fundsToRaise: number, creatorWalletAddress: string) => {
  try {

    // Executor gets 40% of the supply, so we need to calculate the price based on the remaining 60% to ensure raised funds are met
    const tokenPrice = Number(fundsToRaise) / (Number(supply) - (Number(supply) * 0.4))
    const tokenUUID = uuidv4();

    const token = await client.db("hexbox_poc").collection("tokens").insertOne({
      address: tokenUUID,
      name: name,
      supply: supply,
      price: tokenPrice,
      holders: [{address: creatorWalletAddress, balance: (supply * 0.4)}],
    });

    return tokenUUID

  } catch (error) {
    console.log(error);
  }
};
