import { NextRequest, NextResponse } from "next/server";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { sessionManager } from "@/app/lib/auth/utils/sessionManager";

export async function POST(req: NextRequest) {
  try {
    // Verify the requester is authenticated
    const session = await getServerSideUser(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the session details to blacklist
    const { targetAddress, targetJti, reason } = await req.json();

    if (!targetAddress || !targetJti || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Blacklist the session
    await sessionManager.blacklistSession(targetAddress, targetJti, reason);

    return NextResponse.json({
      success: true,
      message: "Session blacklisted successfully"
    });
  } catch (error) {
    console.error("Error blacklisting session:", error);
    return NextResponse.json(
      { error: "Failed to blacklist session" },
      { status: 500 }
    );
  }
} 