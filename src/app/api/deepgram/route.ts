import { NextResponse } from "next/server";

// Remove the dynamic export for static export compatibility
// export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json({
      key: process.env.DEEPGRAM_API_KEY ?? "",
    });
}
