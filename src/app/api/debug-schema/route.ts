import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

export async function GET() {
  try {
    // Get table information for questions table
    const { data: questionsInfo, error: questionsError } = await supabase.rpc(
      'get_table_info',
      { table_name: 'questions' }
    );

    // Get raw data from questions table
    const { data: questions, error: questionsDataError } = await supabase
      .from('questions')
      .select('*')
      .limit(3);

    // Check if the created_at column exists and its format
    let createdAtFormat = null;
    if (questions && questions.length > 0) {
      const firstQuestion = questions[0];
      if (firstQuestion.created_at) {
        createdAtFormat = {
          value: firstQuestion.created_at,
          type: typeof firstQuestion.created_at,
          isDate: firstQuestion.created_at instanceof Date,
          asString: String(firstQuestion.created_at),
          parsed: new Date(firstQuestion.created_at).toISOString()
        };
      }
    }

    return NextResponse.json({
      success: true,
      schema: {
        questions: {
          info: questionsInfo || null,
          error: questionsError ? questionsError.message : null
        }
      },
      sampleData: {
        questions: questions || [],
        error: questionsDataError ? questionsDataError.message : null
      },
      createdAtFormat,
      columnNames: questions && questions.length > 0 
        ? Object.keys(questions[0]) 
        : []
    });
  } catch (error) {
    console.error('Error debugging schema:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to debug schema',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 