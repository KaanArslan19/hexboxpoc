import type { Metadata } from "next";
import "./globals.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AuthSession from "./components/AuthSession";
import Wallet from "./components/Wallet";
import { getServerSession } from "next-auth/next";
//import { authOptions } from "./utils/auth";

export const metadata: Metadata = {
  title: "Hexbox",
  description: "Fund Your Campaign",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  //const session = await getServerSession(authOptions);
  return (
    <Wallet>
      <AuthSession>
        <html lang="en">
          <body>{children}</body>
        </html>
      </AuthSession>
    </Wallet>
  );
}
