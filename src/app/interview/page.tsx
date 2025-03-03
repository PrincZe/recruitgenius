'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

// Demo questions for local testing without database
const demoQuestions = [
  {
    id: 'question1',
    text: 'Tell me about your professional background and experience.',
    category: 'Background',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'question2',
    text: 'Describe a challenging project you worked on and how you overcame obstacles.',
    category: 'Experience',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'question3',
    text: 'Why are you interested in this position and what makes you a good fit?',
    category: 'Motivation',
    createdAt: new Date().toISOString(),
  },
];

export default function InterviewStartPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create a unique session ID
      const sessionId = uuidv4();
      const candidateId = uuidv4();
      
      // Store candidate and session data in localStorage
      const candidateData = {
        id: candidateId,
        name,
        email,
        sessionId,
        createdAt: new Date().toISOString(),
      };
      
      const sessionData = {
        id: sessionId,
        candidateId: candidateData.id,
        questions: demoQuestions.map(q => q.id),
        progress: 0,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      
      // Save to localStorage
      
      // Get existing candidates or initialize empty array
      const existingCandidates = JSON.parse(localStorage.getItem('candidates') || '[]');
      existingCandidates.push(candidateData);
      localStorage.setItem('candidates', JSON.stringify(existingCandidates));
      
      // Get existing sessions or initialize empty array
      const existingSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      existingSessions.push(sessionData);
      localStorage.setItem('sessions', JSON.stringify(existingSessions));
      
      // Also store the questions for easy access
      localStorage.setItem('questions', JSON.stringify(demoQuestions));
      
      // Redirect to the interview questions page
      router.push(`/interview/${sessionId}?q=0`);
    } catch (error) {
      console.error('Error starting interview:', error);
      setError('An error occurred while starting the interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Start Your Interview
        </h1>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Starting...' : 'Start Interview'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Instructions
                </span>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>In this interview, you will:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Hear questions presented in audio format</li>
                <li>Record your responses using your microphone</li>
                <li>Review and submit your answers</li>
              </ul>
              <p className="mt-2">Please ensure you have a working microphone and are in a quiet environment.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 