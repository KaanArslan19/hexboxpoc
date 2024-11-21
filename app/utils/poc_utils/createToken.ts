import client from "@/app/utils/mongodb";

export const createToken = async (name: string, supply: number, fundsToRaise: number, creatorWalletAddress: string): Promise<string | null> => {
  try {

    // Executor gets 40% of the supply, so we need to calculate the price based on the remaining 60% to ensure raised funds are met
    const executorTokens = (supply * 0.4)
    const tokenPrice = Number(fundsToRaise) / (Number(supply) - executorTokens)

    const token = await client.db("hexbox_poc").collection("tokens").insertOne({
      name: name,
      supply: supply,
      available_supply: supply - executorTokens,
      price: tokenPrice,
      holders: [{address: creatorWalletAddress, balance: executorTokens}],
      transactions: [{address: creatorWalletAddress, type: "create", amount: executorTokens, timestamp: new Date()}]
    });

    return token.insertedId.toString() as string;

  } catch (error) {
    console.log(error);
    return null;
  }
};
