'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Session, Question } from '@/lib/models/types';

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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get questions from localStorage
      const questionsData = localStorage.getItem('questions');
      const questions: Question[] = questionsData ? JSON.parse(questionsData) : [];
      
      if (questions.length === 0) {
        throw new Error('No questions available');
      }

      // Create a new candidate
      const candidateId = uuidv4();
      const candidate = {
        id: candidateId,
        name: fullName,
        email: email,
        createdAt: new Date().toISOString()
      };

      // Save candidate to localStorage
      const candidatesData = localStorage.getItem('candidates');
      const candidates = candidatesData ? JSON.parse(candidatesData) : [];
      candidates.push(candidate);
      localStorage.setItem('candidates', JSON.stringify(candidates));

      // Create a new session
      const session: Session = {
        id: uuidv4(),
        candidateId,
        questions: questions.map((q: Question) => q.id),
        progress: 0,
        isCompleted: false,
        createdAt: new Date().toISOString()
      };

      // Save session to localStorage
      const sessionsData = localStorage.getItem('sessions');
      const sessions = sessionsData ? JSON.parse(sessionsData) : [];
      sessions.push(session);
      localStorage.setItem('sessions', JSON.stringify(sessions));

      // Navigate to the first question
      // Use hash-based routing for static export compatibility
      window.location.hash = `interview/${session.id}?q=0`;
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('An error occurred while starting the interview. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Start Your Interview
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Interview
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
} 