import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

export async function GET() {
  try {
    // Test database connection
    const dbTest = await testDatabase();
    
    // Test storage connection
    const storageTest = await testStorage();
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      tests: {
        database: dbTest,
        storage: storageTest
      }
    });
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase connection test failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

async function testDatabase() {
  try {
    // Test if we can query the database - fetch up to 5 questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .limit(5);
    
    if (questionsError) {
      throw new Error(`Questions table error: ${questionsError.message}`);
    }
    
    // Try to query candidates table
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .limit(3);
      
    // Note: This might fail if the table doesn't exist yet, which is okay for initial setup
    
    return {
      success: true,
      questionsTable: {
        exists: true,
        count: questions ? questions.length : 0,
        sample: questions && questions.length > 0 ? questions : null
      },
      candidatesTable: {
        exists: !candidatesError,
        error: candidatesError ? candidatesError.message : null,
        count: candidates ? candidates.length : 0,
        sample: candidates && candidates.length > 0 ? candidates : null
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testStorage() {
  try {
    // Test if we can list buckets
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      throw new Error(`Storage error: ${bucketsError.message}`);
    }
    
    // Check if recordings bucket exists
    const recordingsBucket = buckets ? buckets.find(bucket => bucket.name === 'recordings') : null;
    
    return {
      success: true,
      buckets: {
        count: buckets ? buckets.length : 0,
        names: buckets ? buckets.map(b => b.name) : []
      },
      recordingsBucket: {
        exists: !!recordingsBucket,
        details: recordingsBucket || null
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 