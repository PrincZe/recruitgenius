'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Session, Question } from '@/lib/models/types';
import { 
  getQuestions, 
  addCandidate, 
  createSession,
  addQuestion
} from '@/lib/services/supabaseService';
import { checkSupabaseConnection } from '@/lib/supabase/supabaseClient';
import InterviewQuestionsClient from './[sessionId]/InterviewQuestionsClient';
import { Loader2 } from 'lucide-react';

// Demo questions to use if supabase is not available
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

// Hash Router component to handle hash-based navigation
function HashRouter({ children }: { children: React.ReactNode }) {
  const [currentHash, setCurrentHash] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize with data if needed
    const initializeData = async () => {
      try {
        // Check Supabase connection
        const connectionStatus = await checkSupabaseConnection();
        console.log('Supabase connection status:', connectionStatus);
        
        // Ensure questions exist
        const questions = await getQuestions();
        if (questions.length === 0) {
          console.log('No questions found in Supabase, fallback to localStorage');
          
          // Fallback to localStorage if Supabase has no questions
          const questionsData = localStorage.getItem('questions');
          if (!questionsData || JSON.parse(questionsData).length === 0) {
            localStorage.setItem('questions', JSON.stringify(demoQuestions));
            console.log('Added demo questions to localStorage');
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        
        // Fallback to localStorage if Supabase fails
        const questionsData = localStorage.getItem('questions');
        if (!questionsData || JSON.parse(questionsData).length === 0) {
          localStorage.setItem('questions', JSON.stringify(demoQuestions));
          console.log('Added demo questions to localStorage');
        }
      }
      
      setInitialized(true);
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    
    // Function to handle hash changes
    const handleHashChange = () => {
      const hash = window.location.hash;
      setCurrentHash(hash);
      
      // Parse the hash to extract sessionId
      if (hash.startsWith('#interview/')) {
        const pathParts = hash.substring(12).split('?'); // Remove '#interview/'
        const id = pathParts[0];
        setSessionId(id);
      } else {
        setSessionId(null);
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
  }, [initialized]);

  // If we have a sessionId, render the interview questions
  if (sessionId) {
    return <InterviewQuestionsClient params={{ sessionId }} />;
  }

  // Otherwise, render the default content
  return <>{children}</>;
}

export default function InterviewStartPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    // Initialize check - no longer needs to set localStorage directly
    const checkConnection = async () => {
      try {
        const connectionStatus = await checkSupabaseConnection();
        if (!connectionStatus.success) {
          console.warn('Supabase connection failed. Using localStorage as fallback.');
        }
      } catch (error) {
        console.error('Error checking Supabase connection:', error);
      }
    };
    
    checkConnection();
  }, []);

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get questions from Supabase
      let questions = await getQuestions();
      
      // Fallback to localStorage if no questions in Supabase
      if (questions.length === 0) {
        const questionsData = localStorage.getItem('questions');
        questions = questionsData ? JSON.parse(questionsData) : demoQuestions;
        
        console.log('Using demo or localStorage questions instead of Supabase');
        
        // If using demo questions, we need to add them to Supabase for future use
        if (questions === demoQuestions) {
          console.log('Attempting to seed demo questions to Supabase for future use');
          try {
            // Add demo questions to Supabase one by one
            for (const question of demoQuestions) {
              await addQuestion({
                text: question.text,
                category: question.category || 'General'
              });
            }
            console.log('Successfully added demo questions to Supabase');
          } catch (error) {
            console.error('Failed to add demo questions to Supabase:', error);
          }
        }
      }
      
      if (questions.length === 0) {
        throw new Error('No questions available');
      }

      // Create a new candidate in Supabase
      const candidateData = {
        name: fullName,
        email: email
      };
      
      const candidateId = await addCandidate(candidateData);
      
      if (!candidateId) {
        throw new Error('Failed to create candidate');
      }
      
      // Store in localStorage for session recovery
      localStorage.setItem('candidateId', candidateId);
      
      // Create a new session in Supabase
      const questionIds = questions.map((q: Question) => q.id);
      const sessionId = await createSession(candidateId, questionIds);
      
      if (!sessionId) {
        throw new Error('Failed to create session');
      }
      
      // Store the session ID for recovery
      localStorage.setItem('sessionId', sessionId);
      
      // Navigate to the interview questions
      window.location.hash = `interview/${sessionId}?q=0`;
    } catch (error) {
      console.error('Error starting interview:', error);
      setError('An error occurred while starting the interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const InterviewForm = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Start Your Interview
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleStartInterview}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up your interview...
                  </>
                ) : (
                  'Start Interview'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Instructions</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>In this interview, you will:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Hear questions presented in audio format</li>
                <li>Record your responses using your microphone</li>
                <li>Review and submit your answers</li>
              </ul>
              <p className="mt-4">
                Please ensure you have a working microphone and are in a quiet environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <HashRouter>
      <InterviewForm />
    </HashRouter>
  );
} 