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
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&sentiment=true&detect_language=true&smart_format=true&summarize=v2&topics=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: audioUrl })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Deepgram API error:', errorData);
      try {
        const parsedError = JSON.parse(errorData);
        return NextResponse.json(
          { error: 'Error calling Deepgram API', details: parsedError }, 
          { status: response.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'Error calling Deepgram API', details: errorData }, 
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    console.log('Deepgram API response:', JSON.stringify(data, null, 2));
    
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

    // Extract summary if available
    let summary = null;
    if (data.results?.summary?.short) {
      summary = data.results.summary.short;
    }

    // Extract topics if available
    let topics = [];
    if (data.results?.topics?.segments) {
      // Collect all unique topics with their confidence scores
      const topicMap = new Map();
      
      for (const segment of data.results.topics.segments) {
        if (segment.topics && segment.topics.length > 0) {
          for (const topicObj of segment.topics) {
            // Keep track of the highest confidence score for each topic
            if (!topicMap.has(topicObj.topic) || 
                topicMap.get(topicObj.topic).confidence < topicObj.confidence_score) {
              topicMap.set(topicObj.topic, {
                topic: topicObj.topic,
                confidence: topicObj.confidence_score
              });
            }
          }
        }
      }
      
      // Convert map to array and sort by confidence
      topics = Array.from(topicMap.values())
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Just keep top 5 topics
    }

    console.log(`Transcription completed. Transcript length: ${transcript.length}, Sentiment: ${sentimentType}, Has summary: ${!!summary}, Topics: ${topics.length}`);

    return NextResponse.json({
      success: true,
      transcript,
      sentimentScore,
      sentimentType,
      summary,
      topics
    });
  } catch (error) {
    console.error('Error processing transcription request:', error);
    return NextResponse.json(
      { error: 'Error processing transcription request', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 