import React, { ReactNode } from "react";

import { redirect } from "next/navigation";
import Navbar from "@components/navbar";

interface Props {
  children: ReactNode;
}
export default async function PrivateLayout({ children }: Props) {
  return (
    <div className="max-w-screen-xl mx-auto p-4 xl:p-0 ">
      <Navbar />

      {children}
    </div>
  );
}
