import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(req: Request) {
  try {
    const { text, voice = "alloy" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice, // Options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
    });

    // Convert to ArrayBuffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Return audio as base64 string for easy handling in the frontend
    const base64Audio = buffer.toString('base64');

    return NextResponse.json({ 
      audio: base64Audio,
      text,
      voice
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
} 