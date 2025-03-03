'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Session, Question } from '@/lib/models/types';
import TextToSpeech from '@/components/TextToSpeech';
import VoiceRecorder from '@/components/VoiceRecorder';
import { ChevronRight, ChevronLeft, Loader2, CheckCircle } from 'lucide-react';

export default function InterviewQuestionsClient({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionIndex = parseInt(searchParams.get('q') || '0');
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordingSubmitted, setRecordingSubmitted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const fetchSessionData = () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get sessions from localStorage
        const sessionsData = localStorage.getItem('sessions');
        
        if (!sessionsData) {
          setError('No sessions found');
          setLoading(false);
          return;
        }
        
        const sessions = JSON.parse(sessionsData) as Session[];
        const fetchedSession = sessions.find(s => s.id === params.sessionId);
        
        if (!fetchedSession) {
          setError('Interview session not found');
          setLoading(false);
          return;
        }
        
        setSession(fetchedSession);
        
        // Get the current question ID from the session questions array
        const questionId = fetchedSession.questions[questionIndex];
        if (!questionId) {
          setError('Question not found');
          setLoading(false);
          return;
        }
        
        // Get questions from localStorage
        const questionsData = localStorage.getItem('questions');
        if (!questionsData) {
          setError('Questions not found');
          setLoading(false);
          return;
        }
        
        const questions = JSON.parse(questionsData) as Question[];
        const questionData = questions.find(q => q.id === questionId);
        
        if (!questionData) {
          setError('Question not found');
          setLoading(false);
          return;
        }
        
        setCurrentQuestion(questionData);
      } catch (error) {
        console.error('Error fetching session data:', error);
        setError('An error occurred while loading the interview. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [params.sessionId, questionIndex]);

  const handleNextQuestion = () => {
    if (!session) return;
    
    const nextIndex = questionIndex + 1;
    if (nextIndex < session.questions.length) {
      // Update session progress in localStorage
      const updatedSession = { ...session, progress: nextIndex };
      
      // Update the session in the sessions array
      const sessionsData = localStorage.getItem('sessions');
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData) as Session[];
        const sessionIndex = sessions.findIndex(s => s.id === session.id);
        if (sessionIndex !== -1) {
          sessions[sessionIndex] = updatedSession;
          localStorage.setItem('sessions', JSON.stringify(sessions));
        }
      }
      
      router.push(`/interview/${params.sessionId}?q=${nextIndex}`);
      setRecordingSubmitted(false);
    } else {
      handleCompleteInterview();
    }
  };

  const handlePreviousQuestion = () => {
    if (questionIndex > 0) {
      router.push(`/interview/${params.sessionId}?q=${questionIndex - 1}`);
      setRecordingSubmitted(false);
    }
  };

  const handleRecordingComplete = (data: {
    audioUrl: string;
    transcript: string;
    candidateId: string;
    questionId: string;
  }) => {
    console.log('Recording completed successfully for question:', data.questionId);
    console.log('Transcript length:', data.transcript.length);
    console.log('Audio URL starts with:', data.audioUrl.substring(0, 30) + '...');
    
    // Always set recording as submitted, even if there are issues with the audio
    setRecordingSubmitted(true);
  };

  const handleCompleteInterview = async () => {
    try {
      setIsCompleting(true);
      
      // Update the session as completed in localStorage
      if (session) {
        const updatedSession = { 
          ...session, 
          progress: session.questions.length,
          isCompleted: true,
          completedAt: new Date().toISOString()
        };
        
        // Update the session in the sessions array
        const sessionsData = localStorage.getItem('sessions');
        if (sessionsData) {
          const sessions = JSON.parse(sessionsData) as Session[];
          const sessionIndex = sessions.findIndex(s => s.id === session.id);
          if (sessionIndex !== -1) {
            sessions[sessionIndex] = updatedSession;
            localStorage.setItem('sessions', JSON.stringify(sessions));
          }
        }
      }
      
      // Redirect to the completion page
      router.push(`/interview/complete?sessionId=${params.sessionId}`);
    } catch (error) {
      console.error('Error completing interview:', error);
      setError('An error occurred while completing the interview.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
          <p className="mt-4 text-lg font-medium text-gray-700">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error || !session || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => router.push('/interview')}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Start
          </button>
        </div>
      </div>
    );
  }

  const isLastQuestion = questionIndex === session.questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Interview Question {questionIndex + 1}</h1>
            <div className="text-sm text-gray-500">
              Question {questionIndex + 1} of {session.questions.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-300 ease-in-out" 
              style={{ width: `${((questionIndex + 1) / session.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">{currentQuestion.text}</h2>
            <div className="mb-6">
              <TextToSpeech 
                text={currentQuestion.text} 
                autoPlay={true}
                onPlaybackStarted={() => console.log('Question playback started')}
                onPlaybackEnded={() => console.log('Question playback ended')}
              />
            </div>
            
            <div className="mt-8">
              {recordingSubmitted ? (
                <div className="flex items-center justify-center p-6 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  <span className="text-green-700 font-medium">Response submitted successfully!</span>
                </div>
              ) : (
                <VoiceRecorder 
                  questionId={currentQuestion.id} 
                  candidateId={session.candidateId}
                  onRecordingComplete={handleRecordingComplete}
                />
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={questionIndex === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </button>
            
            <button
              onClick={isLastQuestion ? handleCompleteInterview : handleNextQuestion}
              disabled={!recordingSubmitted && !isCompleting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastQuestion ? (
                isCompleting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-1 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Complete Interview'
                )
              ) : (
                <>
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Debug information */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
          <p>Recording submitted: {recordingSubmitted ? 'Yes' : 'No'}</p>
          <p>Current question index: {questionIndex}</p>
          <p>Total questions: {session.questions.length}</p>
          <p>Is last question: {isLastQuestion ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
} 