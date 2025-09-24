import Link from "next/link";
import { RiNftLine } from "react-icons/ri";

export function NFTCollectionButton() {
  return (
    <Link
      href="https://opensea.io/collection/hexbox-gif-collection"
      target="_blank"
    >
      <div
        className="flex items-center justify-center 
        bg-gradient-to-bl  via-lightBlueColor/70 from-orangeColor/80  to-blueColor dark:from-redColor/60 dark:via-lightBlueColor dark:to-dark-textMuted/80 
        text-white px-4 py-2 rounded-full 
        shadow-lg hover:shadow-xl transition-all duration-300 
        transform hover:-translate-y-1 active:scale-95
        font-bold text-sm uppercase 
        tracking-wider group"
      >
        <RiNftLine className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
        NFT
        <p className="hidden md:inline-block font-customFont_regular ml-2 dark:text-dark-text text-white">
          Collection
        </p>
        <span className="ml-2 bg-orangeColor/50 dark:bg-redColor/30  px-2 py-1 rounded-full text-xs ">
          New
        </span>
      </div>
    </Link>
  );
}
