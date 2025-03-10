'use client';

import { useState, useEffect } from 'react';
import { Session, Question } from '@/lib/models/types';
import TextToSpeech from '@/components/TextToSpeech';
import VoiceRecorder from '@/components/VoiceRecorder';
import { v4 as uuidv4 } from 'uuid';
import { getSessionById, getQuestions, getQuestionById } from '@/lib/services/supabaseService';

// Demo questions to use if none exist in Supabase
const demoQuestions = [
  {
    id: uuidv4(), // Use UUID format for compatibility with Supabase
    text: "Tell me about your background and experience.",
    category: "Background",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), // Use UUID format for compatibility with Supabase
    text: "What are your strengths and weaknesses?",
    category: "Personal",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(), // Use UUID format for compatibility with Supabase
    text: "Describe a challenging situation you faced at work and how you handled it.",
    category: "Experience",
    createdAt: new Date().toISOString()
  }
];

export default function InterviewQuestionsClient({ params }: { params: { sessionId: string } }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordingSubmitted, setRecordingSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  // Define fetchSessionData as an async function to get data from Supabase
  const fetchSessionData = async () => {
    setLoading(true);
    setError(null);
    
    console.log(`Attempting to fetch session data for ID: ${params.sessionId}, Question index: ${questionIndex}`);

    try {
      // Get session data from Supabase
      const sessionData = await getSessionById(params.sessionId);
      
      if (!sessionData) {
        console.error(`No session found with ID: ${params.sessionId}`);
        setError('Session not found. Would you like to create a demo session?');
        setLoading(false);
        return;
      }
      
      console.log(`Found session: ${sessionData.id}, Progress: ${sessionData.progress}, Questions: ${sessionData.questions.length}`);
      setSession(sessionData);
      setCandidateId(sessionData.candidateId);
      
      // Get the current question based on the question index
      if (sessionData.questions && questionIndex < sessionData.questions.length) {
        const questionId = sessionData.questions[questionIndex];
        try {
          // Try to get the question from Supabase
          const question = await getQuestionById(questionId);
          
          if (question) {
            setCurrentQuestion(question);
          } else {
            // If question not found in Supabase, check demo questions
            const demoQuestion = demoQuestions.find(q => q.id === questionId);
            if (demoQuestion) {
              setCurrentQuestion(demoQuestion);
            } else {
              setError(`Question not found. ID: ${questionId}`);
            }
          }
        } catch (error) {
          console.error(`Error fetching question with ID ${questionId}:`, error);
          setError('Error loading question. Please try again.');
        }
      } else {
        setError(`Invalid question index: ${questionIndex}`);
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
      setError('Error loading session. Would you like to create a demo session?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get candidateId from URL search params
    const urlParams = new URLSearchParams(window.location.search);
    const candidate = urlParams.get('candidateId');
    console.log("Candidate ID from URL:", candidate);
    
    if (candidate) {
      setCandidateId(candidate);
    }
    
    // Only fetch session data if sessionId is available
    if (params.sessionId) {
      // For demo session, create a demo session
      if (params.sessionId === 'demo-session') {
        createDemoSession();
        return;
      }
      
      // Otherwise, try to fetch the session
      fetchSessionData();
    }
  }, [params.sessionId]);

  // Also fetch session data when questionIndex changes
  useEffect(() => {
    if (params.sessionId && params.sessionId !== 'demo-session' && session) {
      // We only want to fetch new question data, not the entire session again
      if (session.questions && questionIndex < session.questions.length) {
        const questionId = session.questions[questionIndex];
        
        const fetchQuestionData = async () => {
          setLoading(true);
          try {
            const question = await getQuestionById(questionId);
            if (question) {
              setCurrentQuestion(question);
            } else {
              const demoQuestion = demoQuestions.find(q => q.id === questionId);
              if (demoQuestion) {
                setCurrentQuestion(demoQuestion);
              } else {
                setError(`Question not found. ID: ${questionId}`);
              }
            }
          } catch (error) {
            console.error(`Error fetching question with ID ${questionId}:`, error);
            setError('Error loading question. Please try again.');
          } finally {
            setLoading(false);
          }
        };
        
        fetchQuestionData();
      }
    }
  }, [questionIndex, session]);

  // Function to create a demo session
  const createDemoSession = () => {
    try {
      // Create a demo session
      const demoSession: Session = {
        id: 'demo-session',
        candidateId: candidateId || 'demo-candidate',
        questions: demoQuestions.map(q => q.id),
        progress: 0,
        isCompleted: false,
        createdAt: new Date().toISOString()
      };
      
      // Set the session and first question
      setSession(demoSession);
      setCurrentQuestion(demoQuestions[0]);
      setLoading(false);
    } catch (error) {
      console.error('Error creating demo session:', error);
      setError('Failed to create demo session.');
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (!session) return;
    
    const nextIndex = questionIndex + 1;
    
    if (nextIndex < session.questions.length) {
      try {
        console.log(`Navigating to next question (index: ${nextIndex})`);
        
        // Save current progress to localStorage before navigating
        const sessionsData = localStorage.getItem('sessions');
        if (sessionsData) {
          const sessions = JSON.parse(sessionsData);
          const updatedSessions = sessions.map((s: Session) => {
            if (s.id === session.id) {
              const newProgress = Math.max(s.progress, nextIndex);
              console.log(`Updating session progress to ${newProgress}`);
              return { 
                ...s, 
                progress: newProgress
              };
            }
            return s;
          });
          
          localStorage.setItem('sessions', JSON.stringify(updatedSessions));
          console.log('Updated session progress in localStorage');
          
          // Update the session state as well
          setSession((prevSession) => {
            if (!prevSession) return prevSession;
            return {
              ...prevSession,
              progress: Math.max(prevSession.progress, nextIndex)
            };
          });
        }
        
        // Reset recording state for the new question
        setRecordingSubmitted(false);
        
        // Update local state to avoid loading issues
        setQuestionIndex(nextIndex);
        
        // Update URL with hash-based routing (after state update)
        const newHash = `interview/${params.sessionId}?q=${nextIndex}`;
        console.log(`Setting new URL hash: ${newHash}`);
        window.location.hash = newHash;
        
        // Fetch the next question
        const questionsData = localStorage.getItem('questions');
        if (questionsData) {
          const questions = JSON.parse(questionsData);
          const nextQuestionId = session.questions[nextIndex];
          const nextQuestion = questions.find((q: Question) => q.id === nextQuestionId);
          
          if (nextQuestion) {
            console.log(`Setting next question: ${nextQuestion.text}`);
            setCurrentQuestion(nextQuestion);
            
            // Important: Check if this question has been submitted already
            const recordingsData = localStorage.getItem('recordings');
            if (recordingsData) {
              const recordings = JSON.parse(recordingsData);
              const existingRecording = recordings.find(
                (r: any) => r.candidateId === session.candidateId && r.questionId === nextQuestionId
              );
              
              if (existingRecording) {
                console.log(`Found existing recording for question ${nextQuestionId}, marking as submitted`);
                setRecordingSubmitted(true);
              } else {
                console.log(`No existing recording found for question ${nextQuestionId}`);
                setRecordingSubmitted(false);
              }
            } else {
              setRecordingSubmitted(false);
            }
          } else {
            console.error(`Next question (ID: ${nextQuestionId}) not found`);
            setError('Error loading next question. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error navigating to next question:', error);
        alert('There was a problem navigating to the next question. Please try again.');
      }
    } else {
      // Handle completion
      handleCompleteInterview();
    }
  };

  const handlePreviousQuestion = () => {
    if (!session || questionIndex <= 0) return;
    
    const prevIndex = questionIndex - 1;
    
    try {
      console.log(`Navigating to previous question (index: ${prevIndex})`);
      
      // Reset recording state for the new question
      setRecordingSubmitted(false);
      
      // Update local state
      setQuestionIndex(prevIndex);
      
      // Update URL with hash-based routing
      const newHash = `interview/${params.sessionId}?q=${prevIndex}`;
      console.log(`Setting new URL hash: ${newHash}`);
      window.location.hash = newHash;
      
      // Fetch the previous question
      const questionsData = localStorage.getItem('questions');
      if (questionsData) {
        const questions = JSON.parse(questionsData);
        const prevQuestionId = session.questions[prevIndex];
        const prevQuestion = questions.find((q: Question) => q.id === prevQuestionId);
        
        if (prevQuestion) {
          console.log(`Setting previous question: ${prevQuestion.text}`);
          setCurrentQuestion(prevQuestion);
          
          // Check if this question has been submitted already
          const recordingsData = localStorage.getItem('recordings');
          if (recordingsData) {
            const recordings = JSON.parse(recordingsData);
            const existingRecording = recordings.find(
              (r: any) => r.candidateId === session.candidateId && r.questionId === prevQuestionId
            );
            
            if (existingRecording) {
              console.log(`Found existing recording for question ${prevQuestionId}, marking as submitted`);
              setRecordingSubmitted(true);
            } else {
              console.log(`No existing recording found for question ${prevQuestionId}`);
              setRecordingSubmitted(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error navigating to previous question:', error);
      alert('There was a problem navigating to the previous question. Please try again.');
    }
  };

  const handleRecordingComplete = async (data: {
    audioUrl: string;
    transcript: string | null; // Updated to allow null
    candidateId: string;
    questionId: string;
  }) => {
    try {
      console.log(`Saving recording for question: ${data.questionId}`);

      // Ensure transcript is a string (not null)
      const safeTranscript = data.transcript || '';
      
      // Save recording to localStorage
      const recordingsData = localStorage.getItem('recordings');
      const recordings = recordingsData ? JSON.parse(recordingsData) : [];
      
      // Check if a recording for this question and candidate already exists
      const existingIndex = recordings.findIndex(
        (r: any) => r.candidateId === data.candidateId && r.questionId === data.questionId
      );
      
      // Add timestamp to the recording data
      const recordingWithTimestamp = {
        ...data,
        transcript: safeTranscript, // Use non-null transcript
        createdAt: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        // Update existing recording
        recordings[existingIndex] = recordingWithTimestamp;
        console.log(`Updated existing recording at index ${existingIndex}`);
      } else {
        // Add new recording
        recordings.push(recordingWithTimestamp);
        console.log(`Added new recording to recordings array`);
      }
      
      // Save to localStorage
      localStorage.setItem('recordings', JSON.stringify(recordings));
      console.log(`Saved recordings to localStorage. Total recordings: ${recordings.length}`);
      
      // Update session progress if needed
      if (session) {
        const sessionsData = localStorage.getItem('sessions');
        if (sessionsData) {
          const sessions = JSON.parse(sessionsData);
          const updatedSessions = sessions.map((s: Session) => {
            if (s.id === session.id) {
              // Make sure progress is at least the current question index
              const newProgress = Math.max(s.progress, questionIndex);
              console.log(`Updating session progress to ${newProgress}`);
              return { 
                ...s, 
                progress: newProgress
              };
            }
            return s;
          });
          
          localStorage.setItem('sessions', JSON.stringify(updatedSessions));
          console.log(`Updated session progress in localStorage`);
          
          // Update the session state
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              progress: Math.max(prev.progress, questionIndex)
            };
          });
        }
      }
      
      // Mark question as submitted
      setRecordingSubmitted(true);
      console.log(`Marked question as submitted`);
      
    } catch (error) {
      console.error('Error handling recording complete:', error);
      setError('Failed to save recording. Please try again.');
    }
  };

  const handleCompleteInterview = async () => {
    if (!session) return;
    
    // Update session as completed
    const sessionsData = localStorage.getItem('sessions');
    if (sessionsData) {
      const sessions = JSON.parse(sessionsData);
      const updatedSessions = sessions.map((s: Session) => {
        if (s.id === session.id) {
          return { ...s, isCompleted: true };
        }
        return s;
      });
      
      localStorage.setItem('sessions', JSON.stringify(updatedSessions));
    }
    
    setIsCompleted(true);
    // Navigate to completion page using hash-based routing
    window.location.hash = 'interview/complete';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 max-w-md">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error}</p>
          <div className="mt-4 flex space-x-4">
            <button 
              onClick={createDemoSession}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Demo Session
            </button>
            <button 
              onClick={() => window.location.href = '/interview'}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Return to Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 max-w-md text-center">
          <h3 className="text-lg font-medium mb-2">Interview Completed</h3>
          <p>Thank you for completing the interview. Your responses have been recorded.</p>
          <button 
            onClick={() => window.location.href = '/interview'}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Return to Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Interview Question {questionIndex + 1}</h1>
        <div className="h-2 bg-gray-200 rounded-full mb-4">
          <div 
            className="h-2 bg-blue-600 rounded-full" 
            style={{ width: `${((questionIndex + 1) / (session?.questions.length || 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {currentQuestion && session && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 flex-grow">
          <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
          
          {currentQuestion.category && (
            <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-4">
              {currentQuestion.category}
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex flex-col items-start">
              <button 
                className="mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                onClick={() => document.getElementById('question-audio-btn')?.click()}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 013.5-2.628"></path>
                </svg>
                Play Question Audio
              </button>
              
              <div className="hidden">
                <TextToSpeech 
                  text={currentQuestion.text} 
                  autoPlay={false}
                  voice="alloy"
                />
              </div>
              
              <button id="question-audio-btn" className="hidden" onClick={() => {
                const audioButton = document.querySelector('[aria-label="Play audio"]') as HTMLButtonElement;
                if (audioButton) {
                  audioButton.click();
                }
              }}></button>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Your Response</h3>
            <VoiceRecorder 
              questionId={currentQuestion.id}
              candidateId={session.candidateId}
              onRecordingComplete={handleRecordingComplete}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-auto">
        <button
          onClick={handlePreviousQuestion}
          disabled={questionIndex === 0}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous Question
        </button>
        
        <button
          onClick={handleNextQuestion}
          disabled={!recordingSubmitted}
          className={`px-4 py-2 border border-transparent rounded-md text-white ${
            questionIndex === (session?.questions.length || 0) - 1 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {questionIndex === (session?.questions.length || 0) - 1 ? 'Complete Interview' : 'Next Question'}
        </button>
      </div>
    </div>
  );
} 