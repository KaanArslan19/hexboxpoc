import { NextRequest, NextResponse } from "next/server";
import { syncExternalData } from "@/app/utils/sync/syncExternalData";
import { getServerSideUser } from "@/app/utils/getServerSideUser";

export async function POST(req: NextRequest) {
  try {
    // const session = await getServerSideUser(req);
    // if (!session.isAuthenticated) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    let fundraiserAddress: string | undefined;

    // Get optional fundraiser address from request body
    // Only try to parse body if content-type is application/json
    if (req.headers.get('content-type')?.includes('application/json')) {
        const body = await req.json();
        fundraiserAddress = body.fundraiserAddress;
    }

    const result = await syncExternalData(fundraiserAddress ?? undefined);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
} 