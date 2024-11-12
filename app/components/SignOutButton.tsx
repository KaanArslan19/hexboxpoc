import React, { ReactNode } from "react";
interface Props {
  children: ReactNode;
}
export default function SignOutButton({ children }: Props) {
  return <div>{children}</div>;
}
