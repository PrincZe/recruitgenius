import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';
import { extractTextFromPdf } from '@/lib/utils/pdfUtils';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { resumeId, jobPostingId } = await req.json();

    if (!resumeId || !jobPostingId) {
      return NextResponse.json(
        { error: 'Resume ID and Job Posting ID are required' }, 
        { status: 400 }
      );
    }

    console.log(`Re-analyzing resume ${resumeId} for job ${jobPostingId}`);

    // 1. Get resume and job posting from Supabase
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (resumeError) {
      console.error('Error fetching resume:', resumeError);
      return NextResponse.json(
        { error: `Failed to fetch resume: ${resumeError.message}` }, 
        { status: 500 }
      );
    }

    if (!resume) {
      return NextResponse.json(
        { error: `Resume not found with ID: ${resumeId}` }, 
        { status: 404 }
      );
    }

    const { data: jobPosting, error: jobPostingError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', jobPostingId)
      .single();
    
    if (jobPostingError) {
      console.error('Error fetching job posting:', jobPostingError);
      return NextResponse.json(
        { error: `Failed to fetch job posting: ${jobPostingError.message}` }, 
        { status: 500 }
      );
    }

    if (!jobPosting) {
      return NextResponse.json(
        { error: `Job posting not found with ID: ${jobPostingId}` }, 
        { status: 404 }
      );
    }

    // 2. Fetch the PDF file from Supabase Storage
    const fileUrl = resume.file_url;
    const fileName = resume.file_name || 'resume.pdf';
    
    if (!fileUrl) {
      return NextResponse.json(
        { error: 'No file URL found for this resume' }, 
        { status: 400 }
      );
    }

    try {
      // Download the file
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      // Convert to blob and file
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'application/pdf' });
      
      // 3. Extract text from the PDF
      console.log(`Attempting to extract text from resume PDF: ${fileName}`);
      const resumeText = await extractTextFromPdf(file);
      
      if (!resumeText || resumeText.startsWith('Error')) {
        console.error('Failed to extract text from resume:', resumeText);
        
        // If text extraction failed but we have a fallback in resumeText, use it
        if (resumeText.includes('RESUME METADATA (FALLBACK') || resumeText.includes('WARNING: ACTUAL PDF TEXT EXTRACTION FAILED')) {
          console.log('Using fallback metadata from resume since extraction failed');
        } else {
          return NextResponse.json(
            { error: `Failed to extract text from resume: ${resumeText}` }, 
            { status: 500 }
          );
        }
      }
      
      // 4. Analyze the resume text with OpenAI
      const jobDescription = jobPosting.description;
      const analysis = await analyzeResumeWithOpenAI(resumeText, jobDescription);
      const analysisData = analysis.analysis;
      
      if (!analysisData) {
        return NextResponse.json(
          { error: 'Failed to analyze resume content' }, 
          { status: 500 }
        );
      }
      
      // 5. Normalize scores and update the database
      // Ensure overallScore is between 0-100
      const normalizedScore = typeof analysisData.overallScore === 'number' 
        ? Math.min(Math.max(analysisData.overallScore, 0), 100) 
        : 0;
      
      // Normalize dimension scores to 0-10 scale
      const normalizeScore = (score: number | undefined) => {
        if (typeof score !== 'number' || isNaN(score)) return 0;
        
        // If score is already between 0-10, use it as is
        if (score >= 0 && score <= 10) return score;
        
        // If score is between 0-5, multiply by 2 to get 0-10 scale
        if (score >= 0 && score <= 5) return score * 2;
        
        // If score is between 0-100, divide by 10 to get 0-10 scale
        if (score >= 0 && score <= 100) return score / 10;
        
        // Default fallback
        return Math.min(Math.max(score, 0), 10);
      };
      
      // Convert level string to number if needed
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
      
      // Update or create the resume evaluation record
      const { data: existingEvaluation, error: evalError } = await supabase
        .from('resume_evaluations')
        .select('id, selected_for_interview')
        .eq('resume_id', resumeId)
        .eq('job_posting_id', jobPostingId)
        .maybeSingle();
      
      const evaluationData = {
        resume_id: resumeId,
        job_posting_id: jobPostingId,
        overall_score: normalizedScore,
        ownership_score: normalizeScore(analysisData.dimensions?.ownership?.score),
        organization_impact_score: normalizeScore(analysisData.dimensions?.organizationImpact?.score),
        independence_score: normalizeScore(analysisData.dimensions?.independence?.score),
        strategic_alignment_score: normalizeScore(analysisData.dimensions?.strategicAlignment?.score),
        ownership_level: normalizeLevel(analysisData.dimensions?.ownership?.level),
        organization_impact_level: normalizeLevel(analysisData.dimensions?.organizationImpact?.level),
        independence_level: normalizeLevel(analysisData.dimensions?.independence?.level),
        strategic_alignment_level: normalizeLevel(analysisData.dimensions?.strategicAlignment?.level),
        analysis_json: analysisData,
        selected_for_interview: existingEvaluation?.selected_for_interview || false
      };
      
      let updateResult;
      
      if (existingEvaluation) {
        // Update existing evaluation
        updateResult = await supabase
          .from('resume_evaluations')
          .update(evaluationData)
          .eq('id', existingEvaluation.id)
          .select();
      } else {
        // Create new evaluation
        updateResult = await supabase
          .from('resume_evaluations')
          .insert([evaluationData])
          .select();
      }
      
      if (updateResult.error) {
        console.error('Error updating resume evaluation:', updateResult.error);
        return NextResponse.json(
          { error: `Failed to save analysis: ${updateResult.error.message}` }, 
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Resume successfully re-analyzed',
        evaluation: updateResult.data[0]
      });
      
    } catch (error: any) {
      console.error('Error processing resume:', error);
      return NextResponse.json(
        { error: `Error processing resume: ${error.message || 'Unknown error'}` }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

/**
 * Helper function to analyze resume text with OpenAI
 */
async function analyzeResumeWithOpenAI(resumeText: string, jobDescription: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OpenAI API key');
  }

  console.log(`Analyzing resume against job description (first 50 chars): "${jobDescription.substring(0, 50)}..."`);
  console.log(`Resume content first 100 chars: "${resumeText.substring(0, 100).replace(/\n/g, ' ')}..."`);

  // Prepare prompt with the actual extracted resume text and job description
  const prompt = `
You are an AI recruiting assistant that excels at analyzing resumes against job descriptions.

# JOB DESCRIPTION
${jobDescription}

# RESUME CONTENT
${resumeText}

# ANALYSIS INSTRUCTIONS
1. Carefully analyze the resume content provided against the job description
2. Provide an overall match score from 0-100, be accurate and realistic in your scoring
3. For each dimension, score from 0-10:
   - Ownership: Takes initiative and accountability
   - Organization Impact: Makes meaningful contributions that benefit the organization
   - Independence: Works well with minimal supervision
   - Strategic Alignment: Aligns work with company goals
   - Skills Match: Technical and soft skills match the requirements
4. Write a factual, objective summary of the candidate's key qualifications
5. Identify 3-5 key strengths based on the ACTUAL resume content (not generic statements)
6. Identify 2-3 development areas or missing skills
7. List the specific skills identified in the resume relevant to the position

IMPORTANT: Your analysis must be ACCURATE and based ONLY on the resume content provided. Do NOT make up information or qualifications that aren't present in the resume.

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
    model: "gpt-3.5-turbo-1106", // Use a JSON mode capable model
    messages: [
      { role: "system", content: "You are an AI assistant that provides resume evaluations against job descriptions. Your evaluations are accurate, factual, and based strictly on the resume content provided." },
      { role: "user", content: prompt }
    ],
    temperature: 0.5, // Lower temperature for more consistent, factual responses
    max_tokens: 1500,
    response_format: { type: "json_object" }, // Ensure JSON response
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
        throw new Error('Failed to parse analysis results');
      }
    } else {
      console.error('No JSON found in response');
      throw new Error('No analysis results found');
    }
  }

  return {
    success: true,
    analysis: analysisData
  };
} 