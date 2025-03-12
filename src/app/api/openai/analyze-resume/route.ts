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
  console.log("Resume analysis API called");
  
  try {
    // Check if it's a FormData request with a file
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const jobDescription = formData.get('jobDescription') as string;
      const resumeId = formData.get('resumeId') as string;
      const jobPostingId = formData.get('jobPostingId') as string;

      console.log("Received FormData request with file:", file?.name, "size:", file?.size);
      console.log("Resume ID:", resumeId, "Job Posting ID:", jobPostingId);

      if (!file || !jobDescription) {
        console.error("Missing required fields:", { hasFile: !!file, hasJobDescription: !!jobDescription });
        return new Response(
          JSON.stringify({
            error: 'File and job description are required'
          }),
          { status: 400 }
        );
      }

      // Extract text from PDF
      let text;
      try {
        text = await extractTextFromPdf(file);
        console.log(`Successfully extracted ${text.length} characters from PDF`);
      } catch (extractionError) {
        console.error("PDF extraction error:", extractionError);
        // Use a fallback approach
        text = `Filename: ${file.name}\nFile Size: ${file.size} bytes\n\nPDF extraction failed, but we'll analyze based on filename.`;
      }
      
      if (!text || text.length < 10) {
        console.error('Empty or very short text extracted from resume');
        text = `Filename: ${file.name}\nFile Size: ${file.size} bytes\n\nUnable to extract meaningful text.`;
      }
      
      if (!jobDescription) {
        console.error('Job description is missing');
        return new Response(
          JSON.stringify({ error: 'Job description is required' }),
          { status: 400 }
        );
      }

      // Continue with the analysis
      console.log("Starting OpenAI analysis");
      const analysisData = await analyzeResumeWithOpenAI(text, jobDescription);
      
      // Add the resumeId and jobPostingId to the response data
      if (resumeId && jobPostingId) {
        // Create a response with the augmented data
        return NextResponse.json({
          success: true,
          analysis: {
            ...analysisData,
            resumeId,
            jobPostingId
          }
        });
      }
      
      // Return the original analysis data
      return NextResponse.json({
        success: true,
        analysis: analysisData
      });
    } else {
      // Handle the old JSON format for backward compatibility
      console.log("Received JSON request");
      
      const body = await req.json();
      const { resumeText, jobDescription, resumeId, jobPostingId } = body;

      if (!resumeText || !jobDescription) {
        console.error("Missing required fields in JSON format");
        return NextResponse.json(
          { error: 'Resume text and job description are required' }, 
          { status: 400 }
        );
      }

      // Continue with the analysis
      console.log("Starting OpenAI analysis with JSON data");
      const analysisData = await analyzeResumeWithOpenAI(resumeText, jobDescription);
      
      // Add the resumeId and jobPostingId to the response data
      if (resumeId && jobPostingId) {
        return NextResponse.json({
          success: true,
          analysis: {
            ...analysisData,
            resumeId,
            jobPostingId
          }
        });
      }
      
      // Return the original analysis data
      return NextResponse.json({
        success: true,
        analysis: analysisData
      });
    }
  } catch (error) {
    console.error('Error in resume analysis API:', error);
    // Return a fallback analysis
    return NextResponse.json({
      success: true,
      analysis: createFallbackAnalysis(`API error: ${error instanceof Error ? error.message : String(error)}`)
    });
  }
}

/**
 * Helper function to analyze resume text with OpenAI
 * Returns the analysis data directly (not a Response object)
 */
async function analyzeResumeWithOpenAI(resumeText: string, jobDescription: string) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OpenAI API key');
    return createFallbackAnalysis('OpenAI API key not configured');
  }

  console.log(`Analyzing resume against job description (first 50 chars): "${jobDescription.substring(0, 50)}..."`);
  console.log(`Resume content first 100 chars: "${resumeText.substring(0, 100).replace(/\n/g, ' ')}..."`);

  try {
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
    
    // Add detailed response logging
    console.log("Raw OpenAI response text:", responseText.slice(0, 200) + "..."); // Show first 200 chars

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
          // Return a fallback analysis instead of error
          return createFallbackAnalysis("Failed to parse analysis results");
        }
      } else {
        console.error('No JSON found in response');
        // Return a fallback analysis instead of error
        return createFallbackAnalysis("No analysis results found");
      }
    }

    // After parsing the analysisData, add:
    console.log("Parsed analysis data structure:", {
      hasOverallScore: 'overallScore' in analysisData,
      hasDimensions: 'dimensions' in analysisData,
      hasAnalysis: 'analysis' in analysisData,
      topLevelKeys: Object.keys(analysisData),
      summary: analysisData.analysis?.summary?.substring(0, 100) + "..." || "No summary"
    });

    // Ensure the analysis has the correct structure
    return ensureValidAnalysisStructure(analysisData);
  } catch (error) {
    console.error('Error during OpenAI analysis:', error);
    // Return a fallback analysis instead of error
    return createFallbackAnalysis(`Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a fallback analysis result when OpenAI fails
 */
function createFallbackAnalysis(errorMessage: string) {
  console.log("Creating fallback analysis with message:", errorMessage);
  
  return {
    overallScore: 50,
    dimensions: {
      ownership: { score: 5, level: "Proficient" },
      organizationImpact: { score: 5, level: "Proficient" },
      independence: { score: 5, level: "Proficient" },
      strategicAlignment: { score: 5, level: "Proficient" },
      skills: { score: 5, level: "Proficient" }
    },
    analysis: {
      summary: `${errorMessage}. Using fallback evaluation.`,
      strengths: ["Technical experience", "Education background", "Communication skills"],
      developmentAreas: ["Could not perform detailed analysis", "Using fallback evaluation"],
      matchedSkills: ["JavaScript", "TypeScript", "React", "Node.js"]
    }
  };
}

/**
 * Ensures the analysis data has the correct structure
 */
function ensureValidAnalysisStructure(data: any) {
  // If data is completely empty or invalid, return the fallback
  if (!data || typeof data !== 'object') {
    return createFallbackAnalysis('Invalid analysis data structure');
  }
  
  // Create a validated copy with default values for missing fields
  const validated = {
    overallScore: typeof data.overallScore === 'number' ? data.overallScore : 50,
    dimensions: {
      ownership: data.dimensions?.ownership || { score: 5, level: "Proficient" },
      organizationImpact: data.dimensions?.organizationImpact || { score: 5, level: "Proficient" },
      independence: data.dimensions?.independence || { score: 5, level: "Proficient" },
      strategicAlignment: data.dimensions?.strategicAlignment || { score: 5, level: "Proficient" },
      skills: data.dimensions?.skills || { score: 5, level: "Proficient" }
    },
    analysis: {
      summary: data.analysis?.summary || "No summary available",
      strengths: Array.isArray(data.analysis?.strengths) ? data.analysis.strengths : ["No strengths data available"],
      developmentAreas: Array.isArray(data.analysis?.developmentAreas) ? data.analysis.developmentAreas : ["No development areas data available"],
      matchedSkills: Array.isArray(data.analysis?.matchedSkills) ? data.analysis.matchedSkills : ["No matched skills data available"]
    }
  };
  
  return validated;
} 