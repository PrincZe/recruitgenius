'use client';

import { useState, useEffect } from 'react';
import { Session, Question } from '@/lib/models/types';
import TextToSpeech from '@/components/TextToSpeech';
import VoiceRecorder from '@/components/VoiceRecorder';
import { v4 as uuidv4 } from 'uuid';

// Demo questions to use if none exist in localStorage
const demoQuestions = [
  {
    id: "q1",
    text: "Tell me about your background and experience.",
    category: "Background",
    createdAt: new Date().toISOString()
  },
  {
    id: "q2",
    text: "What are your strengths and weaknesses?",
    category: "Personal",
    createdAt: new Date().toISOString()
  },
  {
    id: "q3",
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

  useEffect(() => {
    // Parse query parameters from hash
    const hash = window.location.hash;
    const queryParams = new URLSearchParams(hash.split('?')[1] || '');
    const qParam = queryParams.get('q');
    
    if (qParam !== null) {
      setQuestionIndex(parseInt(qParam, 10));
    }
    
    // Define fetchSessionData inside useEffect to avoid dependency issues
    const fetchSessionData = () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Attempting to fetch session data for ID: ${params.sessionId}, Question index: ${questionIndex}`);

        // Get session data from localStorage
        const sessionsData = localStorage.getItem('sessions');
        if (!sessionsData) {
          console.error('No sessions found in localStorage');
          setError('No sessions found. Would you like to create a demo session?');
          setLoading(false);
          return;
        }

        const sessions = JSON.parse(sessionsData);
        console.log(`Found ${sessions.length} sessions in localStorage`);
        
        // Log all available session IDs for debugging
        console.log('Available session IDs:', sessions.map((s: Session) => s.id));
        
        // Find the session by ID - make sure to trim any whitespace
        const sessionId = params.sessionId.trim();
        const session = sessions.find((s: Session) => s.id.trim() === sessionId);
        
        if (!session) {
          console.error(`Session with ID ${sessionId} not found in ${sessions.length} available sessions`);
          
          // Check if this is a new session ID or if we need to recover
          // If there are existing sessions and the URL has a hash with 'interview/', attempt recovery
          if (sessions.length > 0 && window.location.hash.includes('interview/')) {
            console.log('Attempting to recover using the most recent session');
            
            // Sort sessions by createdAt (most recent first)
            const sortedSessions = [...sessions].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            // Use the most recent session
            const mostRecentSession = sortedSessions[0];
            console.log(`Recovering with session ID: ${mostRecentSession.id}`);
            
            // Update the URL to match the session we found
            window.location.hash = `interview/${mostRecentSession.id}?q=${questionIndex}`;
            
            // Continue with this session instead
            setSession(mostRecentSession);
            fetchQuestionData(mostRecentSession);
            return;
          }
          
          setError('Session not found. Would you like to create a demo session?');
          setLoading(false);
          return;
        }

        console.log(`Found session: ${session.id}, Progress: ${session.progress}, Questions: ${session.questions.length}`);
        setSession(session);
        
        // Fetch the question data
        fetchQuestionData(session);
      } catch (error) {
        console.error('Error fetching session data:', error);
        setError('Error loading session data. Would you like to create a demo session?');
        setLoading(false);
      }
    };
    
    // Function to fetch question data
    const fetchQuestionData = (session: Session) => {
      try {
        const questionsData = localStorage.getItem('questions');
        if (!questionsData) {
          console.error('No questions found in localStorage');
          setError('No questions found. Would you like to create a demo session?');
          setLoading(false);
          return;
        }
        
        const questions = JSON.parse(questionsData);
        console.log(`Found ${questions.length} questions in localStorage`);
        
        // Ensure the question index is valid
        const validIndex = Math.min(questionIndex, session.questions.length - 1);
        if (validIndex !== questionIndex) {
          console.log(`Adjusting question index from ${questionIndex} to ${validIndex}`);
          setQuestionIndex(validIndex);
        }
        
        // Get the current question ID from the session
        const questionId = session.questions[validIndex];
        if (!questionId) {
          console.error(`Question ID not found at index ${validIndex}`);
          setError('Question not found. Would you like to create a demo session?');
          setLoading(false);
          return;
        }
        
        console.log(`Looking for question ID: ${questionId} at index ${validIndex}`);
        
        // Find the question by ID
        const question = questions.find((q: Question) => q.id === questionId);
        if (!question) {
          console.error(`Question with ID ${questionId} not found in questions list`);
          setError('Question details not found. Would you like to create a demo session?');
          setLoading(false);
          return;
        }
        
        console.log(`Found question: ${question.text}`);
        setCurrentQuestion(question);
        
        // Check if this question has been submitted already
        const recordingsData = localStorage.getItem('recordings');
        if (recordingsData) {
          const recordings = JSON.parse(recordingsData);
          const hasRecording = recordings.some(
            (r: any) => r.candidateId === session.candidateId && r.questionId === questionId
          );
          setRecordingSubmitted(hasRecording);
          console.log(`Question ${hasRecording ? 'has' : 'has not'} been submitted already`);
        } else {
          setRecordingSubmitted(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching question data:', error);
        setError('Error loading question data. Would you like to create a demo session?');
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [params.sessionId, questionIndex]);

  const createDemoSession = () => {
    try {
      console.log(`Creating a demo session with ID: ${params.sessionId}`);
      
      // Create demo questions if needed
      const questionsData = localStorage.getItem('questions');
      if (!questionsData || JSON.parse(questionsData).length === 0) {
        localStorage.setItem('questions', JSON.stringify(demoQuestions));
        console.log('Added demo questions to localStorage');
      }
      
      // Use existing questions or demo questions
      const questions = questionsData ? JSON.parse(questionsData) : demoQuestions;
      console.log(`Using ${questions.length} questions for demo session`);
      
      // Create a demo candidate
      const candidateId = uuidv4();
      const candidate = {
        id: candidateId,
        name: "Demo User",
        email: "demo@example.com",
        createdAt: new Date().toISOString()
      };
      
      // Save candidate to localStorage
      const candidatesData = localStorage.getItem('candidates');
      const candidates = candidatesData ? JSON.parse(candidatesData) : [];
      candidates.push(candidate);
      localStorage.setItem('candidates', JSON.stringify(candidates));
      console.log(`Added demo candidate with ID: ${candidateId}`);
      
      // Use the same session ID consistently
      // This prevents issues when refreshing or navigating
      const sessionId = params.sessionId.trim();
      
      // Create a new session
      const newSession: Session = {
        id: sessionId,
        candidateId,
        questions: questions.map((q: Question) => q.id),
        progress: 0, // Always start at the first question
        isCompleted: false,
        createdAt: new Date().toISOString()
      };
      
      // Save session to localStorage
      const sessionsData = localStorage.getItem('sessions');
      const sessions = sessionsData ? JSON.parse(sessionsData) : [];
      
      // Check if session already exists
      const existingSessionIndex = sessions.findIndex((s: Session) => s.id.trim() === sessionId);
      if (existingSessionIndex >= 0) {
        // Update existing session
        console.log(`Updating existing session at index ${existingSessionIndex}`);
        sessions[existingSessionIndex] = newSession;
      } else {
        // Add new session
        console.log(`Adding new session with ID ${sessionId}`);
        sessions.push(newSession);
      }
      
      localStorage.setItem('sessions', JSON.stringify(sessions));
      console.log(`Created demo session and saved to localStorage. Total sessions: ${sessions.length}`);
      
      // Clear any existing recordings for this session to start fresh
      const recordingsData = localStorage.getItem('recordings');
      if (recordingsData) {
        const recordings = JSON.parse(recordingsData);
        const filteredRecordings = recordings.filter(
          (r: any) => r.candidateId !== candidateId
        );
        localStorage.setItem('recordings', JSON.stringify(filteredRecordings));
        console.log(`Removed any existing recordings for candidate ${candidateId}`);
      }
      
      // Get the current question
      const currentQuestionId = questions[0]?.id;
      if (!currentQuestionId) {
        throw new Error('No question found');
      }
      
      const currentQuestion = questions.find((q: Question) => q.id === currentQuestionId);
      if (!currentQuestion) {
        throw new Error('Question not found');
      }
      
      // Update state immediately
      setSession(newSession);
      setCurrentQuestion(currentQuestion);
      setQuestionIndex(0); // Reset to first question
      setLoading(false);
      setError(null);
      setRecordingSubmitted(false);
      
      console.log(`Successfully created and loaded demo session with question: ${currentQuestion.text}`);
      
      // Update the URL to ensure consistency
      const newHash = `interview/${sessionId}?q=0`;
      console.log(`Setting URL hash to: ${newHash}`);
      window.location.hash = newHash;
      
      // Reload the page to ensure everything is fresh
      window.location.reload();
      
      return true;
    } catch (error) {
      console.error('Error creating demo session:', error);
      setError('Failed to create demo session. Please try refreshing the page.');
      setLoading(false);
      return false;
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

  const handleRecordingComplete = (data: {
    audioUrl: string;
    transcript: string;
    candidateId: string;
    questionId: string;
  }) => {
    try {
      console.log(`Saving recording for question: ${data.questionId}`);
      
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
      } else {
        console.error('No session found when trying to update progress');
        // Try to recreate session if it's missing
        createDemoSession();
        // Note: No need to set session or currentQuestion here as createDemoSession 
        // either updates state directly or forces a page reload
      }
      
      // Mark question as submitted
      setRecordingSubmitted(true);
      console.log(`Marked question as submitted`);
      
    } catch (error) {
      console.error('Error saving recording:', error);
      alert('There was an issue saving your recording. Please try again.');
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
            <TextToSpeech 
              text={currentQuestion.text} 
              autoPlay={true}
            />
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