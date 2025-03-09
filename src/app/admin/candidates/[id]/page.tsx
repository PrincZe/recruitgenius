'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Loader2, 
  ArrowLeft, 
  FileText, 
  User, 
  BarChart,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Mic
} from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  const evaluationId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [jobPosting, setJobPosting] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [interviewLink, setInterviewLink] = useState<string | null>(null);

  useEffect(() => {
    if (evaluationId) {
      fetchEvaluationDetails();
    }
  }, [evaluationId]);

  const fetchEvaluationDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch the evaluation
      const { data: evaluationData, error: evaluationError } = await supabase
        .from('resume_evaluations')
        .select(`
          *,
          resume:resume_id (
            id,
            candidate_id,
            file_url,
            file_name,
            file_size,
            content_text
          )
        `)
        .eq('id', evaluationId)
        .single();
      
      if (evaluationError) throw evaluationError;
      setEvaluation(evaluationData);
      
      if (evaluationData) {
        // Fetch the job posting
        const { data: jobData, error: jobError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('id', evaluationData.job_posting_id)
          .single();
        
        if (!jobError) setJobPosting(jobData);
        
        // Fetch the candidate
        if (evaluationData.resume?.candidate_id) {
          const { data: candidateData, error: candidateError } = await supabase
            .from('candidates')
            .select('*')
            .eq('id', evaluationData.resume.candidate_id)
            .single();
          
          if (!candidateError) {
            setCandidate(candidateData);
            
            // Check if candidate already has an interview session
            if (candidateData.session_id) {
              const interviewUrl = `${window.location.origin}/interview/${candidateData.session_id}`;
              setInterviewLink(interviewUrl);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching evaluation details:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInterviewLink = async () => {
    if (!candidate || !evaluation) return;
    
    setGeneratingLink(true);
    
    try {
      // Create a new session
      const sessionId = uuidv4();
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([
          {
            id: sessionId,
            candidate_id: candidate.id,
            job_posting_id: evaluation.job_posting_id,
            questions: ['q1', 'q2', 'q3'], // Default interview questions
            progress: 0,
            is_completed: false
          }
        ])
        .select();
      
      if (sessionError) throw sessionError;
      
      // Update candidate with session ID
      await supabase
        .from('candidates')
        .update({ session_id: sessionId })
        .eq('id', candidate.id);
      
      // Mark evaluation as selected for interview
      await supabase
        .from('resume_evaluations')
        .update({ selected_for_interview: true })
        .eq('id', evaluationId);
      
      // Generate link
      const interviewUrl = `${window.location.origin}/interview/${sessionId}`;
      setInterviewLink(interviewUrl);
      
      // Refresh evaluation data
      fetchEvaluationDetails();
    } catch (error) {
      console.error('Error generating interview link:', error);
      alert('There was an error generating the interview link');
    } finally {
      setGeneratingLink(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading candidate details...</span>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="px-4 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <h2 className="font-semibold">Evaluation not found</h2>
          <p>The evaluation you are looking for could not be found.</p>
          <Link href="/admin/candidates" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link href={`/admin/candidates?job=${evaluation.job_posting_id}`} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Candidate Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {/* Candidate Card */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-500" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold">{candidate?.name || 'Unknown Candidate'}</h2>
                <p className="text-gray-600">{candidate?.email || 'No email'}</p>
              </div>
            </div>

            {evaluation.selected_for_interview ? (
              <div className="mt-6 p-4 bg-green-50 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-700">Invited to interview</span>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  onClick={generateInterviewLink}
                  disabled={generatingLink}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
                >
                  {generatingLink ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Invite to Interview
                    </>
                  )}
                </button>
              </div>
            )}

            {interviewLink && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={interviewLink}
                    className="flex-1 min-w-0 block px-3 py-2 rounded-l-md sm:text-sm border border-gray-300"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(interviewLink);
                      alert('Interview link copied to clipboard!');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resume Card */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              Resume
            </h2>
            <div className="mb-4">
              <a
                href={evaluation.resume?.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                View Resume
              </a>
            </div>
            <div className="text-sm text-gray-600">
              <p>Filename: {evaluation.resume?.file_name || 'Unknown'}</p>
              <p>Size: {evaluation.resume?.file_size ? `${(evaluation.resume.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
            </div>
          </div>

          {/* Job Posting Card */}
          {jobPosting && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                Job Posting
              </h2>
              <div className="text-sm">
                <h3 className="font-medium text-gray-900">{jobPosting.title}</h3>
                <p className="text-gray-600">{jobPosting.department || 'No department'}</p>
                <div className="mt-2">
                  <h4 className="font-medium text-gray-700">Skills:</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {jobPosting.skills && jobPosting.skills.map((skill: string, i: number) => (
                      <span key={i} className="bg-gray-200 px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {jobPosting.file_url && (
                  <div className="mt-4">
                    <a
                      href={jobPosting.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Full Job Description
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {/* Overall Score Card */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart className="h-5 w-5 text-blue-500 mr-2" />
              Overall Score
            </h2>
            <div className="flex items-center">
              <div 
                className={`text-4xl font-bold ${
                  evaluation.overall_score >= 4 
                    ? 'text-green-600' 
                    : evaluation.overall_score >= 3 
                    ? 'text-blue-600' 
                    : evaluation.overall_score >= 2 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}
              >
                {evaluation.overall_score.toFixed(1)}
              </div>
              <div className="ml-3 text-gray-500">/ 5.0</div>
              <div className="ml-auto">
                <div className="bg-gray-200 w-40 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      evaluation.overall_score >= 4 
                        ? 'bg-green-500' 
                        : evaluation.overall_score >= 3 
                        ? 'bg-blue-500' 
                        : evaluation.overall_score >= 2 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${(evaluation.overall_score / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Dimension Scores Card */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Star className="h-5 w-5 text-blue-500 mr-2" />
              Dimension Scores
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Ownership</span>
                  <span className="text-sm font-medium text-gray-700">
                    L{evaluation.ownership_level} ({evaluation.ownership_score.toFixed(1)})
                  </span>
                </div>
                <div className="bg-gray-200 h-2.5 rounded-full">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(evaluation.ownership_score / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {getDimensionDescription('Ownership', evaluation.ownership_level)}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Organization Impact</span>
                  <span className="text-sm font-medium text-gray-700">
                    L{evaluation.organization_impact_level} ({evaluation.organization_impact_score.toFixed(1)})
                  </span>
                </div>
                <div className="bg-gray-200 h-2.5 rounded-full">
                  <div 
                    className="bg-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${(evaluation.organization_impact_score / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {getDimensionDescription('Organisation Impact', evaluation.organization_impact_level)}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Independence</span>
                  <span className="text-sm font-medium text-gray-700">
                    L{evaluation.independence_level} ({evaluation.independence_score.toFixed(1)})
                  </span>
                </div>
                <div className="bg-gray-200 h-2.5 rounded-full">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${(evaluation.independence_score / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {getDimensionDescription('Independence & Score', evaluation.independence_level)}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Strategic Alignment</span>
                  <span className="text-sm font-medium text-gray-700">
                    L{evaluation.strategic_alignment_level} ({evaluation.strategic_alignment_score.toFixed(1)})
                  </span>
                </div>
                <div className="bg-gray-200 h-2.5 rounded-full">
                  <div 
                    className="bg-amber-600 h-2.5 rounded-full" 
                    style={{ width: `${(evaluation.strategic_alignment_score / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {getDimensionDescription('Strategic Alignment', evaluation.strategic_alignment_level)}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Skills</span>
                  <span className="text-sm font-medium text-gray-700">
                    L{evaluation.skills_level} ({evaluation.skills_score.toFixed(1)})
                  </span>
                </div>
                <div className="bg-gray-200 h-2.5 rounded-full">
                  <div 
                    className="bg-red-600 h-2.5 rounded-full" 
                    style={{ width: `${(evaluation.skills_score / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {getDimensionDescription('Skills', evaluation.skills_level)}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Details Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Analysis Details</h2>
            
            {evaluation.analysis_json ? (
              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-2">Summary</h3>
                  <p className="text-gray-600">{evaluation.analysis_json.summary}</p>
                </div>
                
                {/* Strengths */}
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-2">Strengths</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {evaluation.analysis_json.topStrengths.map((strength: string, i: number) => (
                      <li key={i} className="text-gray-600">{strength}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Development Areas */}
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-2">Development Areas</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {evaluation.analysis_json.developmentAreas.map((area: string, i: number) => (
                      <li key={i} className="text-gray-600">{area}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Skills Matched */}
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-2">Skills Matched</h3>
                  <div className="flex flex-wrap gap-2">
                    {evaluation.analysis_json.skillsMatched.map((skill: string, i: number) => (
                      <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">No detailed analysis available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get dimension description
function getDimensionDescription(dimension: string, level: number): string {
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
  
  return descriptions[dimension]?.[level] || `Level ${level}`;
} 