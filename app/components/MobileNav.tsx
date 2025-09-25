import React from "react";
import { Collapse } from "@material-tailwind/react";
import Link from "next/link";
import { MenuItem } from "../types";
import { PiUserCircleFill } from "react-icons/pi";

//import { ConnectKitButton } from "connectkit";
import { WalletIcon } from "@heroicons/react/24/outline";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ThemeToggle from "./ThemeToggle";

interface Props {
  open: boolean;
  menuItems: MenuItem[];
  address: `0x${string}` | undefined;
}

export function MobileNav({ open, menuItems, address }: Props) {
  return (
    <>
      <Collapse open={open} className="  my-2 ">
        <ul className="space-y-4 border-y-2 border-lightBlueColor dark:border-dark-border py-4 ">
          {menuItems.map(({ href, label }, index) => (
            <li key={index} className="text-lg mx-2 ">
              <Link href={href}>
                <span className="text-black dark:text-white hover:text-orangeColor">
                  {label}
                </span>
              </Link>
            </li>
          ))}
          {address && (
            <li className="text-lg mx-2">
              <Link
                href={`/profile?userId=${address}`}
                className="flex items-center gap-2"
                aria-label="Go to user profile"
              >
                <span className="text-black dark:text-white hover:text-orangeColor">
                  Profile
                </span>
                <PiUserCircleFill className="w-6 h-6 text-black dark:text-white hover:text-blueColor" />
              </Link>
            </li>
          )}
        </ul>
        <div className=" mt-2 text-center flex flex-wrap items-center justify-center gap-3 mb-4 bg-dark-textMuted dark:bg-dark-surface p-2">
          <ThemeToggle />
          <ConnectButton
            showBalance={false}
            accountStatus="address"
            chainStatus="icon"
          />{" "}
        </div>
      </Collapse>
    </>
  );
}
