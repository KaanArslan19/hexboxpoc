import { NextRequest, NextResponse } from "next/server";
import { getServerSideUser } from "@/app/utils/getServerSideUser";

export async function GET(request: NextRequest) {
  const user = await getServerSideUser(request);
  if (!user.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {  
    return NextResponse.json({ success: true, user: user.address });
  }
}