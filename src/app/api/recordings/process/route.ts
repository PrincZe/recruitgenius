import { NextRequest, NextResponse } from 'next/server';
import { updateRecordingTranscript } from '@/lib/services/supabaseService';

export async function POST(req: NextRequest) {
  try {
    const { recordingId, audioUrl } = await req.json();

    if (!recordingId || !audioUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: recordingId and audioUrl' }, 
        { status: 400 }
      );
    }

    console.log(`Processing recording: ${recordingId} with audio URL: ${audioUrl}`);

    // Call our Deepgram API route for transcription and sentiment analysis
    const response = await fetch(`${req.nextUrl.origin}/api/deepgram/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audioUrl })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from Deepgram API:', errorData);
      return NextResponse.json(
        { error: 'Error processing recording', details: errorData }, 
        { status: response.status }
      );
    }

    const transcriptionData = await response.json();
    
    if (!transcriptionData.success) {
      console.error('Transcription failed:', transcriptionData.error);
      return NextResponse.json(
        { error: 'Transcription failed', details: transcriptionData.error }, 
        { status: 500 }
      );
    }
    
    console.log(`Transcription successful. Updating recording ${recordingId} in database.`);
    
    // Update the recording in Supabase with transcription, sentiment, summary and topics data
    const updateSuccess = await updateRecordingTranscript(
      recordingId, 
      transcriptionData.transcript,
      transcriptionData.sentimentScore,
      transcriptionData.sentimentType,
      transcriptionData.summary,
      transcriptionData.topics
    );
    
    if (!updateSuccess) {
      console.error(`Failed to update recording ${recordingId} with transcription data`);
      return NextResponse.json(
        { error: 'Failed to update recording with transcription data' }, 
        { status: 500 }
      );
    }
    
    console.log(`Recording ${recordingId} updated successfully with transcription and analysis data`);
    
    return NextResponse.json({
      success: true,
      message: 'Recording processed successfully',
      transcript: transcriptionData.transcript,
      sentimentScore: transcriptionData.sentimentScore,
      sentimentType: transcriptionData.sentimentType,
      summary: transcriptionData.summary,
      topics: transcriptionData.topics
    });
  } catch (error) {
    console.error('Error processing recording:', error);
    return NextResponse.json(
      { error: 'Error processing recording', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 