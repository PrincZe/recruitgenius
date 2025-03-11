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
      // Handle the old method (resumeId and jobPostingId)
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
        return await analyzeResumeWithFile(file, jobPosting.description || "Engineering manager position");
      } catch (fileError) {
        console.error('Error fetching file from storage:', fileError);
        return {
          success: false,
          error: `Failed to fetch file from storage: ${fileError instanceof Error ? fileError.message : String(fileError)}`,
        };
      }
    } else {
      // Handle the new method (file and jobDescription)
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
  jobDescription: string
): Promise<AnalysisResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobDescription', jobDescription);

    console.log('Sending resume for analysis:', file.name);

    const response = await fetch('/api/openai/analyze-resume', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to analyze resume: ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();
    
    // Normalize the scores to ensure they're in the expected ranges
    const normalizedData = normalizeResumeAnalysisScores(data);
    
    return {
      success: true,
      data: normalizedData,
    };
  } catch (error) {
    console.error('Error analyzing resume with file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Normalizes scores from the resume analysis to ensure they're in the expected ranges:
 * - Overall score: 0-100
 * - Dimension scores: 0-10
 */
const normalizeResumeAnalysisScores = (data: any) => {
  // Normalize overall score to be between 0-100
  const normalizedOverallScore = Math.min(Math.max(data.overallScore, 0), 100);
  
  // Create a normalized copy of the data
  const normalizedData = {
    ...data,
    overallScore: normalizedOverallScore,
    dimensions: { ...data.dimensions }
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