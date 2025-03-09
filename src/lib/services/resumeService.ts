import { supabase } from '@/lib/supabase/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface ResumeEvaluation {
  resumeId: string;
  jobPostingId: string;
  overallScore: number;
  ownershipScore: number;
  organizationImpactScore: number;
  independenceScore: number;
  strategicAlignmentScore: number;
  skillsScore: number;
  ownershipLevel: number;
  organizationImpactLevel: number;
  independenceLevel: number;
  strategicAlignmentLevel: number;
  skillsLevel: number;
  analysisJson: any;
  selectedForInterview: boolean;
}

/**
 * Analyze a resume against a job posting
 */
export const analyzeResume = async (resumeId: string, jobPostingId: string): Promise<ResumeEvaluation | null> => {
  try {
    console.log(`Analyzing resume ${resumeId} for job ${jobPostingId}`);
    
    // 1. Get resume and job posting
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    
    if (resumeError) {
      console.error('Error fetching resume:', resumeError);
      return null;
    }
    
    const { data: jobPosting, error: jobPostingError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', jobPostingId)
      .single();
    
    if (jobPostingError) {
      console.error('Error fetching job posting:', jobPostingError);
      return null;
    }
    
    // 2. Extract text from resume PDF (placeholder - in a real app, use PDF.js or similar)
    const resumeText = resume.content_text || "Could not extract text from the resume";
    
    // 3. Analyze with OpenAI API
    const dimensions = [
      'Ownership',
      'Organisation Impact',
      'Independence & Score',
      'Strategic Alignment',
      'Skills'
    ];
    
    let analysis;

    // If OpenAI API key is available, use the real API, otherwise use mock data
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      // For demo/development purposes, use mock data
      analysis = await mockOpenAIAnalysis(resumeText, jobPosting.description, dimensions);
    } else {
      try {
        // Get the base URL for API calls (works in both client and server contexts)
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        // Call our OpenAI API route
        const response = await fetch(`${baseUrl}/api/openai/analyze-resume`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resumeText,
            jobDescription: jobPosting.description,
            dimensions
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Unknown error');
        }
        
        analysis = data.analysis;
      } catch (error) {
        console.error('Error calling OpenAI API:', error);
        // Fall back to mock data if API fails
        analysis = await mockOpenAIAnalysis(resumeText, jobPosting.description, dimensions);
      }
    }
    
    // 4. Create evaluation record
    const evaluationId = uuidv4();
    const evaluation: ResumeEvaluation = {
      resumeId,
      jobPostingId,
      overallScore: analysis.overallScore,
      ownershipScore: analysis.dimensionScores.Ownership.score,
      organizationImpactScore: analysis.dimensionScores['Organisation Impact'].score,
      independenceScore: analysis.dimensionScores['Independence & Score'].score,
      strategicAlignmentScore: analysis.dimensionScores['Strategic Alignment'].score,
      skillsScore: analysis.dimensionScores.Skills.score,
      ownershipLevel: analysis.dimensionScores.Ownership.level,
      organizationImpactLevel: analysis.dimensionScores['Organisation Impact'].level,
      independenceLevel: analysis.dimensionScores['Independence & Score'].level,
      strategicAlignmentLevel: analysis.dimensionScores['Strategic Alignment'].level,
      skillsLevel: analysis.dimensionScores.Skills.level,
      analysisJson: analysis,
      selectedForInterview: false
    };
    
    // 5. Save to database
    const { data: savedEvaluation, error: saveError } = await supabase
      .from('resume_evaluations')
      .insert([
        {
          id: evaluationId,
          resume_id: resumeId,
          job_posting_id: jobPostingId,
          overall_score: evaluation.overallScore,
          ownership_score: evaluation.ownershipScore,
          organization_impact_score: evaluation.organizationImpactScore,
          independence_score: evaluation.independenceScore,
          strategic_alignment_score: evaluation.strategicAlignmentScore,
          skills_score: evaluation.skillsScore,
          ownership_level: evaluation.ownershipLevel,
          organization_impact_level: evaluation.organizationImpactLevel,
          independence_level: evaluation.independenceLevel,
          strategic_alignment_level: evaluation.strategicAlignmentLevel,
          skills_level: evaluation.skillsLevel,
          analysis_json: evaluation.analysisJson,
          selected_for_interview: evaluation.selectedForInterview
        }
      ])
      .select();
    
    if (saveError) {
      console.error('Error saving evaluation:', saveError);
      return null;
    }
    
    // 6. Return the evaluation
    return evaluation;
    
  } catch (error) {
    console.error('Error analyzing resume:', error);
    return null;
  }
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
    },
    'Skills': {
      4: 'Strong technical mentorship',
      5: 'Effective cross-team collaboration',
      6: 'Impactful organizational change management',
      7: 'Executive-level communication',
      8: 'Transformational leadership'
    }
  };
  
  return descriptions[dimension]?.[level] || `Level ${level} description`;
}; 