'use client';

import { useState, useEffect } from 'react';
import { getQuestions, addCandidate, createSession } from '@/lib/services/supabaseService';
import { checkSupabaseConnection } from '@/lib/supabase/supabaseClient';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Define interfaces for our data
interface Question {
  id: string;
  text: string;
  category?: string;
  createdAt?: string;
}

export default function InterviewStartPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
  // Check Supabase connection on load
  useEffect(() => {
    async function checkConnection() {
      setIsCheckingConnection(true);
      try {
        const connected = await checkSupabaseConnection();
        setIsConnected(connected);
        if (!connected) {
          console.error('Failed to connect to Supabase');
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        setIsConnected(false);
      } finally {
        setIsCheckingConnection(false);
      }
    }
    
    checkConnection();
  }, []);

  const handleStartInterview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Basic form validation
      if (!fullName.trim() || !email.trim()) {
        throw new Error('Please provide both your name and email');
      }
      
      if (!email.includes('@') || !email.includes('.')) {
        throw new Error('Please provide a valid email address');
      }
      
      // Check Supabase connection again
      if (!isConnected) {
        throw new Error('Cannot connect to the database. Please try again later.');
      }
      
      // Get questions from Supabase
      let questions: Question[] = [];
      
      try {
        questions = await getQuestions();
        console.log(`Retrieved ${questions.length} questions from Supabase`);
      } catch (err) {
        console.error('Error fetching questions from Supabase:', err);
        throw new Error('Could not retrieve interview questions');
      }
      
      // Make sure we have questions
      if (!questions || questions.length === 0) {
        throw new Error('No questions available for the interview');
      }
      
      // Add candidate to database
      const candidateId = await addCandidate({
        name: fullName.trim(),
        email: email.trim()
      });
      
      if (!candidateId) {
        throw new Error('Failed to register candidate information');
      }
      
      // Create session
      const questionIds = questions.map(q => q.id);
      const sessionId = await createSession(candidateId, questionIds);
      
      if (!sessionId) {
        throw new Error('Failed to create interview session');
      }
      
      // Navigate to the interview page
      window.location.href = `/interview/${sessionId}?candidateId=${candidateId}`;
      
    } catch (error) {
      console.error('Error starting interview:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingConnection) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3">Connecting to database...</span>
      </div>
    );
  }

  if (isConnected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h2 className="text-xl font-semibold">Connection Error</h2>
        </div>
        <p className="text-center mb-4">
          Could not connect to the database. Please try again later or contact support.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Welcome to RecruitGenius</h2>
          <p className="text-gray-600">Please enter your details to start the interview</p>
        </div>
        
        <form onSubmit={handleStartInterview} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  id="fullName"
                  type="text"
              placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  id="email"
                  type="email"
              placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

              <button
                type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Starting Interview...
              </span>
            ) : (
              'Start Interview'
            )}
              </button>
          </form>
      </div>
    </div>
  );
} 