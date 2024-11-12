import client from "@/app/utils/mongodb";
import { v4 as uuidv4 } from "uuid";

export const createToken = async (name: string, supply: number, fundsToRaise: number) => {
  try {

    const tokenPrice = Number(supply) / Number(fundsToRaise);
    const tokenUUID = uuidv4();

    const token = await client.db("hexbox_poc").collection("tokens").insertOne({
      address: tokenUUID,
      name: name,
      supply: supply,
      price: tokenPrice,
    });

    return tokenUUID

  } catch (error) {
    console.log(error);
  }
};
