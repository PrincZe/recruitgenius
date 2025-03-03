'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  category: string;
  created_at: string;
}

export default function ListQuestionsPage() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/list-questions');
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions);
      } else {
        setError(data.message || 'Failed to fetch questions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <button 
          onClick={fetchQuestions} 
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">All Interview Questions</h1>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">Error: {error}</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No questions found in the database.</p>
            <p className="mt-2 text-sm">
              Follow the instructions in <code className="bg-gray-100 px-1 py-0.5 rounded">SUPABASE_SETUP.md</code> to add sample questions.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-gray-600">Found {questions.length} questions in the database:</p>
            
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-lg">{question.text}</p>
                      <div className="mt-2 flex items-center">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {question.category || 'No Category'}
                        </span>
                        <span className="ml-3 text-xs text-gray-500">
                          ID: {question.id}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(question.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link 
          href="/test-supabase-full" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Go to Comprehensive Supabase Test
        </Link>
      </div>
    </div>
  );
} 