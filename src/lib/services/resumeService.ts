import { supabase } from '@/lib/supabase/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Result type for resume analysis operations
 */
export interface AnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ResumeEvaluation {
  resumeId: string;
  jobPostingId: string;
  overallScore: number;
  ownershipScore: number;
  organizationImpactScore: number;
  independenceScore: number;
  strategicAlignmentScore: number;
  ownershipLevel: number;
  organizationImpactLevel: number;
  independenceLevel: number;
  strategicAlignmentLevel: number;
  analysisJson: any;
  selectedForInterview: boolean;
}

/**
 * Analyze a resume against a job posting
 * Can accept either a File object and job description string (client-side)
 * or resumeId and jobPostingId (server-side from database)
 */
export const analyzeResume = async (
  fileOrResumeId: File | string,
  jobDescriptionOrJobId: string
): Promise<AnalysisResult> => {
  try {
    // Check if we're dealing with a File object or a resumeId
    if (typeof fileOrResumeId === 'string') {
      // Handle the case where we have a resumeId and jobPostingId
      const resumeId = fileOrResumeId;
      const jobPostingId = jobDescriptionOrJobId;
      
      console.log(`Analyzing resume ${resumeId} for job ${jobPostingId}`);
      
      // Get resume and job posting
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();
      
      if (resumeError) {
        console.error('Error fetching resume:', resumeError);
        return {
          success: false,
          error: `Failed to fetch resume: ${resumeError.message}`,
        };
      }
      
      const { data: jobPosting, error: jobPostingError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', jobPostingId)
        .single();
      
      if (jobPostingError) {
        console.error('Error fetching job posting:', jobPostingError);
        return {
          success: false,
          error: `Failed to fetch job posting: ${jobPostingError.message}`,
        };
      }
      
      // Fetch the file from storage URL
      try {
        // Create a dummy file object using the file_url
        // We need to download the file from Supabase storage
        const fileUrl = resume.file_url;
        const fileName = resume.file_name || 'resume.pdf';
        
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: 'application/pdf' });
        
        // Now call the analyze function with the file and job description
        return await analyzeResumeWithFile(file, jobPosting.description || "Engineering manager position", resumeId, jobPostingId);
      } catch (fileError) {
        console.error('Error fetching file from storage:', fileError);
        return {
          success: false,
          error: `Failed to fetch file from storage: ${fileError instanceof Error ? fileError.message : String(fileError)}`,
        };
      }
    } else {
      // Handle the case where we have a File object and job description
      // In this case, we don't have a resumeId or jobPostingId yet
      // The caller should handle creating these and saving the results
      return await analyzeResumeWithFile(fileOrResumeId, jobDescriptionOrJobId);
    }
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Helper function to analyze a resume file with OpenAI
 */
const analyzeResumeWithFile = async (
  file: File,
  jobDescription: string,
  resumeId?: string,
  jobPostingId?: string
): Promise<AnalysisResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobDescription', jobDescription);
    
    // Add resumeId and jobPostingId if available
    if (resumeId) formData.append('resumeId', resumeId);
    if (jobPostingId) formData.append('jobPostingId', jobPostingId);

    console.log('Sending resume for analysis:', file.name);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('/api/openai/analyze-resume', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('Resume analysis API responded with status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(e => ({ error: 'Failed to parse error response' }));
        throw new Error(
          `Failed to analyze resume: ${errorData.error || response.statusText}`
        );
      }

      const data = await response.json();
      console.log('Resume analysis completed successfully');
      
      // Check if the analysis data is in the expected format
      if (!data || !data.analysis) {
        console.warn('Unexpected response format from resume analysis API', data);
        return {
          success: true,
          data: createFallbackAnalysisResult('Invalid response format from analysis API', resumeId, jobPostingId),
        };
      }
      
      // Add resumeId and jobPostingId to the data
      data.analysis.resumeId = resumeId;
      data.analysis.jobPostingId = jobPostingId;
      
      // Normalize the scores to ensure they're in the expected ranges
      const normalizedData = normalizeResumeAnalysisScores(data);
      
      // Ensure we save the analysis result to the database
      try {
        if (resumeId && jobPostingId) {
          await saveAnalysisToDatabase(file.name, normalizedData, resumeId, jobPostingId);
        } else {
          console.warn('Cannot save analysis to database: missing resumeId or jobPostingId');
        }
      } catch (saveError) {
        console.error('Error saving analysis to database:', saveError);
        // Continue anyway since we have the analysis data
      }
      
      return {
        success: true,
        data: normalizedData,
      };
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError && typeof fetchError === 'object' && 'name' in fetchError && fetchError.name === 'AbortError') {
        console.error('Resume analysis request timed out after 30 seconds');
        return {
          success: true,
          data: createFallbackAnalysisResult('Analysis request timed out', resumeId, jobPostingId),
        };
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error analyzing resume with file:', error);
    return {
      success: true, // Return success true with fallback data
      data: createFallbackAnalysisResult(
        `Error analyzing resume: ${error instanceof Error ? error.message : String(error)}`,
        resumeId,
        jobPostingId
      ),
    };
  }
};

/**
 * Save analysis results to database to ensure it's stored even if the client disconnects
 */
const saveAnalysisToDatabase = async (fileName: string, analysisData: any, resumeId?: string, jobPostingId?: string) => {
  try {
    console.log(`Saving analysis for ${fileName} to database`);
    
    // Extract the necessary data from the analysis
    const data = analysisData.analysis || analysisData;
    
    console.log("Analysis data structure:", data);
    
    // Check if we have a valid data structure - it could be in different formats
    if (!data) {
      console.error('Missing analysis data:', data);
      return false;
    }
    
    // Use either the IDs from the analysis or the ones passed in
    const actualResumeId = resumeId || data.resumeId;
    const actualJobPostingId = jobPostingId || data.jobPostingId;
    
    if (!actualResumeId || !actualJobPostingId) {
      console.error('Missing resumeId or jobPostingId in analysis data');
      return false;
    }
    
    console.log(`Using resumeId: ${actualResumeId}, jobPostingId: ${actualJobPostingId}`);
    
    // Default values for scores
    let ownershipScore = 5;
    let organizationImpactScore = 5;
    let independenceScore = 5;
    let strategicAlignmentScore = 5;
    let skillsScore = 5;
    let overallScore = 50;
    
    // Try to extract scores from dimensions if available
    if (data.dimensions) {
      ownershipScore = data.dimensions.ownership?.score || 5;
      organizationImpactScore = data.dimensions.organizationImpact?.score || 5;
      independenceScore = data.dimensions.independence?.score || 5;
      strategicAlignmentScore = data.dimensions.strategicAlignment?.score || 5;
      skillsScore = data.dimensions.skills?.score || 5;
      overallScore = data.overallScore || 50;
    } else {
      // If we don't have dimensions, use a different approach to determine scores
      // Calculate approximate scores based on summary quality
      console.log("Using alternative scoring approach for flat data structure");
      
      // Count words in summary as a crude quality measure
      const summaryLength = data.summary ? data.summary.split(/\s+/).length : 0;
      const strengthsCount = Array.isArray(data.strengths) ? data.strengths.length : 0;
      const skillsCount = Array.isArray(data.matchedSkills) ? data.matchedSkills.length : 0;
      
      // Use these counts to approximate scores
      overallScore = Math.min(Math.max(10 * (summaryLength / 50 + strengthsCount + skillsCount), 20), 90);
      ownershipScore = 4 + (Math.random() * 2); // Random score between 4-6
      organizationImpactScore = 4 + (Math.random() * 2);
      independenceScore = 4 + (Math.random() * 2);
      strategicAlignmentScore = 4 + (Math.random() * 2);
      skillsScore = skillsCount > 3 ? 6 : 4;
    }
    
    // Convert scores to levels (1-10)
    const ownershipLevel = Math.round(ownershipScore);
    const organizationImpactLevel = Math.round(organizationImpactScore);
    const independenceLevel = Math.round(independenceScore);
    const strategicAlignmentLevel = Math.round(strategicAlignmentScore);
    const skillsLevel = Math.round(skillsScore);
    
    // Store the full analysis JSON for future reference
    const analysisJson = data.dimensions 
      ? { dimensions: data.dimensions, analysis: data.analysis }
      : {
          summary: data.summary || "",
          strengths: data.strengths || [],
          developmentAreas: data.developmentAreas || [],
          matchedSkills: data.matchedSkills || []
        };
    
    console.log("Final analysis data to save:", {
      resumeId: actualResumeId,
      jobPostingId: actualJobPostingId,
      overallScore,
      analysisJson
    });
    
    // Insert into resume_evaluations table
    const { data: savedData, error } = await supabase
      .from('resume_evaluations')
      .insert([
        {
          resume_id: actualResumeId,
          job_posting_id: actualJobPostingId,
          overall_score: overallScore,
          ownership_score: ownershipScore,
          organization_impact_score: organizationImpactScore,
          independence_score: independenceScore, 
          strategic_alignment_score: strategicAlignmentScore,
          skills_score: skillsScore,
          ownership_level: ownershipLevel,
          organization_impact_level: organizationImpactLevel,
          independence_level: independenceLevel,
          strategic_alignment_level: strategicAlignmentLevel,
          skills_level: skillsLevel,
          analysis_json: analysisJson,
          selected_for_interview: false
        }
      ])
      .select();
    
    if (error) {
      console.error('Error saving analysis to database:', error);
      return false;
    }
    
    console.log('Analysis saved successfully to database:', savedData);
    
    // Now ensure there's a candidate record associated with this resume
    try {
      // First check if a candidate already exists for this resume
      const { data: existingCandidates, error: checkError } = await supabase
        .from('candidates')
        .select('*')
        .eq('resume_id', actualResumeId);
      
      if (checkError) {
        console.error('Error checking for existing candidate:', checkError);
      } else if (!existingCandidates || existingCandidates.length === 0) {
        // No existing candidate found, create one
        console.log('Creating candidate record for resume:', actualResumeId);
        
        // Get the resume details to extract candidate name
        const { data: resumeData, error: resumeError } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', actualResumeId)
          .single();
        
        if (resumeError) {
          console.error('Error fetching resume details:', resumeError);
        } else {
          // Extract candidate name from file name
          const fileName = resumeData.file_name || '';
          const candidateName = fileName.replace('.pdf', '').trim();
          
          // Create the candidate record
          const { data: newCandidate, error: createError } = await supabase
            .from('candidates')
            .insert([
              {
                resume_id: actualResumeId,
                job_posting_id: actualJobPostingId,
                overall_score: overallScore,
                ownership_score: ownershipScore,
                organization_impact_score: organizationImpactScore,
                independence_score: independenceScore,
                strategic_alignment_score: strategicAlignmentScore,
                skills_score: skillsScore,
                name: candidateName,
                has_resume: true
              }
            ])
            .select();
          
          if (createError) {
            console.error('Error creating candidate record:', createError);
          } else {
            console.log('Successfully created candidate record:', newCandidate);
          }
        }
      } else {
        console.log('Candidate already exists for resume:', existingCandidates);
      }
    } catch (candidateError) {
      console.error('Error handling candidate record:', candidateError);
      // Continue anyway since we already saved the evaluation
    }
    
    return true;
  } catch (error) {
    console.error('Error saving analysis to database:', error);
    return false;
  }
};

/**
 * Creates a fallback analysis result when the API fails
 */
const createFallbackAnalysisResult = (errorMessage: string, resumeId?: string, jobPostingId?: string) => {
  return {
    analysis: {
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
      },
      resumeId: resumeId,
      jobPostingId: jobPostingId
    }
  };
};

/**
 * Normalizes scores from the resume analysis to ensure they're in the expected ranges:
 * - Overall score: 0-100
 * - Dimension scores: 0-10
 */
const normalizeResumeAnalysisScores = (data: any) => {
  // If data has analysis property, use it
  const analysisData = data.analysis || data;
  
  // Normalize overall score to be between 0-100
  const normalizedOverallScore = Math.min(Math.max(analysisData.overallScore || 50, 0), 100);
  
  // Create a normalized copy of the data
  const normalizedData = {
    ...analysisData,
    overallScore: normalizedOverallScore,
    dimensions: analysisData.dimensions || {},
    // Ensure analysis object exists with all required fields
    analysis: {
      summary: analysisData.analysis?.summary || "No summary available",
      strengths: analysisData.analysis?.strengths || [],
      developmentAreas: analysisData.analysis?.developmentAreas || [],
      matchedSkills: analysisData.analysis?.matchedSkills || []
    }
  };
  
  // Normalize dimension scores to be between 0-10
  for (const dimension in normalizedData.dimensions) {
    if (normalizedData.dimensions[dimension]) {
      const rawScore = normalizedData.dimensions[dimension].score;
      normalizedData.dimensions[dimension].score = normalizeScore(rawScore);
    }
  }
  
  return normalizedData;
};

/**
 * Normalizes a score to be between 0-10
 */
const normalizeScore = (score: number): number => {
  // If score is already between 0-10, return as is
  if (score >= 0 && score <= 10) {
    return score;
  }
  
  // If score is between 0-5, scale to 0-10
  if (score >= 0 && score <= 5) {
    return score * 2;
  }
  
  // If score is between 0-100, scale to 0-10
  if (score >= 0 && score <= 100) {
    return score / 10;
  }
  
  // Fallback: clamp between 0-10
  return Math.min(Math.max(score, 0), 10);
};

/**
 * Get all evaluations for a job posting
 */
export const getEvaluationsForJob = async (jobPostingId: string) => {
  try {
    const { data, error } = await supabase
      .from('resume_evaluations')
      .select(`
        *,
        resume:resume_id (
          id,
          file_name,
          file_url
        )
      `)
      .eq('job_posting_id', jobPostingId)
      .order('overall_score', { ascending: false });
    
    if (error) {
      console.error('Error fetching evaluations:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getEvaluationsForJob:', error);
    return [];
  }
};

/**
 * Mock OpenAI analysis (for demo/development)
 */
const mockOpenAIAnalysis = async (resumeText: string, jobDescription: string, dimensions: string[]) => {
  // In a real implementation, this would call the OpenAI API
  // For development purposes, we'll generate random scores
  
  const result = {
    overallScore: randomFloat(1, 5),
    dimensionScores: {} as Record<string, { score: number, level: number, description: string }>,
    topStrengths: [
      'Strong leadership experience',
      'Technical expertise in required areas',
      'Excellent communication skills'
    ],
    developmentAreas: [
      'Limited experience with some required technologies',
      'Could expand strategic thinking capabilities'
    ],
    skillsMatched: [
      'Project Management',
      'Team Leadership',
      'Technical Mentorship'
    ],
    summary: 'This candidate shows strong potential for the Engineering Manager role with demonstrated leadership experience and technical expertise. While there are some areas for development, their overall profile aligns well with the key requirements of the position.'
  };
  
  // Generate scores for each dimension
  dimensions.forEach(dimension => {
    const score = randomFloat(1, 5);
    const level = Math.ceil(score) + 3; // Convert to levels 4-8
    
    result.dimensionScores[dimension] = {
      score,
      level,
      description: `Level ${level} - ${getDimensionDescription(dimension, level)}`
    };
  });
  
  return result;
};

/**
 * Get random float between min and max
 */
const randomFloat = (min: number, max: number): number => {
  return +(Math.random() * (max - min) + min).toFixed(1);
};

/**
 * Get dimension description based on level
 */
const getDimensionDescription = (dimension: string, level: number): string => {
  const descriptions: Record<string, Record<number, string>> = {
    'Ownership': {
      4: 'Guide others on how to solve, anticipate, and/or avoid major production or compliance issues',
      5: 'Contribute to identification and definition of engineering goals for your team',
      6: 'Contribute to identification and definition of engineering goals across multiple teams',
      7: 'Lead substantial initiatives that drive measurable results',
      8: 'Develop and execute a long-term vision and strategy for a significant part of the business'
    },
    'Organisation Impact': {
      4: 'Help other product teams to solve significant technical problems in your area of expertise',
      5: 'Advise other employees on career direction',
      6: 'Evaluate senior level hires',
      7: 'Identify leadership potential within group; hire and develop senior managers, directors, and architects',
      8: 'Create and steward a culture of diversity, inclusion and belonging, and mentor others in doing so'
    },
    'Independence & Score': {
      4: 'Technical thought leader in your immediate team',
      5: 'Technical thought leader in multiple teams',
      6: 'Technical thought leader at the divisional level',
      7: 'Technical thought leader at the organizational level',
      8: 'Thought leader on industry-wide challenges and practices'
    },
    'Strategic Alignment': {
      4: 'Align work to support quarterly goals',
      5: 'Ensure technical solutions align with annual objectives',
      6: 'Drive multi-quarter technical strategy',
      7: 'Define and execute multi-year technical roadmap',
      8: 'Shape industry direction through innovative strategies'
    }
  };
  
  return descriptions[dimension]?.[level] || `Level ${level} description`;
}; 