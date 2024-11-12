"use client";
// import { SessionProvider } from "next-auth/react";
// export default SessionProvider;
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "../utils/auth";

interface Props {
  children: ReactNode;
}
export default function AuthSession({ children }: Props) {
  //const session = await getServerSession(authOptions);
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
