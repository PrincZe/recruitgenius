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

        // Get session data from localStorage
        const sessionsData = localStorage.getItem('sessions');
        if (!sessionsData) {
          setError('No sessions found. Would you like to create a demo session?');
          setLoading(false);
          return;
        }

        const sessions = JSON.parse(sessionsData);
        const session = sessions.find((s: Session) => s.id === params.sessionId);
        
        if (!session) {
          setError('Session not found. Would you like to create a demo session?');
          setLoading(false);
          return;
        }

        setSession(session);

        // Get questions data
        const questionsData = localStorage.getItem('questions');
        if (!questionsData) {
          setError('No questions found. Would you like to create demo questions?');
          setLoading(false);
          return;
        }

        const questions = JSON.parse(questionsData);
        
        // Get current question based on query parameter
        if (session.questions.length > questionIndex) {
          const questionId = session.questions[questionIndex];
          const question = questions.find((q: Question) => q.id === questionId);
          
          if (question) {
            setCurrentQuestion(question);
          } else {
            setError('Question not found. Would you like to create demo questions?');
          }
        } else {
          setError('Invalid question index. Would you like to create a demo session?');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching session data:', error);
        setError('An error occurred while loading the interview. Would you like to create a demo session?');
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [params.sessionId, questionIndex]);

  const createDemoSession = () => {
    try {
      // Create demo questions if needed
      const questionsData = localStorage.getItem('questions');
      if (!questionsData || JSON.parse(questionsData).length === 0) {
        localStorage.setItem('questions', JSON.stringify(demoQuestions));
        console.log('Added demo questions to localStorage');
      }
      
      // Use existing questions or demo questions
      const questions = questionsData ? JSON.parse(questionsData) : demoQuestions;
      
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
      
      // Create a new session
      const newSession: Session = {
        id: params.sessionId, // Use the current sessionId from URL
        candidateId,
        questions: questions.map((q: Question) => q.id),
        progress: questionIndex, // Set progress to current question index
        isCompleted: false,
        createdAt: new Date().toISOString()
      };
      
      // Save session to localStorage
      const sessionsData = localStorage.getItem('sessions');
      const sessions = sessionsData ? JSON.parse(sessionsData) : [];
      
      // Remove any existing session with the same ID to avoid duplicates
      const filteredSessions = sessions.filter((s: Session) => s.id !== params.sessionId);
      filteredSessions.push(newSession);
      localStorage.setItem('sessions', JSON.stringify(filteredSessions));
      
      // Also create empty recordings for previous questions if needed
      const recordingsData = localStorage.getItem('recordings');
      const recordings = recordingsData ? JSON.parse(recordingsData) : [];
      
      // Create dummy recordings for previous questions to allow navigation
      if (questionIndex > 0) {
        for (let i = 0; i < questionIndex; i++) {
          const questionId = questions[i].id;
          const existingRecording = recordings.find(
            (r: any) => r.candidateId === candidateId && r.questionId === questionId
          );
          
          if (!existingRecording) {
            recordings.push({
              audioUrl: "",
              transcript: "Auto-generated response for demo",
              candidateId: candidateId,
              questionId: questionId,
              createdAt: new Date().toISOString()
            });
          }
        }
        localStorage.setItem('recordings', JSON.stringify(recordings));
      }
      
      // Reload the page to load the new session - but preserve the current hash to stay on the same question
      window.location.reload();
    } catch (error) {
      console.error('Error creating demo session:', error);
      setError('Failed to create demo session. Please try refreshing the page.');
    }
  };

  const handleNextQuestion = () => {
    if (!session) return;
    
    const nextIndex = questionIndex + 1;
    
    if (nextIndex < session.questions.length) {
      // Update URL with hash-based routing
      window.location.hash = `interview/${params.sessionId}?q=${nextIndex}`;
      setQuestionIndex(nextIndex);
      setRecordingSubmitted(false);
      
      // Fetch the next question
      const questionsData = localStorage.getItem('questions');
      if (questionsData) {
        const questions = JSON.parse(questionsData);
        const questionId = session.questions[nextIndex];
        const question = questions.find((q: Question) => q.id === questionId);
        
        if (question) {
          setCurrentQuestion(question);
        }
      }
    } else {
      // All questions completed
      handleCompleteInterview();
    }
  };

  const handlePreviousQuestion = () => {
    if (questionIndex > 0) {
      const prevIndex = questionIndex - 1;
      // Update URL with hash-based routing
      window.location.hash = `interview/${params.sessionId}?q=${prevIndex}`;
      setQuestionIndex(prevIndex);
      setRecordingSubmitted(false);
      
      // Fetch the previous question
      const questionsData = localStorage.getItem('questions');
      if (questionsData) {
        const questions = JSON.parse(questionsData);
        const questionId = session?.questions[prevIndex];
        const question = questions.find((q: Question) => q.id === questionId);
        
        if (question) {
          setCurrentQuestion(question);
        }
      }
    }
  };

  const handleRecordingComplete = (data: {
    audioUrl: string;
    transcript: string;
    candidateId: string;
    questionId: string;
  }) => {
    try {
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
      } else {
        // Add new recording
        recordings.push(recordingWithTimestamp);
      }
      
      // Save to localStorage
      localStorage.setItem('recordings', JSON.stringify(recordings));
      
      // Update session progress if needed
      if (session) {
        const sessionsData = localStorage.getItem('sessions');
        if (sessionsData) {
          const sessions = JSON.parse(sessionsData);
          const updatedSessions = sessions.map((s: Session) => {
            if (s.id === session.id) {
              return { 
                ...s, 
                progress: Math.max(s.progress, questionIndex + 1) 
              };
            }
            return s;
          });
          
          localStorage.setItem('sessions', JSON.stringify(updatedSessions));
        }
      }
      
      // Mark recording as submitted to enable the next button
      setRecordingSubmitted(true);
      
      console.log('Recording saved successfully');
    } catch (error) {
      console.error('Error saving recording:', error);
      alert('There was a problem saving your recording. Please try again.');
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