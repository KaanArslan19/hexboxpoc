import client from "@/app/utils/mongodb";

export const createWallet = async (token_address: string) => {
  try {

    const wallet = await client.db("hexbox_poc").collection("wallets").insertOne({
      total_funds: 0,
      token_address: token_address,
    });

    return wallet.insertedId.toString()

  } catch (error) {
    console.log(error);
  }
};
