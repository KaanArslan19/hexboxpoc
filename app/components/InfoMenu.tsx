import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";
import { MenuItem as infoMenuItem } from "../types";
import {
  Button,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";

interface Props {
  menuItems: infoMenuItem[];
}

export default function InfoMenu({ menuItems }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <Menu open={isMenuOpen} handler={setIsMenuOpen} placement="bottom-end">
      <MenuHandler>
        <button className="flex items-center gap-1 py-0.5 pr-2 pl-0.5 lg:ml-auto  group">
          <span className="mr-2 text-xl text-black dark:text-white group-hover:text-blueColor dark:group-hover:text-dark-textMuted">
            Info
          </span>
          <ChevronDownIcon
            strokeWidth={2.5}
            className={`h-3 w-3 transition-transform group-hover:text-blueColor text-black dark:group-hover:text-dark-textMuted dark:text-white ${
              isMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </MenuHandler>

      <MenuList className="p-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-black dark:text-dark-text shadow-lg">
        {menuItems.map(({ href, label }, index) => {
          return (
            <Link
              key={index}
              href={href}
              className="outline-none"
              target={label.toLowerCase() === "about" ? "_self" : "_blank"}
            >
              <MenuItem
                onClick={closeMenu}
                className="flex items-center gap-2 rounded-none text-black dark:text-white dark:bg-dark-surface hover:bg-lightBlueColor dark:hover:bg-dark-surfaceHover"
              >
                <span>{label}</span>
              </MenuItem>
            </Link>
          );
        })}
      </MenuList>
    </Menu>
  );
}
