import React, { ReactNode } from "react";
import Navbar from "../components/navbar";
interface Props {
  children: ReactNode;
}
export default function HomeLayout({ children }: Props) {
  return (
    <div className="max-w-screen-[80vh] mx-auto p-4">
      <Navbar />
      {children}
    </div>
  );
}
