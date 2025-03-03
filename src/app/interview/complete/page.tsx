'use client';

import { useState, useEffect } from 'react';
import { Session, Candidate } from '@/lib/models/types';

const getSessionById = async (id: string): Promise<Session | null> => {
  try {
    const sessionsData = localStorage.getItem('sessions');
    if (!sessionsData) return null;
    
    const sessions = JSON.parse(sessionsData);
    return sessions.find((s: Session) => s.id === id) || null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

const getCandidateById = async (id: string): Promise<Candidate | null> => {
  try {
    const candidatesData = localStorage.getItem('candidates');
    if (!candidatesData) return null;
    
    const candidates = JSON.parse(candidatesData);
    return candidates.find((c: Candidate) => c.id === id) || null;
  } catch (error) {
    console.error('Error getting candidate:', error);
    return null;
  }
};

// Hash Router component to handle hash-based navigation
function HashRouter({ children }: { children: React.ReactNode }) {
  const [currentHash, setCurrentHash] = useState<string>('');
  const [isCompletePage, setIsCompletePage] = useState(false);

  useEffect(() => {
    // Function to handle hash changes
    const handleHashChange = () => {
      const hash = window.location.hash;
      setCurrentHash(hash);
      
      // Check if this is the complete page
      if (hash.startsWith('#interview/complete')) {
        setIsCompletePage(true);
      } else {
        setIsCompletePage(false);
      }
    };

    // Set initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // If we're on the complete page, render the complete content
  if (isCompletePage) {
    return <InterviewCompleteContent />;
  }

  // Otherwise, render the default content
  return <>{children}</>;
}

function InterviewCompleteContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionData();
  }, []);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      
      // Get sessions from localStorage
      const sessionsData = localStorage.getItem('sessions');
      if (!sessionsData) {
        setError('No sessions found');
        setLoading(false);
        return;
      }
      
      const sessions = JSON.parse(sessionsData);
      
      // Get the most recently completed session
      const completedSessions = sessions.filter((s: Session) => s.isCompleted);
      if (completedSessions.length === 0) {
        setError('No completed sessions found');
        setLoading(false);
        return;
      }
      
      // Sort by createdAt in descending order and get the most recent
      const sortedSessions = completedSessions.sort((a: Session, b: Session) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const latestSession = sortedSessions[0];
      setSession(latestSession);
      
      // Get candidate data
      const candidateData = await getCandidateById(latestSession.candidateId);
      setCandidate(candidateData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching session data:', error);
      setError('An error occurred while loading the completion page.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 max-w-md">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error || 'An unexpected error occurred.'}</p>
          <button 
            onClick={() => window.location.href = '/interview'}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Return to Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Interview Completed</h1>
          <div className="bg-green-100 text-green-800 rounded-full px-4 py-1 inline-flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Success
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Thank You for Completing Your Interview</h2>
            
            {candidate && (
              <div className="mb-6">
                <p className="text-gray-600 mb-2">Name: <span className="font-medium text-gray-900">{candidate.name}</span></p>
                <p className="text-gray-600">Email: <span className="font-medium text-gray-900">{candidate.email}</span></p>
              </div>
            )}
            
            <div className="prose max-w-none text-gray-600">
              <p>Your responses have been recorded successfully. The hiring team will review your interview and get back to you soon.</p>
              <p className="mt-4">If you have any questions about the interview process, please contact the hiring team.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => window.location.href = '/interview'}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Start
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InterviewCompletePage() {
  return (
    <HashRouter>
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-6">
            The interview completion page is only accessible after completing an interview.
          </p>
          <button
            onClick={() => window.location.href = '/interview'}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Interview Start
          </button>
        </div>
      </div>
    </HashRouter>
  );
} 