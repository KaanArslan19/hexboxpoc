import React, { ReactNode } from "react";
import { redirect } from "next/navigation";
import Navbar from "../components/navbar";
interface Props {
  children: ReactNode;
}
export default async function GuessLayout({ children }: Props) {
  /*   const session = await auth();

  if (session) {
    return redirect("/");
  } */
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}
