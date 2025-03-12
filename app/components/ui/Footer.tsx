import { MobileMenuItems } from "@/app/utils/menuItems";
import Link from "next/link";
import {
  FaDiscord,
  FaBook,
  FaQuestionCircle,
  FaEnvelope,
} from "react-icons/fa";

// Reusing your existing MenuItem type
export type MenuItem = {
  href: string;
  label: string;
};

// Extending the footer with additional sections similar to Kickstarter
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const mainLinks = MobileMenuItems.slice(0, 3); // Explore, Create, About
  const supportLinks = MobileMenuItems.slice(3, 5); // Contact, Discord
  const resourceLinks = MobileMenuItems.slice(5); // Docs, FAQ

  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blueColor  mb-4">
              HexBox
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Building the future of decentralized collaboration and innovation.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://discord.gg/7XudEQ56"
                className="text-gray-500 hover:text-indigo-600"
              >
                <FaDiscord className="w-6 h-6" />
              </Link>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blueColor mb-4">
              Explore
            </h3>
            <ul className="space-y-2">
              {mainLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-blueColor/80 text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blueColor mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <Link
                href="mailto:hexbox.money@gmail.com"
                className="text-gray-600 hover:text-indigo-600 text-sm flex items-center"
              >
                <FaEnvelope className="w-4 h-4 mr-2 text-gray-500" />
                E-Mail
              </Link>
              {supportLinks.map((item) => (
                <li key={item.label} className="flex items-center">
                  {item.label.includes("Discord") && (
                    <FaDiscord className="w-4 h-4 mr-2 text-gray-500" />
                  )}
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-blueColor/80 text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resource links */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blueColor mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              {resourceLinks.map((item) => (
                <li key={item.label} className="flex items-center">
                  {item.label.includes("Docs") && (
                    <FaBook className="w-4 h-4 mr-2 text-gray-500" />
                  )}
                  {item.label.includes("F.A.Q.") && (
                    <FaQuestionCircle className="w-4 h-4 mr-2 text-gray-500" />
                  )}
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-blueColor/80 text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-500 text-sm mb-4 md:mb-0">
            © {currentYear} HexBox. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link
              href="/"
              className="text-gray-500 hover:text-blueColor/80 text-sm"
            >
              Terms of Use
            </Link>
            <Link
              href="/"
              className="text-gray-500 hover:text-blueColor/80 text-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/"
              className="text-gray-500 hover:text-blueColor/80 text-sm"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
