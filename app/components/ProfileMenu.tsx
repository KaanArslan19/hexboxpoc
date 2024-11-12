import {
  ChevronDownIcon,
  PowerIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";
import { MenuItems } from "../types";
import SignOutButton from "./SignOutButton";
import {
  Avatar,
  Button,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";

interface Props {
  menuItems: MenuItems[];
  avatar?: string;
}

export default function ProfileMenu({ menuItems, avatar }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <Menu open={isMenuOpen} handler={setIsMenuOpen} placement="bottom-end">
      <MenuHandler>
        <Button
          variant="gradient"
          color="black"
          className="flex items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 lg:ml-auto"
        >
          <p className="px-4 py-2">Account</p>

          <ChevronDownIcon
            strokeWidth={2.5}
            className={`h-3 w-3 transition-transform ${
              isMenuOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      </MenuHandler>

      <MenuList className="p-1">
        {menuItems.map(({ href, icon, label }) => {
          return (
            <Link key={href} href={href} className="outline-none">
              <MenuItem
                onClick={closeMenu}
                className="flex items-center gap-2 rounded"
              >
                {icon}
                <span>{label}</span>
              </MenuItem>
            </Link>
          );
        })}

        <Link href="/dashboard" className="outline-none">
          <MenuItem
            onClick={closeMenu}
            className="flex items-center gap-2 rounded"
          >
            <RectangleGroupIcon className="h-4 w-4" />
            <span>Dashboard</span>
          </MenuItem>
        </Link>

        {/* <MenuItem>
          <SignOutButton>
            <p className="flex items-center gap-2 rounded">
              <PowerIcon className="h-4 w-4" />
              <span>Sign Out</span>
            </p>
          </SignOutButton>
        </MenuItem> */}
      </MenuList>
    </Menu>
  );
}
