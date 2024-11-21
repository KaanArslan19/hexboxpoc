import client from "@/app/utils/mongodb";

export const createWallet = async (token_address: string): Promise<string | null> => {
  try {

    const wallet = await client.db("hexbox_poc").collection("wallets").insertOne({
      total_funds: 0,
      token_address: token_address,
    });

    if (!wallet) {
      return null;
    }

    return wallet.insertedId.toString() as string;

  } catch (error) {
    console.log(error);
    return null;
  }
};
