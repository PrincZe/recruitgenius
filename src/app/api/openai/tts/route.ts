import { NextResponse } from "next/server";
import OpenAI from "openai";

// Create a new OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Parse the request body for text and voice
    const { text, voice = "alloy" } = await req.json();

    // Validate input
    if (!text) {
      console.error("TTS API: Missing text parameter");
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("TTS API: Missing OpenAI API key");
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 });
    }

    console.log(`TTS API: Generating speech for text (${text.length} chars) with voice: ${voice}`);

    // Create speech with OpenAI
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Using the standard TTS model
      voice, // Options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
    });

    // Convert to ArrayBuffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Return audio as base64 string for easy handling in the frontend
    const base64Audio = buffer.toString('base64');

    console.log(`TTS API: Successfully generated speech (${buffer.length} bytes)`);

    return NextResponse.json({ 
      audio: base64Audio,
      text,
      voice,
      size: buffer.length
    });
  } catch (error) {
    // Log the error
    console.error("TTS API: Error generating speech:", error);
    
    // Detailed error response
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Failed to generate speech",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
} 