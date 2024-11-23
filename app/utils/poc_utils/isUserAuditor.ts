import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getUserTokens } from "./getUserTokens";
import { getWalletTokenAddress } from "./getWalletTokenAddress";

const auditors = [
  "4ypD7kxRj9DLF3PMxsY3qvp8YdNhAHZRnN3fyVDh5CFX",
  "GWzMPSMz6ZXqbN9iwFwRmUgDyPxWY4goFZGcfiWqTWkt",
];

export const isUserAuditor = (user: string) => {
  try {
    if (auditors.includes(user)) {
      return true;
    }

    return false;
  } catch (error) {
    console.log(error);
  }
};
