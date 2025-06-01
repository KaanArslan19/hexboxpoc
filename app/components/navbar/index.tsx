import React from "react";
import NavUI from "./NavUI";

export const dynamic = "force-dynamic";

export default async function Navbar() {
  return (
    <div className="relative z-50">
      <NavUI />
    </div>
  );
}
