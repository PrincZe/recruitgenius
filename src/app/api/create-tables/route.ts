import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

interface TableStatus {
  created: boolean;
  exists: boolean;
  error: string | null;
}

interface StorageStatus {
  created: boolean;
  exists: boolean;
  error: string | null;
}

interface CreateTablesResult {
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
    const results: CreateTablesResult = {
      success: true,
      tables: {
        questions: { created: false, exists: false, error: null },
        candidates: { created: false, exists: false, error: null },
        recordings: { created: false, exists: false, error: null },
        sessions: { created: false, exists: false, error: null }
      },
      storage: { created: false, exists: false, error: null }
    };

    // Check if questions table exists
    const { error: questionsCheckError } = await supabase
      .from('questions')
      .select('count')
      .limit(1);
    
    results.tables.questions.exists = !questionsCheckError;
    
    // Create questions table if it doesn't exist
    if (questionsCheckError) {
      // Try to create the table using SQL
      try {
        // Note: Supabase JS client doesn't have direct SQL execution
        // We'll use the REST API instead via a custom function
        const { data, error } = await supabase.functions.invoke('create-questions-table');
        
        if (error) {
          results.tables.questions.error = error.message;
        } else {
          results.tables.questions.created = true;
        }
      } catch (err) {
        results.tables.questions.error = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Check if candidates table exists
    const { error: candidatesCheckError } = await supabase
      .from('candidates')
      .select('count')
      .limit(1);
    
    results.tables.candidates.exists = !candidatesCheckError;
    
    // Create candidates table if it doesn't exist
    if (candidatesCheckError) {
      try {
        const { data, error } = await supabase.functions.invoke('create-candidates-table');
        
        if (error) {
          results.tables.candidates.error = error.message;
        } else {
          results.tables.candidates.created = true;
        }
      } catch (err) {
        results.tables.candidates.error = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Check if recordings table exists
    const { error: recordingsCheckError } = await supabase
      .from('recordings')
      .select('count')
      .limit(1);
    
    results.tables.recordings.exists = !recordingsCheckError;
    
    // Create recordings table if it doesn't exist
    if (recordingsCheckError) {
      try {
        const { data, error } = await supabase.functions.invoke('create-recordings-table');
        
        if (error) {
          results.tables.recordings.error = error.message;
        } else {
          results.tables.recordings.created = true;
        }
      } catch (err) {
        results.tables.recordings.error = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Check if sessions table exists
    const { error: sessionsCheckError } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    results.tables.sessions.exists = !sessionsCheckError;
    
    // Create sessions table if it doesn't exist
    if (sessionsCheckError) {
      try {
        const { data, error } = await supabase.functions.invoke('create-sessions-table');
        
        if (error) {
          results.tables.sessions.error = error.message;
        } else {
          results.tables.sessions.created = true;
        }
      } catch (err) {
        results.tables.sessions.error = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Check if recordings bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      results.storage.error = bucketsError.message;
    } else {
      const recordingsBucketExists = buckets?.some(bucket => bucket.name === 'recordings');
      results.storage.exists = recordingsBucketExists;
      
      // Create recordings bucket if it doesn't exist
      if (!recordingsBucketExists) {
        const { error: createBucketError } = await supabase.storage.createBucket('recordings', {
          public: false
        });
        
        if (createBucketError) {
          results.storage.error = createBucketError.message;
        } else {
          results.storage.created = true;
        }
      }
    }

    // Overall success is true if all tables and storage exist or were created
    results.success = 
      (results.tables.questions.exists || results.tables.questions.created) && 
      (results.tables.candidates.exists || results.tables.candidates.created) && 
      (results.tables.recordings.exists || results.tables.recordings.created) && 
      (results.tables.sessions.exists || results.tables.sessions.created) &&
      (results.storage.exists || results.storage.created);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error creating tables:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 