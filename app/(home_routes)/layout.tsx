import React, { ReactNode } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/ui/Footer";
interface Props {
  children: ReactNode;
}
export default function HomeLayout({ children }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <div className=" mx-auto p-4">
          <Navbar />
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
