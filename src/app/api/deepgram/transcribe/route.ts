import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { audioUrl } = await req.json();

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'No audio URL provided' }, 
        { status: 400 }
      );
    }

    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: 'Deepgram API key not configured' }, 
        { status: 500 }
      );
    }

    // Call Deepgram API directly via fetch
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&sentiment=true&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: audioUrl })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Deepgram API error:', errorData);
      return NextResponse.json(
        { error: 'Error calling Deepgram API', details: errorData }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract transcript
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || '';
    
    // Extract sentiment if available
    let sentimentScore = null;
    let sentimentType = null;
    
    if (data.results?.channels[0]?.alternatives[0]?.sentiment) {
      const sentimentData = data.results.channels[0].alternatives[0].sentiment;
      sentimentScore = sentimentData.overall?.score;
      sentimentType = sentimentData.overall?.sentiment;
    }

    return NextResponse.json({
      success: true,
      transcript,
      sentimentScore,
      sentimentType
    });
  } catch (error) {
    console.error('Error processing transcription request:', error);
    return NextResponse.json(
      { error: 'Error processing transcription request', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 