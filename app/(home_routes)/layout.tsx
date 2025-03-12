import React, { ReactNode } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/ui/Footer";
interface Props {
  children: ReactNode;
}
export default function HomeLayout({ children }: Props) {
  return (
    <div className="max-w-screen-[80vh] mx-auto p-4">
      <Navbar />
      {children}
      <div className="mx-[-1rem] sm:mx-[-2rem] md:mx-[-4rem] lg:mx-[-4rem] mt-8 py-[-1rem]">
        <Footer />
      </div>
    </div>
  );
}
