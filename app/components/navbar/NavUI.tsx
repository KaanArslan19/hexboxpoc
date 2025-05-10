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
import { NFTCollectionButton } from "../ui/NFTCollectionButton";

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
      <div className="mx-auto px-4">
        <div className="grid grid-cols-12 items-center w-full py-2">
          <div className="col-span-3 lg:col-span-4 flex items-center">
            <Link
              href="/"
              className="cursor-pointer py-1.5 mr-2 lg:ml-2 font-semibold"
            >
              <Image src={logo} alt="hexbox_logo" width={50} height={50} />
            </Link>
            <div className="hidden lg:flex justify-between gap-4 items-center ml-4">
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

          <div className="col-span-6 lg:col-span-4 flex justify-center">
            <NFTCollectionButton />
          </div>

          <div className="col-span-3 lg:col-span-4 flex items-center justify-end gap-2 ">
            <div className="hidden lg:flex flex-1 justify-end ">
              <div className="w-full max-w-xs mr-2 ">
                <SearchForm submitTo="/search?query=" />
              </div>
            </div>

            <div className="hidden lg:flex items-center">
              <ConnectButton
                showBalance={false}
                accountStatus="address"
                chainStatus="icon"
              />
            </div>

            {address && (
              <Link
                href={`/profile?userId=${address}`}
                className="hidden lg:flex items-center justify-center transition-all duration-200"
                aria-label="Go to user profile"
              >
                <PiUserCircleFill className="text-black hover:text-blueColor transition-colors duration-200 w-8 h-8" />
              </Link>
            )}

            <div className="lg:hidden flex items-center ml-2">
              <button
                className="focus:outline-none"
                onClick={() => setOpen(!open)}
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? (
                  <XMarkIcon className="h-8 w-8 text-black" strokeWidth={2} />
                ) : (
                  <Bars3Icon className="h-8 w-8 text-black" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <MobileNav menuItems={MobileMenuItems} open={open} address={address} />
      </div>
    </>
  );
}
