import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

// Sample interview questions across different categories
const sampleQuestions = [
  {
    text: "Tell me about yourself and your background.",
    category: "Introduction"
  },
  {
    text: "What are your greatest strengths?",
    category: "Personal Assessment"
  },
  {
    text: "What do you consider to be your weaknesses?",
    category: "Personal Assessment"
  },
  {
    text: "Why are you interested in working for our company?",
    category: "Company Knowledge"
  },
  {
    text: "Describe a challenging work situation and how you overcame it.",
    category: "Problem Solving"
  },
  {
    text: "Where do you see yourself in five years?",
    category: "Career Goals"
  },
  {
    text: "How do you handle stress and pressure?",
    category: "Work Style"
  },
  {
    text: "Describe your ideal work environment.",
    category: "Work Style"
  },
  {
    text: "What is your greatest professional achievement?",
    category: "Experience"
  },
  {
    text: "How do you prioritize your work?",
    category: "Work Style"
  }
];

export async function GET() {
  try {
    // Check if questions already exist
    const { data: existingQuestions, error: checkError } = await supabase
      .from('questions')
      .select('count');
    
    if (checkError) {
      return NextResponse.json({
        success: false,
        error: `Error checking existing questions: ${checkError.message}`
      }, { status: 500 });
    }
    
    // If questions already exist, return a message
    if (existingQuestions && existingQuestions[0]?.count > 0) {
      return NextResponse.json({
        success: true,
        message: `Database already has ${existingQuestions[0].count} questions. No new questions added.`,
        questionsCount: existingQuestions[0].count
      });
    }
    
    // Insert sample questions
    const { data, error } = await supabase
      .from('questions')
      .insert(sampleQuestions)
      .select();
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: `Error seeding questions: ${error.message}`
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully added ${data.length} sample questions to the database.`,
      questions: data
    });
  } catch (error) {
    console.error('Error in seed-questions route:', error);
    return NextResponse.json({
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
} 