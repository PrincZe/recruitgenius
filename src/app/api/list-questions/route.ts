import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

export async function GET() {
  try {
    // Fetch all questions without limit
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      count: questions?.length || 0,
      questions: questions || []
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch questions',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 