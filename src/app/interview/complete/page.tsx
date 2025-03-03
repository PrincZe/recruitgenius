'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Session } from '@/lib/models/types';
import { CheckCircle, Loader2 } from 'lucide-react';

// Get session from localStorage
const getSessionById = async (id: string): Promise<Session | null> => {
  try {
    // Try to get sessions from localStorage
    const storedSessions = localStorage.getItem('sessions');
    if (storedSessions) {
      const sessions: Session[] = JSON.parse(storedSessions);
      const session = sessions.find(s => s.id === id);
      if (session) {
        return session;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error getting session with ID ${id}:`, error);
    return null;
  }
};

export default function InterviewCompletePage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedSession = await getSessionById(sessionId);
        
        if (!fetchedSession) {
          setError('Session not found');
          setLoading(false);
          return;
        }
        
        setSession(fetchedSession);
      } catch (error) {
        console.error('Error fetching session data:', error);
        setError('An error occurred while loading your session data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
          <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error || 'An unexpected error occurred.'}</p>
          <Link 
            href="/interview"
            className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Start
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Interview Complete
        </h1>
        
        <p className="text-lg text-gray-700 mb-8">
          Thank you for completing your interview. Your responses have been recorded successfully.
        </p>
        
        <div className="rounded-lg bg-blue-50 p-4 mb-8">
          <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
          <p className="text-blue-700 text-sm">
            The hiring team will review your responses and get back to you if they&apos;d like to proceed with your application.
          </p>
        </div>
        
        <Link 
          href="/"
          className="inline-block w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
} 