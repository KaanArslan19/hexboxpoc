import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export const getTokenDetails = async (token_address: string) => {
  // const mdbClient = client;
  // const db = mdbClient.db(process.env.HEXBOX_DB);
  // const token = await db
  //   .collection("tokens")
  //   .findOne({ _id: new ObjectId(token_address) });
  // console.log(token);
  return {
    _id: "123",
    transactions: [],
    holders: [{ address: "0x123", voting_power: 50 }],
    total_voting_power: 100,
  };
};
