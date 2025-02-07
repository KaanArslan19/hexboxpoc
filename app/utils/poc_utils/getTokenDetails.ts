import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";

export const getTokenDetails = async (token_address: string) => {
  // const mdbClient = client;
  // const db = mdbClient.db("hexbox_poc");
  // const token = await db
  //   .collection("tokens")
  //   .findOne({ _id: new ObjectId(token_address) });
  // console.log(token);
  return {_id: "123", transactions: [], holders: []}
};
