/* import client from "@/app/utils/mongodb";

export const createToken = async (name: string, supply: number, fundsToRaise: number, creatorWalletAddress: string): Promise<string | null> => {
  try {
    supply = 100000 // just to make it work, since we aren't using supply anymore
    const executorTokens = (supply * 0.4);
    const investorTokens = supply - executorTokens;
    const tokenPrice = Number(fundsToRaise) / investorTokens;
    const transitionThreshold = investorTokens * 0.6; // 60% of investor tokens

    const token = await client.db("hexbox_poc").collection("tokens").insertOne({
      name: name,
      supply: supply,
      available_supply: investorTokens,
      price: tokenPrice,
      total_voting_power: 100,
      transition_threshold: transitionThreshold,
      threshold_reached: false,
      total_investor_tokens_owned: 0,
      holders: [{
        address: creatorWalletAddress, 
        balance: executorTokens,
        voting_power: 40
      }],
      transactions: [{
        address: creatorWalletAddress, 
        type: "create", 
        amount: executorTokens,
        timestamp: new Date()
      }]
    });

    return token.insertedId.toString();
  } catch (error) {
    console.log(error);
    return null;
  }
};
 */
