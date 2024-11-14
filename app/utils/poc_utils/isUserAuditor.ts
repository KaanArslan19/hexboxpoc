import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getUserTokens } from "./getUserTokens";
import { getWalletTokenAddress } from "./getWalletTokenAddress";

const auditors = ["0x0000000000000000000000000000000000000000"];

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