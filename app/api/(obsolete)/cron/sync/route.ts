import { NextResponse } from "next/server";
import { syncExternalData } from "@/app/utils/sync/syncExternalData";

// // Vercel Cron Job configuration
// export const config = {
//   runtime: 'edge',
//   maxDuration: 300,
// };

// export const runtime = "edge";

export async function GET() {
  try {
    const result = await syncExternalData();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
} 