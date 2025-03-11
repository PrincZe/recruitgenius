'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
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
  Mic,
  Mail
} from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { format } from 'date-fns';
import { Suspense } from 'react';

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  const candidateId = params.id;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingState />}>
        <CandidateDetailClient candidateId={candidateId} />
      </Suspense>
    </div>
  );
}

// Client component that handles data fetching and display
function CandidateDetailClient({ candidateId }: { candidateId: string }) {
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [interviewLink, setInterviewLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [defaultQuestions, setDefaultQuestions] = useState<any[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Record<string, any>>({});
  const [processingRecordings, setProcessingRecordings] = useState<Record<string, boolean>>({});
  const [processingSuccess, setProcessingSuccess] = useState<Record<string, boolean>>({});
  const [processingErrors, setProcessingErrors] = useState<Record<string, string>>({});
  const [scanningResume, setScanningResume] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First check if the ID is for a resume_evaluation or a candidate
        let candidateData;
        
        // Try to fetch as a resume_evaluation first
        const { data: evaluationData, error: evaluationError } = await supabase
          .from('resume_evaluations')
          .select(`
            *,
            resume:resume_id (
              id,
              file_name,
              file_url
            ),
            job_posting:job_posting_id (
              id,
              title,
              description
            )
          `)
          .eq('id', candidateId)
          .maybeSingle();
        
        if (evaluationError) {
          console.error('Error fetching resume evaluation:', evaluationError);
          
          // If not found as an evaluation, try as a candidate
          const { data: directCandidateData, error: directCandidateError } = await supabase
            .from('candidates')
            .select(`
              *,
              resume:resume_id (
                id,
                file_name,
                file_url
              )
            `)
            .eq('id', candidateId)
            .maybeSingle();
            
          if (directCandidateError) {
            console.error('Error fetching direct candidate:', directCandidateError);
            setError(`Failed to load candidate data: ${directCandidateError.message}`);
            setLoading(false);
            return;
          }
          
          if (!directCandidateData) {
            setError(`No candidate found with ID: ${candidateId}`);
            setLoading(false);
            return;
          }
          
          candidateData = directCandidateData;
          
          // For direct candidate, we need to fetch the evaluation data too if it exists
          if (directCandidateData.resume_id) {
            const { data: linkedEvaluation, error: linkedEvalError } = await supabase
              .from('resume_evaluations')
              .select('*')
              .eq('resume_id', directCandidateData.resume_id)
              .maybeSingle();
              
            if (!linkedEvalError && linkedEvaluation) {
              // Merge evaluation data into candidate data
              candidateData = { ...directCandidateData, ...linkedEvaluation };
            }
          }
        } else {
          candidateData = evaluationData;
        }
        
        if (!candidateData) {
          setError(`Candidate data not found for ID: ${candidateId}`);
          setLoading(false);
          return;
        }
        
        // Set the filename for display
        if (candidateData?.resume?.file_name) {
          setFileName(candidateData.resume.file_name.replace('.pdf', ''));
        }
        
        console.log('Successfully loaded candidate data:', candidateData);
        setCandidate(candidateData);
        
        // Check if this candidate already has an interview link
        if (candidateData.selected_for_interview) {
          // Try to fetch the existing session
          checkForExistingSession(candidateData);
        }
      } catch (error: any) {
        console.error('Error fetching candidate:', error);
        setError(`An unexpected error occurred: ${error?.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCandidate();
  }, [candidateId]);
  
  useEffect(() => {
    // Fetch questions from the database
    const fetchQuestions = async () => {
      try {
        const { data: questions, error } = await supabase
          .from('questions')
          .select('id, text')
          .limit(3);
          
        if (error) {
          console.error('Error fetching questions:', error);
          return;
        }
        
        if (questions && questions.length > 0) {
          setDefaultQuestions(questions.map(q => q.id));
        } else {
          console.log('No questions found in the database');
        }
      } catch (err) {
        console.error('Error loading questions:', err);
      }
    };
    
    fetchQuestions();
  }, []);
  
  // Function to check if the candidate already has an interview session
  const checkForExistingSession = async (candidateData: any) => {
    try {
      // First, we need a candidate entry to link the session to
      let candidateId = await ensureCandidateExists(candidateData);
      
      if (!candidateId) {
        return;
      }
      
      // Check for existing session
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('candidate_id', candidateId)
        .maybeSingle();
        
      if (sessionData) {
        // If there's an existing session, show its link
        const interviewUrl = `${window.location.origin}/interview/${sessionData.id}`;
        setInterviewLink(interviewUrl);
      }
    } catch (error) {
      console.error('Error checking for existing session:', error);
    }
  };
  
  // Function to ensure a candidate record exists
  const ensureCandidateExists = async (evaluationData: any): Promise<string | null> => {
    // Try to find if a candidate record already exists for this resume
    const { data: existingCandidates } = await supabase
      .from('candidates')
      .select('id, name, email')
      .eq('resume_id', evaluationData.resume_id)
      .maybeSingle();
      
    if (existingCandidates) {
      return existingCandidates.id;
    }
    
    // If no candidate exists, create one
    const candidateName = fileName || 'Candidate';
    const candidateEmail = `${candidateName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    
    const { data: newCandidate, error } = await supabase
      .from('candidates')
      .insert([
        {
          name: candidateName,
          email: candidateEmail,
          resume_id: evaluationData.resume_id
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating candidate:', error);
      return null;
    }
    
    return newCandidate.id;
  };
  
  // Function to generate the interview link
  const generateInterviewLink = async () => {
    setGeneratingLink(true);
    setError(null);
    
    try {
      if (!candidate) {
        throw new Error('Candidate information not found');
      }
      
      // 1. Ensure a candidate record exists
      const candidateId = await ensureCandidateExists(candidate);
      
      if (!candidateId) {
        throw new Error('Could not create or find a candidate record');
      }
      
      // Prepare question IDs - use default questions from database if available,
      // otherwise use hardcoded defaults for testing
      let questionIds = defaultQuestions;
      if (questionIds.length === 0) {
        // If no questions were found in the database, create some basic ones first
        try {
          // Add some default questions
          const defaultQuestionTexts = [
            "Tell me about your experience as an engineering manager",
            "How do you handle team conflicts?",
            "Describe a challenging project you led"
          ];
          
          // Create the questions in database
          const createdQuestionIds = [];
          for (const text of defaultQuestionTexts) {
            const { data, error } = await supabase
              .from('questions')
              .insert([{ text, category: 'General' }])
              .select();
              
            if (!error && data && data.length > 0) {
              createdQuestionIds.push(data[0].id);
            }
          }
          
          questionIds = createdQuestionIds;
        } catch (err) {
          console.error('Error creating default questions:', err);
        }
      }
      
      // 2. Create a session
      const sessionId = uuidv4();
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert([
          {
            id: sessionId,
            candidate_id: candidateId,
            questions: questionIds,
            started_at: new Date().toISOString(),
            completed_at: null,
            is_completed: false
          }
        ]);
      
      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw new Error('Failed to create interview session');
      }
      
      // 3. Mark the evaluation as selected for interview
      await supabase
        .from('resume_evaluations')
        .update({ selected_for_interview: true })
        .eq('id', candidate.id);
      
      // 4. Generate interview link
      const interviewUrl = `${window.location.origin}/interview/${sessionId}`;
      setInterviewLink(interviewUrl);
      
      // 5. Update candidate with session ID
      await supabase
        .from('candidates')
        .update({ session_id: sessionId })
        .eq('id', candidateId);
        
    } catch (err: any) {
      console.error('Error generating interview link:', err);
      setError(err.message || 'Failed to generate interview link');
    } finally {
      setGeneratingLink(false);
    }
  };
  
  useEffect(() => {
    // Fetch recordings for the candidate
    const fetchRecordings = async () => {
      try {
        setLoadingRecordings(true);
        console.log('Fetching recordings for candidate ID:', candidateId);
        
        // Try to get recordings directly based on the URL candidate ID
        let { data: directRecordings, error: directError } = await supabase
          .from('recordings')
          .select('*')
          .eq('candidate_id', candidateId)
          .order('created_at', { ascending: true });
          
        if (directError) {
          console.error('Error fetching recordings directly:', directError);
        }
        
        // If we found recordings directly, use them
        if (directRecordings && directRecordings.length > 0) {
          console.log('Found recordings directly with candidate_id:', directRecordings.length);
          setRecordings(directRecordings);
        }
        // Otherwise try to find via resume ID if candidate has resume data
        else if (candidate?.resume?.id) {
          console.log('Trying to find candidate via resume_id:', candidate.resume.id);
          
          // Find ALL candidates that might be linked to this resume (not using maybeSingle)
          const { data: candidatesData, error: candidatesError } = await supabase
            .from('candidates')
            .select('id')
            .eq('resume_id', candidate.resume.id);
          
          if (candidatesError) {
            console.error('Error finding candidates from resume:', candidatesError);
          } else if (candidatesData && candidatesData.length > 0) {
            // Get all candidate IDs
            const candidateIds = candidatesData.map(c => c.id);
            console.log(`Found ${candidateIds.length} candidate IDs via resume:`, candidateIds);
            
            // Get recordings for ANY of these candidate IDs
            const { data: recordingsData, error: recordingsError } = await supabase
              .from('recordings')
              .select('*')
              .in('candidate_id', candidateIds)
              .order('created_at', { ascending: true });
            
            if (recordingsError) {
              console.error('Error fetching recordings:', recordingsError);
            } else if (recordingsData && recordingsData.length > 0) {
              console.log('Found recordings via resume relationship:', recordingsData.length);
              setRecordings(recordingsData);
              // We found recordings, so we can skip the name-based search
              await fetchQuestionsForRecordings(recordingsData);
              return;
            }
          }
          
          // If we get here, we didn't find recordings via direct ID or resume relationship
          // Name-based matching has been disabled to prevent cross-contamination between candidates
          console.log('Name-based matching is disabled to prevent cross-contamination between candidates');
          
          console.log('No recordings found through any method');
          setRecordings([]);
        } else {
          console.log('No resume ID and no direct recordings found');
          setRecordings([]);
        }
        
        // If we have recordings (from any source), fetch the questions
        if (directRecordings && directRecordings.length > 0) {
          await fetchQuestionsForRecordings(directRecordings);
        }
      } catch (err) {
        console.error('Error loading recordings:', err);
      } finally {
        setLoadingRecordings(false);
      }
    };
    
    // Helper function to fetch questions for a set of recordings
    const fetchQuestionsForRecordings = async (recordingsData: any[]) => {
      const questionIds = recordingsData?.map(r => r.question_id) || [];
      
      if (questionIds.length > 0) {
        // Get unique question IDs
        const uniqueQuestionIds = questionIds.filter((id, index) => 
          questionIds.indexOf(id) === index
        );
        
        console.log('Fetching details for questions:', uniqueQuestionIds);
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .in('id', uniqueQuestionIds);
        
        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
        } else {
          // Convert to a map for easy lookup
          const questionsMap: Record<string, any> = {};
          questionsData?.forEach(q => {
            questionsMap[q.id] = q;
          });
          console.log('Questions map created:', Object.keys(questionsMap).length);
          setQuestions(questionsMap);
        }
      }
    };
    
    // Only fetch recordings when candidateId is available
    if (candidateId) {
      fetchRecordings();
    }
  }, [candidateId, candidate, fileName]);
  
  const handleProcessRecording = async (recordingId: string, audioUrl: string) => {
    if (!recordingId || !audioUrl) {
      setProcessingErrors(prev => ({ 
        ...prev, 
        [recordingId]: 'No audio URL available for processing' 
      }));
      return;
    }

    try {
      // Set processing state for this recording
      setProcessingRecordings(prev => ({ ...prev, [recordingId]: true }));
      setProcessingErrors(prev => ({ ...prev, [recordingId]: '' }));
      setProcessingSuccess(prev => ({ ...prev, [recordingId]: false }));

      const response = await fetch('/api/recordings/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId,
          audioUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process recording');
      }

      const data = await response.json();
      
      // Update the recording in the recordings array
      setRecordings(prev => 
        prev.map(rec => 
          rec.id === recordingId 
            ? {
                ...rec,
                transcript: data.transcript,
                sentiment_score: data.sentimentScore,
                sentiment_type: data.sentimentType,
                summary: data.summary,
                topics: data.topics,
                is_processed: true
              }
            : rec
        )
      );
      
      // Set success state
      setProcessingSuccess(prev => ({ ...prev, [recordingId]: true }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setProcessingSuccess(prev => ({ ...prev, [recordingId]: false }));
      }, 3000);
    } catch (error) {
      console.error('Error processing recording:', error);
      setProcessingErrors(prev => ({ 
        ...prev, 
        [recordingId]: error instanceof Error ? error.message : 'An unknown error occurred' 
      }));
    } finally {
      setProcessingRecordings(prev => ({ ...prev, [recordingId]: false }));
    }
  };
  
  // Helper function to render sentiment type with icon
  const renderSentimentType = (type: string | undefined) => {
    if (!type) return null;
    
    let icon = '😐';
    let color = 'text-gray-500';
    
    switch (type.toLowerCase()) {
      case 'positive':
        icon = '😊';
        color = 'text-green-500';
        break;
      case 'negative':
        icon = '😟';
        color = 'text-red-500';
        break;
      case 'neutral':
        icon = '😐';
        color = 'text-gray-500';
        break;
    }
    
    return (
      <span className={`font-medium ${color}`}>
        {icon} {type}
      </span>
    );
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Function to re-analyze the resume
  const handleScanResume = async () => {
    if (!candidate?.resume?.id || !candidate?.job_posting_id) {
      setScanError('Cannot scan: Missing resume ID or job posting ID');
      return;
    }

    setScanningResume(true);
    setScanSuccess(false);
    setScanError(null);

    try {
      const response = await fetch('/api/openai/analyze-resume/rescan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: candidate.resume.id,
          jobPostingId: candidate.job_posting_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan resume');
      }

      // Success! Refresh the page to show updated analysis
      setScanSuccess(true);
      window.location.reload();
    } catch (error: any) {
      console.error('Error scanning resume:', error);
      setScanError(error.message || 'Failed to scan resume');
    } finally {
      setScanningResume(false);
    }
  };
  
  if (loading) {
    return <LoadingState />;
  }
  
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <p className="mt-2">
            Please try refreshing the page or go back to the <Link href="/admin/candidates" className="underline">candidates list</Link>.
          </p>
        </div>
      </div>
    );
  }
  
  if (!candidate) {
    return (
      <div className="p-8 text-center">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Not Found: </strong>
          <span className="block sm:inline">Candidate data could not be loaded.</span>
          <p className="mt-2">
            Please check the candidate ID and try again or go back to the <Link href="/admin/candidates" className="underline">candidates list</Link>.
          </p>
        </div>
      </div>
    );
  }
  
  // Extract analysis data
  const analysisJson = candidate.analysis_json || {};
  
  // Render the candidate detail page
  return (
    <div className="p-6 md:p-8 max-w-screen-xl mx-auto">
      <Link href="/admin/candidates" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Candidates
      </Link>
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{fileName || 'Unknown Candidate'}</h1>
          <p className="text-gray-500">
            Resume uploaded {format(new Date(candidate.created_at), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          {interviewLink ? (
            <div className="space-y-2">
              <div className="flex items-center text-green-600 font-medium">
                <CheckCircle className="w-4 h-4 mr-2" />
                Interview Ready
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  value={interviewLink}
                  readOnly
                  className="text-sm px-3 py-2 border rounded-l-md focus:outline-none flex-1 w-60"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(interviewLink);
                    alert('Interview link copied to clipboard!');
                  }}
                  className="bg-blue-600 text-white px-3 py-2 text-sm rounded-r-md hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <button
              className="inline-flex items-center px-4 py-2 rounded-md font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              onClick={generateInterviewLink}
              disabled={generatingLink}
            >
              {generatingLink ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Generating...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Invite to Interview
                </>
              )}
            </button>
          )}
          {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Overall Score</h2>
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
              <p className="text-sm text-gray-500">Based on the 5-dimension evaluation</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold">
                {candidate.overall_score !== null && candidate.overall_score !== undefined
                  ? candidate.overall_score.toFixed(0)
                  : 'N/A'}<span className="text-xl font-normal text-gray-500">/100</span>
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${candidate.overall_score !== null && candidate.overall_score !== undefined 
                ? Math.min(Math.max(candidate.overall_score, 0), 100) 
                : 0}%` }}
            ></div>
          </div>
          <p className="mt-4 text-gray-500 text-sm">
            Evaluated against: <span className="font-medium text-gray-700">{candidate.job_posting?.title || 'Job Position'}</span>
          </p>
        </div>
        
        {/* Dimension Scores Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Dimension Scores</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Ownership <span className="text-xs text-gray-500">L{candidate.ownership_level || 4}</span></span>
                <span>{candidate.ownership_score !== null && candidate.ownership_score !== undefined
                  ? candidate.ownership_score.toFixed(1)
                  : 'N/A'}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${candidate.ownership_score !== null && candidate.ownership_score !== undefined
                    ? Math.min(Math.max(candidate.ownership_score * 10, 0), 100)
                    : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span>Organization Impact <span className="text-xs text-gray-500">L{candidate.organization_impact_level || 4}</span></span>
                <span>{candidate.organization_impact_score !== null && candidate.organization_impact_score !== undefined
                  ? candidate.organization_impact_score.toFixed(1)
                  : 'N/A'}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${candidate.organization_impact_score !== null && candidate.organization_impact_score !== undefined
                    ? Math.min(Math.max(candidate.organization_impact_score * 10, 0), 100)
                    : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span>Independence <span className="text-xs text-gray-500">L{candidate.independence_level || 4}</span></span>
                <span>{candidate.independence_score !== null && candidate.independence_score !== undefined
                  ? candidate.independence_score.toFixed(1)
                  : 'N/A'}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${candidate.independence_score !== null && candidate.independence_score !== undefined
                    ? Math.min(Math.max(candidate.independence_score * 10, 0), 100)
                    : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span>Strategic Alignment <span className="text-xs text-gray-500">L{candidate.strategic_alignment_level || 4}</span></span>
                <span>{candidate.strategic_alignment_score !== null && candidate.strategic_alignment_score !== undefined
                  ? candidate.strategic_alignment_score.toFixed(1)
                  : 'N/A'}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${candidate.strategic_alignment_score !== null && candidate.strategic_alignment_score !== undefined
                    ? Math.min(Math.max(candidate.strategic_alignment_score * 10, 0), 100)
                    : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analysis Details Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Analysis Details</h2>
          
          <div className="space-y-4">
            {/* Summary Section */}
            <div>
              <h3 className="font-medium mb-2">Summary</h3>
              <p className="text-gray-700 text-sm">
                {analysisJson.analysis || 'No summary available'}
              </p>
            </div>
            
            {/* Strengths Section */}
            <div>
              <h3 className="font-medium mb-2">Strengths</h3>
              {analysisJson.strengths && analysisJson.strengths.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {analysisJson.strengths.slice(0, 5).map((strength: string, index: number) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No strengths information available</p>
              )}
            </div>
            
            {/* Development Areas Section */}
            <div>
              <h3 className="font-medium mb-2">Development Areas</h3>
              {analysisJson.developmentAreas && analysisJson.developmentAreas.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {analysisJson.developmentAreas.slice(0, 5).map((area: string, index: number) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No development areas information available</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Resume Preview Card - This is optional and can be implemented if needed */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Resume Preview</h2>
          
          {candidate?.resume?.id && (
            <button
              onClick={handleScanResume}
              disabled={scanningResume}
              className={`px-4 py-2 rounded-md text-white ${
                scanningResume 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {scanningResume ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Scanning...
                </span>
              ) : (
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Scan Resume
                </span>
              )}
            </button>
          )}
        </div>
        
        {scanError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            <p className="text-sm font-medium">Error: {scanError}</p>
          </div>
        )}
        
        {scanSuccess && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
            <p className="text-sm font-medium">Resume successfully scanned and analyzed!</p>
          </div>
        )}
        
        <div className="border rounded-md p-4 flex items-center justify-center min-h-[200px]">
          {candidate?.resume?.file_url ? (
            <a 
              href={candidate.resume.file_url} 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <FileText className="mr-2 h-5 w-5" />
              View Resume
            </a>
          ) : (
            <p className="text-gray-500">No resume file available</p>
          )}
        </div>
      </div>
      
      {/* Interview Recordings Section */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Interview Recordings</h2>
        
        {loadingRecordings ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : recordings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 mb-4">No interview recordings available for this candidate.</p>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                <strong>Note:</strong> Only recordings explicitly linked to this specific candidate will appear here. 
                Name-based matching has been disabled to prevent incorrect associations.
              </p>
              <p className="text-yellow-800 mt-2">
                If this candidate has completed an interview and you don't see the recordings, please check:
              </p>
              <ul className="list-disc ml-5 mt-2 text-yellow-800">
                <li>The candidate completed the interview using the link generated from this specific resume</li>
                <li>The interview was fully submitted after all questions were answered</li>
                <li>You're viewing the correct candidate profile for {fileName || 'this candidate'}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {recordings.map((recording, index) => (
              <div key={recording.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium mb-2">
                    Question {index + 1}: {questions[recording.question_id]?.text || 'Unknown Question'}
                  </h3>
                  
                  {questions[recording.question_id]?.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {questions[recording.question_id].category}
                    </span>
                  )}
                  
                  <p className="text-sm text-gray-500 mt-2">
                    Recorded on {formatDate(recording.created_at)}
                  </p>
                </div>
                
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-md font-medium mb-3">Audio Response</h4>
                  {recording.audio_url ? (
                    <audio 
                      src={recording.audio_url} 
                      controls 
                      className="w-full"
                      onError={(e) => {
                        console.error('Audio playback error:', e);
                        // Set fallback text when audio fails to load
                        const target = e.target as HTMLAudioElement;
                        target.style.display = 'none';
                        target.parentElement?.appendChild(
                          Object.assign(document.createElement('div'), {
                            className: 'p-4 bg-red-50 text-red-700 rounded-md',
                            textContent: 'Audio playback error. The recording may be corrupted or in an unsupported format.'
                          })
                        );
                      }}
                    />
                  ) : (
                    <div className="p-4 bg-red-50 text-red-700 rounded-md">
                      Audio format not supported or audio not available
                    </div>
                  )}
                </div>
                
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-md font-medium mb-3">Transcript</h4>
                  <div className="p-4 bg-gray-50 rounded-md max-h-48 overflow-y-auto">
                    {recording.transcript ? (
                      <p className="text-gray-700 whitespace-pre-line">{recording.transcript}</p>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-500 mb-4">
                          {processingRecordings[recording.id]
                            ? "Processing transcript..."
                            : "No transcript available"}
                        </p>
                        
                        <button
                          onClick={() => handleProcessRecording(recording.id, recording.audio_url)}
                          disabled={processingRecordings[recording.id]}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {processingRecordings[recording.id] ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                              </svg>
                              Process Recording
                            </>
                          )}
                        </button>
                        
                        {processingSuccess[recording.id] && (
                          <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md">
                            Recording processed successfully!
                          </div>
                        )}
                        
                        {processingErrors[recording.id] && (
                          <div className="mt-4 p-2 bg-red-50 text-red-700 rounded-md">
                            Error: {processingErrors[recording.id]}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {recording.sentiment_type && (
                  <div className="p-6">
                    <h4 className="text-md font-medium mb-3">Analysis</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm font-medium text-gray-500 mb-1">Sentiment</p>
                        <div>{renderSentimentType(recording.sentiment_type)}</div>
                      </div>
                      
                      {recording.sentiment_score !== undefined && (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm font-medium text-gray-500 mb-1">Sentiment Score</p>
                          <div className="text-lg font-semibold">
                            {recording.sentiment_score !== null ? recording.sentiment_score.toFixed(2) : 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {recording.summary && (
                      <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <p className="text-sm font-medium text-gray-500 mb-1">Summary</p>
                        <p className="text-gray-700">{recording.summary}</p>
                      </div>
                    )}
                    
                    {recording.topics && recording.topics.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm font-medium text-gray-500 mb-2">Topics Mentioned</p>
                        <div className="flex flex-wrap gap-2">
                          {recording.topics.map((topic: any, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
                              {topic.topic} {topic.confidence && `(${(topic.confidence * 100).toFixed(0)}%)`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
    </div>
  );
} 