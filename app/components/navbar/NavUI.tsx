"use client";
import React from "react";
import logo from "../../../public/hexbox_black_logo.svg";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PiUserCircleFill } from "react-icons/pi";
import { MobileNav } from "../MobileNav";
import SearchForm from "../SearchForm";
import Link from "next/link";
import {
  InfoMenuItems,
  MobileMenuItems,
  NavItems,
} from "@/app/utils/menuItems";
import InfoMenu from "../InfoMenu";
import Image from "next/image";
import { useAccount } from "wagmi";
import { NFTCollectionButton } from "../ui/NFTCollectionButton"; // Import the new button

export default function NavUI() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onResize = () => window.innerWidth >= 960 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { address } = useAccount();

  return (
    <>
      <div className="mx-auto">
        <div className="flex items-center justify-between text-blue-gray-900 relative">
          <div className="flex">
            <Link
              href="/"
              className="mr-2 cursor-pointer py-1.5 lg:ml-2 font-semibold "
            >
              <Image src={logo} alt="hexbox_logo" width={50} height={50} />
            </Link>
            <div className="lg:flex justify-between gap-4 items-center ml-8 hidden lg:visible">
              {NavItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="outline-none text-black hover:text-blueColor"
                >
                  <span className="text-xl">{label}</span>
                </Link>
              ))}
              <InfoMenu menuItems={InfoMenuItems} />
            </div>
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2">
            <NFTCollectionButton />
          </div>

          <div className="flex gap-4 justify-end">
            <div className="flex-1 lg:flex justify-end hidden lg:visible ">
              <div className=" lg:96 w-full flex justify-end  md:mx-4 mr-2 ">
                <SearchForm submitTo="/search?query=" />
              </div>
            </div>
            <div className="hidden lg:flex gap-2 items-center">
              <ConnectButton
                showBalance={false}
                accountStatus="address"
                chainStatus="icon"
              />
            </div>
            {address && (
              <Link
                href={`/profile?userId=${address}`}
                className="flex items-center justify-center"
              >
                <PiUserCircleFill className="w-8 h-8 hover:text-blueColor text-black" />
              </Link>
            )}
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
