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
        console.log('Fetching candidate with ID:', candidateId);
        
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
        
        console.log('Evaluation data query result:', { evaluationData, evaluationError });
        
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
        
          console.log('Direct candidate query result:', { directCandidateData, directCandidateError });
            
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
              .eq('resume_id', directCandidateData.resume_id)
              .maybeSingle();
            
            console.log('Linked evaluation query result:', { linkedEvaluation, linkedEvalError });
              
            if (!linkedEvalError && linkedEvaluation) {
              // Check if analysis_json is present
              if (linkedEvaluation.analysis_json) {
                console.log('Found analysis_json in linkedEvaluation');
                try {
                  const parsedJson = typeof linkedEvaluation.analysis_json === 'string' ?
                    JSON.parse(linkedEvaluation.analysis_json) : linkedEvaluation.analysis_json;
                  
                  console.log('Parsed analysis JSON:', parsedJson);
                  
                  // Merge evaluation data into candidate data
                  candidateData = { 
                    ...directCandidateData, 
                    ...linkedEvaluation,
                    // Ensure analysis_json is parsed if it's a string
                    analysis_json: parsedJson
                  };
                } catch (jsonError) {
                  console.error('Error parsing analysis_json:', jsonError);
                  candidateData = { 
                    ...directCandidateData, 
                    ...linkedEvaluation
                  };
                }
              } else {
                console.log('No analysis_json found in linkedEvaluation');
                candidateData = { 
                  ...directCandidateData, 
                  ...linkedEvaluation
                };
              }
            }
          }
        } else {
          candidateData = evaluationData;
          
          // Ensure analysis_json is parsed if it's a string
          if (evaluationData && evaluationData.analysis_json) {
            console.log('Found analysis_json in evaluationData');
            try {
              candidateData.analysis_json = typeof evaluationData.analysis_json === 'string' ? 
                JSON.parse(evaluationData.analysis_json) : evaluationData.analysis_json;
              
              console.log('Parsed analysis JSON:', candidateData.analysis_json);
            } catch (jsonError) {
              console.error('Error parsing analysis_json:', jsonError);
            }
          } else {
            console.log('No analysis_json found in evaluationData');
          }
        }
        
        if (!candidateData) {
          setError(`Candidate data not found for ID: ${candidateId}`);
          setLoading(false);
          return;
        }
        
        // Initialize analysis_json if it doesn't exist to prevent errors
        if (!candidateData.analysis_json) {
          candidateData.analysis_json = {};
        }
        
        // Set the filename for display
        if (candidateData?.resume?.file_name) {
          setFileName(candidateData.resume.file_name.replace('.pdf', ''));
        }
        
        console.log('Successfully loaded candidate data:', candidateData);
        
        // Log specific debug info for resume evaluation data
        console.log('Analysis JSON:', candidateData.analysis_json);
        
        // Log all keys and important fields in candidateData
        console.log('All candidateData keys:', Object.keys(candidateData));
        if (candidateData.analysis_json) {
          console.log('All analysis_json keys:', Object.keys(candidateData.analysis_json));
        }
        
        // Try to extract data from analysis_json
        if (candidateData.analysis_json) {
          console.log('Summary from analysis_json:', candidateData.analysis_json.summary);
          console.log('Strengths from analysis_json:', candidateData.analysis_json.strengths);
          console.log('Matched skills from analysis_json:', candidateData.analysis_json.matchedSkills);
          console.log('Development areas from analysis_json:', candidateData.analysis_json.developmentAreas);
        }
        
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
        
        if (!candidate || !candidate.id) {
          console.log('Cannot fetch recordings: candidate or candidate.id is missing');
          setRecordings([]);
          setLoadingRecordings(false);
          return;
        }
        
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
  
  // Determine if we need to show the Scan Resume button
  // Only show it if there's no analysis data or if the analysis is incomplete
  const needsRescan = !candidate?.resume?.analysis_json || 
                     !candidate?.resume?.analysis_json?.summary ||
                     candidate?.resume?.analysis_json?.summary?.includes('fallback') ||
                     candidate?.resume?.analysis_json?.summary?.includes('Using fallback evaluation');
  
  const hasFailedAnalysis = candidate?.resume?.analysis_json?.summary?.includes('failed') ||
                           candidate?.resume?.analysis_json?.summary?.includes('ERROR') ||
                           candidate?.resume?.analysis_json?.summary?.includes('WARNING');
  
  // Move these variable extractions inside the conditional block after checking if candidate exists
  
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
  
  // Extract analysis data AFTER confirming candidate exists
  const analysisJson = candidate.analysis_json || {};
  
  // The data is directly on the analysisJson object, not nested in an analysis property
  
  // Render the candidate detail page
  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Candidate Profile Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-white flex items-center">
                <User className="h-6 w-6 mr-2" />
                {candidate?.candidate?.name || (candidate?.resume?.candidate_name || 'Candidate Profile')}
              </h1>
              {candidate?.selected_for_interview ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" /> Selected for Interview
                </span>
              ) : null}
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left column - Basic info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Email</h2>
                  <p className="mt-1 text-base text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-1" />
                    {candidate?.candidate?.email || (candidate?.resume?.candidate_email || 'Not available')}
                  </p>
                </div>
                
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Status</h2>
                  <select
                    className="mt-1 block w-full text-base border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={candidate?.status || 'pending'}
                    disabled={generatingLink}
                    onChange={(e) => updateCandidateStatus(e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </select>
                </div>
              </div>
              
              {/* Middle column - Resume */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Resume</h2>
                  {candidate?.resume?.file_url ? (
                    <div className="mt-1 flex items-center">
                      <a
                        href={candidate.resume.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Resume
                      </a>
                      <button
                        onClick={handleScanResume}
                        disabled={scanningResume}
                        className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {scanningResume ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Scanning...
                          </>
                        ) : scanSuccess ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Re-scan Resume
                          </>
                        ) : (
                          <>
                            <BarChart className="h-4 w-4 mr-2" />
                            Analyze Resume
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">No resume uploaded</p>
                  )}
                </div>
                
                {scanError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <XCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{scanError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right column - Interview */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Interview Link</h2>
                  {interviewLink ? (
                    <div className="mt-1">
                      <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-300 rounded-md">
                        <code className="text-xs text-gray-800 overflow-x-auto max-w-xs truncate">
                          {interviewLink}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(interviewLink);
                            alert('Link copied to clipboard!');
                          }}
                          className="ml-2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={generateInterviewLink}
                      disabled={generatingLink}
                      className="mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingLink ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Generate Interview Link
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Section with Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Analysis Details</h2>
          </div>
          
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Resume Analysis
              </button>
              <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                Interview Responses
              </button>
            </nav>
          </div>
          
          {candidate?.analysis_json ? (
            <div className="space-y-8">
              {/* Summary */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <p className="text-gray-700">
                    {candidate.analysis_json.summary || 
                     candidate.analysis_json.analysis?.summary || 
                     "No summary available for this candidate."}
                  </p>
                </div>
              </div>
              
              {/* Strengths */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Strengths</h3>
                {candidate.analysis_json.strengths || 
                 candidate.analysis_json.analysis?.strengths ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {(candidate.analysis_json.strengths || 
                      candidate.analysis_json.analysis?.strengths || []).map((strength: string, index: number) => (
                      <li key={index} className="text-gray-700">{strength}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No strengths listed.</p>
                )}
              </div>
              
              {/* Development Areas */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Areas for Development</h3>
                {candidate.analysis_json.developmentAreas || 
                 candidate.analysis_json.analysis?.developmentAreas ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {(candidate.analysis_json.developmentAreas || 
                      candidate.analysis_json.analysis?.developmentAreas || []).map((area: string, index: number) => (
                      <li key={index} className="text-gray-700">{area}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No development areas listed.</p>
                )}
              </div>
              
              {/* Skills Match */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Matched Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(candidate.analysis_json.matchedSkills || 
                    candidate.analysis_json.analysis?.matchedSkills || []).map((skill: string, index: number) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                  {!(candidate.analysis_json.matchedSkills || 
                     candidate.analysis_json.analysis?.matchedSkills ||
                     []).length && (
                    <p className="text-gray-500 italic">No matched skills found.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No analysis data available for this candidate.</p>
              {candidate?.resume?.file_url && (
                <button
                  onClick={handleScanResume}
                  disabled={scanningResume}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {scanningResume ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <BarChart className="h-4 w-4 mr-2" />
                      Analyze Resume Now
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Interview Recordings Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Interview Recordings</h2>
            <button
              onClick={fetchRecordings}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            </button>
          </div>
          
          {loadingRecordings ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin" />
              <p className="mt-2 text-gray-500">Loading recordings...</p>
            </div>
          ) : recordings.length > 0 ? (
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div 
                  key={recording.id} 
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <div className="font-medium text-gray-900">
                      {questions[recording.questionId]?.text || 'Question not found'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(recording.createdAt)}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        {recording.audioUrl ? (
                          <audio 
                            controls 
                            className="w-full"
                          >
                            <source src={recording.audioUrl} type="audio/webm" />
                            Your browser does not support the audio element.
                          </audio>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Audio not available
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {recording.transcript ? (
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Transcribed
                          </div>
                        ) : (
                          <button
                            onClick={() => handleProcessRecording(recording.id, recording.audioUrl)}
                            disabled={processingRecordings[recording.id]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingRecordings[recording.id] ? (
                              <>
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                </svg>
                                Transcribe
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {recording.transcript && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="flex items-center mb-2">
                          <h3 className="text-sm font-medium text-gray-900">Transcript</h3>
                          {recording.sentimentType && (
                            <div className="ml-2">
                              {renderSentimentType(recording.sentimentType)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {recording.transcript}
                        </p>
                      </div>
                    )}
                    
                    {processingErrors[recording.id] && (
                      <div className="mt-2 text-sm text-red-600">
                        Error: {processingErrors[recording.id]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Mic className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings found</h3>
              <p className="text-gray-500 mb-4">
                This candidate hasn't completed any interview questions yet.
              </p>
              {!interviewLink ? (
                <button
                  onClick={generateInterviewLink}
                  disabled={generatingLink}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {generatingLink ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Generating Link...
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Generate Interview Link
                    </>
                  )}
                </button>
              ) : (
                <div className="text-sm text-gray-700">
                  Share the interview link with the candidate to start the interview process.
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  return renderContent();
}

function LoadingState() {
  return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
    </div>
  );
} 