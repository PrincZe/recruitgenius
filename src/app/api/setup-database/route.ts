import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

interface TableStatus {
  exists: boolean;
  error: string | null;
}

interface StorageStatus {
  exists: boolean;
  error?: string | null;
}

interface SetupResults {
  success: boolean;
  tables: {
    questions: TableStatus;
    candidates: TableStatus;
    recordings: TableStatus;
    sessions: TableStatus;
  };
  storage: StorageStatus;
  error?: string;
}

export async function GET() {
  try {
    const results: SetupResults = {
      success: true,
      tables: {
        questions: { exists: false, error: null },
        candidates: { exists: false, error: null },
        recordings: { exists: false, error: null },
        sessions: { exists: false, error: null },
      },
      storage: { exists: false, error: null }
    };

    // Check if questions table exists
    const { error: questionsError } = await supabase.from('questions').select('count');
    results.tables.questions.exists = !questionsError;
    if (questionsError) {
      results.tables.questions.error = questionsError.message;
    }

    // Check if candidates table exists
    const { error: candidatesError } = await supabase.from('candidates').select('count');
    results.tables.candidates.exists = !candidatesError;
    if (candidatesError) {
      results.tables.candidates.error = candidatesError.message;
    }

    // Check if recordings table exists
    const { error: recordingsError } = await supabase.from('recordings').select('count');
    results.tables.recordings.exists = !recordingsError;
    if (recordingsError) {
      results.tables.recordings.error = recordingsError.message;
    }

    // Check if sessions table exists
    const { error: sessionsError } = await supabase.from('sessions').select('count');
    results.tables.sessions.exists = !sessionsError;
    if (sessionsError) {
      results.tables.sessions.error = sessionsError.message;
    }

    // Check if recordings bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      results.storage.error = bucketsError.message;
    } else {
      results.storage.exists = buckets?.some(bucket => bucket.name === 'recordings') || false;
    }

    // Overall success is true if all tables and storage exist
    results.success = 
      results.tables.questions.exists && 
      results.tables.candidates.exists && 
      results.tables.recordings.exists && 
      results.tables.sessions.exists &&
      results.storage.exists;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error checking database setup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        tables: {
          questions: { exists: false, error: null },
          candidates: { exists: false, error: null },
          recordings: { exists: false, error: null },
          sessions: { exists: false, error: null },
        },
        storage: { exists: false, error: null }
      } as SetupResults,
      { status: 500 }
    );
  }
} 