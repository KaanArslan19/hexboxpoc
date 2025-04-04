import React, { ReactNode } from "react";

import { redirect } from "next/navigation";
import Navbar from "@components/navbar";

interface Props {
  children: ReactNode;
}
export default async function PrivateLayout({ children }: Props) {
  return (
    <div className="max-w-screen-[80vh] mx-auto p-4 ">
      <Navbar />

      {children}
    </div>
  );
}
