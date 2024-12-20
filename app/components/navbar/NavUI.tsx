"use client";
import Link from "next/link";
import React from "react";
import logo from "../../../public/hexbox_black_logo.svg";
import { Bars3Icon, WalletIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { MobileNav } from "../MobileNav";
import SearchForm from "../SearchForm";
import {
  InfoMenuItems,
  MobileMenuItems,
  NavItems,
} from "@/app/utils/menuItems";
import InfoMenu from "../InfoMenu";
import Image from "next/image";
import Wallet from "../Wallet";
import { ConnectKitButton } from "connectkit";

export default function NavUI() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onResize = () => window.innerWidth >= 960 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <div className="mx-auto">
        <div className="flex items-center justify-between lg:justify-around text-blue-gray-900   ">
          <div className="flex">
            <Link
              href="/"
              className="mr-2 cursor-pointer py-1.5 lg:ml-2 font-semibold "
            >
              <Image src={logo} alt="hexbox_logo" width={50} height={50} />
            </Link>
            <div className="lg:flex justify-between gap-4 items-center ml-8 hidden lg:visible">
              {NavItems.map(({ href, label }) => {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="outline-none text-black hover:text-blueColor"
                  >
                    <span className="text-xl">{label}</span>
                  </Link>
                );
              })}
              <InfoMenu menuItems={InfoMenuItems} />
            </div>
          </div>

          <div className="flex-1 lg:flex justify-end hidden lg:visible">
            <div className="md:w-96 flex justify-end w-full md:mx-4 mr-2 ">
              <SearchForm submitTo="/search?query=" />
            </div>
          </div>
          <div className="hidden lg:flex gap-2 items-center">
            <ConnectKitButton.Custom>
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
            </ConnectKitButton.Custom>
          </div>

          <div className="lg:hidden flex items-center space-x-2 ">
            <button className="lg:hidden " onClick={() => setOpen(!open)}>
              {open ? (
                <XMarkIcon className="h-8 w-8 text-black" strokeWidth={2} />
              ) : (
                <Bars3Icon className="h-8 w-8 text-black" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="lg:hidden">
        <MobileNav menuItems={MobileMenuItems} open={open} />
      </div>
    </>
  );
}
