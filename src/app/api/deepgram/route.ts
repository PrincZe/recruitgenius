import { NextResponse } from "next/server";

// Force dynamic to ensure we get the latest API key
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    
    if (!apiKey) {
      console.error("Deepgram API key not found in environment variables");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }
    
    console.log("Deepgram API key successfully retrieved");
    
    return NextResponse.json(
      { key: apiKey },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  } catch (error) {
    console.error("Error retrieving Deepgram API key:", error);
    return NextResponse.json(
      { error: "Failed to retrieve API key" },
      { status: 500 }
    );
  }
}
