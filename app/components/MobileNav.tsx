import React from "react";
import { Collapse } from "@material-tailwind/react";
import Link from "next/link";
import { MenuItem } from "../types";

import Wallet from "./Wallet";
import SignInButton from "./SignInButton";

interface Props {
  open: boolean;
  menuItems: MenuItem[];
}

export function MobileNav({ open, menuItems }: Props) {
  return (
    <>
      <Collapse open={open} className="  my-2 ">
        <ul className="space-y-4 border-y-2 border-lightBlueColor py-4 ">
          {menuItems.map(({ href, label }) => (
            <li key={href} className="text-lg mx-2 ">
              <Link href={href}>
                <span className="text-black hover:text-orangeColor">
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className=" mt-2 text-center ">
          <Link className="  px-4 py-1 " href="/">
              <SignInButton />
          </Link>
        </div>
      </Collapse>
    </>
  );
}
