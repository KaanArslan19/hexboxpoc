import React, { ReactNode } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/ui/Footer";
import { headers } from "next/headers";
interface Props {
  children: ReactNode;
}
export default function HomeLayout({ children }: Props) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";

  const noPaddingRoutes = ["/announcement"];
  const shouldRemovePadding = noPaddingRoutes.some((route) =>
    pathname.startsWith(route)
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <div className={shouldRemovePadding ? "mx-auto p-4" : ""}>
          <Navbar />
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
