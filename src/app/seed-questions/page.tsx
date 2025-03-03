'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, CheckCircle, XCircle, Home, Database } from 'lucide-react';

export default function SeedQuestionsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    questions?: any[];
    questionsCount?: number;
  } | null>(null);

  const seedQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seed-questions');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Seed Sample Questions</h1>
      
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <p className="mb-4 text-gray-700">
          This page will help you add sample interview questions to your database.
          Click the button below to seed 10 common interview questions across different categories.
        </p>
        
        <p className="mb-6 text-gray-700">
          Note: If questions already exist in the database, no new questions will be added.
        </p>
        
        <div className="flex justify-center">
          <button
            onClick={seedQuestions}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Seeding Questions...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Seed Sample Questions
              </>
            )}
          </button>
        </div>
      </div>
      
      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          <div className="flex items-center gap-2 mb-4">
            {results.success ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <span className={`font-medium ${results.success ? 'text-green-700' : 'text-red-700'}`}>
              {results.success ? 'Success' : 'Error'}
            </span>
          </div>
          
          {results.message && (
            <p className="mb-4 text-gray-700">{results.message}</p>
          )}
          
          {results.error && (
            <p className="mb-4 text-red-600">{results.error}</p>
          )}
          
          {results.questions && results.questions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Added Questions:</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                  {results.questions.map((question, index) => (
                    <li key={index} className="p-3 bg-white rounded border">
                      <p className="font-medium">{question.text}</p>
                      <p className="text-sm text-gray-600">Category: {question.category}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {results.questionsCount && results.questionsCount > 0 && (
            <p className="mt-4 text-gray-700">
              Your database already contains {results.questionsCount} questions.
            </p>
          )}
          
          <div className="mt-8 flex flex-wrap gap-4">
            <Link 
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Return to Home
            </Link>
            
            <Link 
              href="/debug-schema"
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              View Database Schema
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 