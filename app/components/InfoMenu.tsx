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
        <button className="flex hover:text-blueColor items-center gap-1 py-0.5 pr-2 pl-0.5 lg:ml-auto">
          <span className="mr-2 text-xl">Info</span>

          <ChevronDownIcon
            strokeWidth={2.5}
            className={`h-3 w-3 transition-transform ${
              isMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </MenuHandler>

      <MenuList className="p-1">
        {menuItems.map(({ href, label }) => {
          return (
            <Link key={href} href={href} className="outline-none">
              <MenuItem
                onClick={closeMenu}
                className="flex items-center gap-2 rounded-none text-black hover:bg-lightBlueColor"
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
