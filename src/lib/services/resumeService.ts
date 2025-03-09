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
    try {
      // Call OpenAI analyze-resume endpoint
      const response = await fetch('/api/openai/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobPosting.description || "Engineering manager position",
          dimensions
        }),
      });
      
      if (!response.ok) {
        console.error('Error from OpenAI service:', await response.text());
        throw new Error('Failed to analyze resume with OpenAI');
      }
      
      const data = await response.json();
      analysis = data.analysis;
      
      // Extract candidate name and email if available
      let candidateName = '';
      let candidateEmail = '';
      
      if (analysis && analysis.candidateName) {
        candidateName = analysis.candidateName;
      }
      
      if (analysis && analysis.candidateEmail) {
        candidateEmail = analysis.candidateEmail;
      }
      
      // Update the resume record with extracted name and email if they exist
      if (candidateName || candidateEmail) {
        const updateData: Record<string, any> = {};
        
        if (candidateName) {
          updateData.candidate_name = candidateName;
        }
        
        if (candidateEmail) {
          updateData.candidate_email = candidateEmail;
        }
        
        // Only update if we have data to update
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('resumes')
            .update(updateData)
            .eq('id', resumeId);
            
          if (updateError) {
            console.error('Error updating resume with extracted name/email:', updateError);
          } else {
            console.log('Updated resume with extracted name and email');
          }
        }
      }
      
      // Create the evaluation object
      const evaluationData: Omit<ResumeEvaluation, 'id'> = {
        resumeId,
        jobPostingId,
        overallScore: analysis.overallScore || 0,
        ownershipScore: analysis.dimensions?.Ownership?.score || 0,
        organizationImpactScore: analysis.dimensions?.OrganisationImpact?.score || 0,
        independenceScore: analysis.dimensions?.Independence?.score || 0,
        strategicAlignmentScore: analysis.dimensions?.StrategicAlignment?.score || 0,
        skillsScore: analysis.dimensions?.Skills?.score || 0,
        ownershipLevel: analysis.dimensions?.Ownership?.level || 4,
        organizationImpactLevel: analysis.dimensions?.OrganisationImpact?.level || 4,
        independenceLevel: analysis.dimensions?.Independence?.level || 4,
        strategicAlignmentLevel: analysis.dimensions?.StrategicAlignment?.level || 4,
        skillsLevel: analysis.dimensions?.Skills?.level || 4,
        analysisJson: analysis,
        selectedForInterview: false
      };
      
      // 4. Create evaluation record
      const evaluationId = uuidv4();
      
      // Add the ID to create the complete evaluation
      const evaluation = {
        ...evaluationData,
        id: evaluationId
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