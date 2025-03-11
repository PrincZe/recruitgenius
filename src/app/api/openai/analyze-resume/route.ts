import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { extractTextFromPdf } from '@/lib/utils/pdfUtils';
import { supabase } from '@/lib/supabase/supabaseClient';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert level string to number
 * Ensures that level values are stored as integers in the database
 */
const normalizeLevel = (level: any): number => {
  // Default level if missing
  if (level === undefined || level === null) return 4;
  
  // If already a number, ensure it's within valid range (1-10)
  if (typeof level === 'number') {
    return Math.min(Math.max(Math.round(level), 1), 10);
  }
  
  // Convert string levels to numbers
  const levelMap: Record<string, number> = {
    'Basic': 1,
    'Novice': 2,
    'Intermediate': 3,
    'Developing': 4,
    'Proficient': 5,
    'Advanced': 6,
    'Expert': 7,
    'Master': 8,
    'Distinguished': 9,
    'Exceptional': 10
  };
  
  // If the level is a string and in our map, use the mapped value
  if (typeof level === 'string' && level in levelMap) {
    return levelMap[level];
  }
  
  // Try to parse as integer if it's a numeric string
  if (typeof level === 'string' && !isNaN(Number(level))) {
    return Math.min(Math.max(Math.round(Number(level)), 1), 10);
  }
  
  // Default to mid-level (4) if we can't determine the level
  return 4;
};

export async function POST(req: NextRequest) {
  try {
    // Check if it's a FormData request with a file
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const jobDescription = formData.get('jobDescription') as string;

      if (!file || !jobDescription) {
        return new Response(
          JSON.stringify({
            error: 'File and job description are required'
          }),
          { status: 400 }
        );
      }

      // Extract text from PDF
      const text = await extractTextFromPdf(file);
      
      if (!text || text.startsWith('Error')) {
        console.error('Failed to extract text from resume:', text);
        
        // If text extraction failed but we have a fallback in text, use it
        if (text && (text.includes('RESUME METADATA (FALLBACK') || text.includes('WARNING: ACTUAL PDF TEXT EXTRACTION FAILED'))) {
          console.log('Using fallback metadata from resume since extraction failed');
        } else {
          return new Response(
            JSON.stringify({
              error: 'Failed to extract text from resume: ' + text,
            }),
            { status: 500 }
          );
        }
      }
      
      if (!jobDescription) {
        return new Response(
          JSON.stringify({ error: 'Job description is required' }),
          { status: 400 }
        );
      }

      // Continue with the analysis
      return await analyzeResumeWithOpenAI(text, jobDescription);
    } else {
      // Handle the old JSON format for backward compatibility
      const { resumeText, jobDescription } = await req.json();

      if (!resumeText || !jobDescription) {
        return NextResponse.json(
          { error: 'Resume text and job description are required' }, 
          { status: 400 }
        );
      }

      // Continue with the analysis
      return await analyzeResumeWithOpenAI(resumeText, jobDescription);
    }
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json(
      { error: 'Error analyzing resume', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

/**
 * Helper function to analyze resume text with OpenAI
 */
async function analyzeResumeWithOpenAI(resumeText: string, jobDescription: string) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OpenAI API key');
    return NextResponse.json(
      { error: 'OpenAI API key not configured' }, 
      { status: 500 }
    );
  }

  console.log(`Analyzing resume against job description (first 50 chars): "${jobDescription.substring(0, 50)}..."`);

  // Prepare prompt with the actual extracted resume text and job description
  const prompt = `
You are an AI recruiting assistant tasked with analyzing a candidate's resume against a job description.

# JOB DESCRIPTION
${jobDescription}

# RESUME CONTENT
${resumeText}

# ANALYSIS INSTRUCTIONS
1. Analyze the resume content provided against the job description
2. Provide an overall match score from 0-100
3. For each dimension, score from 0-10:
   - Ownership: Takes initiative and accountability
   - Organization Impact: Makes meaningful contributions that benefit the organization
   - Independence: Works well with minimal supervision
   - Strategic Alignment: Aligns work with company goals
   - Skills Match: Technical and soft skills match the requirements
4. Identify 3-5 key strengths based on the resume
5. Identify 2-3 development areas or missing skills
6. List the specific skills identified in the resume relevant to the position

Return your analysis as valid JSON with the following structure:
{
  "overallScore": number,
  "dimensions": {
    "ownership": { "score": number, "level": "string" },
    "organizationImpact": { "score": number, "level": "string" },
    "independence": { "score": number, "level": "string" },
    "strategicAlignment": { "score": number, "level": "string" },
    "skills": { "score": number, "level": "string" }
  },
  "analysis": {
    "summary": "string",
    "strengths": ["string"],
    "developmentAreas": ["string"],
    "matchedSkills": ["string"]
  }
}

Ensure the JSON is valid and properly formatted.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are an AI assistant that provides resume evaluations against job descriptions in valid JSON format." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const responseText = response.choices[0]?.message?.content || '';
  
  // Extract the JSON from the response
  let analysisData;
  try {
    // Try to parse the whole response as JSON
    analysisData = JSON.parse(responseText);
  } catch (e) {
    // If that fails, try to extract JSON using regex
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        analysisData = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.error('Failed to parse JSON from response:', e2);
        return NextResponse.json(
          { error: 'Failed to parse analysis results', rawResponse: responseText }, 
          { status: 500 }
        );
      }
    } else {
      console.error('No JSON found in response');
      return NextResponse.json(
        { error: 'No analysis results found', rawResponse: responseText }, 
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    analysis: analysisData
  });
} 