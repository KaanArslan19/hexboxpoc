import React from "react";
import { Collapse } from "@material-tailwind/react";
import Link from "next/link";
import { MenuItem } from "../types";

import Wallet from "./Wallet";
//import { ConnectKitButton } from "connectkit";
import { WalletIcon } from "@heroicons/react/24/outline";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface Props {
  open: boolean;
  menuItems: MenuItem[];
}

export function MobileNav({ open, menuItems }: Props) {
  return (
    <>
      <Collapse open={open} className="  my-2 ">
        <ul className="space-y-4 border-y-2 border-lightBlueColor py-4 ">
          {menuItems.map(({ href, label }, index) => (
            <li key={index} className="text-lg mx-2 ">
              <Link href={href}>
                <span className="text-black hover:text-orangeColor">
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className=" mt-2 text-center flex items-center">
          {/* <ConnectKitButton.Custom>
            {({ isConnected, isConnecting, show }) => (
              <button
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-orangeColor to-yellowColor text-white font-bold py-3 px-5 rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:ring focus:ring-pink-300"
                onClick={show}
              >
                <WalletIcon className="h-5 w-5 text-white" />
                <span>
                  {isConnecting
                    ? "Connecting..."
                    : isConnected
                    ? "Wallet Connected"
                    : "Connect Wallet"}
                </span>
              </button>
            )}
          </ConnectKitButton.Custom> */}
          <ConnectButton />{" "}
        </div>
      </Collapse>
    </>
  );
}
