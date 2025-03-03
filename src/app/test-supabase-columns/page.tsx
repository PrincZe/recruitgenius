'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getQuestions, addQuestion } from '@/lib/services/supabaseService';
import { Question } from '@/lib/models/types';
import { Loader2, RefreshCw, Check, AlertTriangle } from 'lucide-react';

export default function TestColumnMappingsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testQuestion, setTestQuestion] = useState<string>('');
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedQuestions = await getQuestions();
      setQuestions(fetchedQuestions);
    } catch (err) {
      setError('Failed to fetch questions: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAddQuestion = async () => {
    if (!testQuestion.trim()) return;
    
    setAddingQuestion(true);
    setAddSuccess(false);
    setError(null);
    
    try {
      const questionId = await addQuestion({
        text: testQuestion,
        category: 'Test'
      });
      
      if (questionId) {
        setAddSuccess(true);
        setTestQuestion('');
        // Refresh the questions list
        fetchQuestions();
      } else {
        throw new Error('Failed to add question');
      }
    } catch (err) {
      setError('Failed to add question: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAddingQuestion(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test Column Mappings</h1>
      
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Add Test Question</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testQuestion}
            onChange={(e) => setTestQuestion(e.target.value)}
            placeholder="Enter a test question"
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleAddQuestion}
            disabled={addingQuestion || !testQuestion.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2"
          >
            {addingQuestion ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Question'
            )}
          </button>
        </div>
        
        {addSuccess && (
          <div className="p-3 bg-green-100 text-green-800 rounded flex items-center gap-2">
            <Check className="w-5 h-5" />
            Question added successfully!
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Questions List</h2>
          <button 
            onClick={fetchQuestions} 
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        
        {error && (
          <div className="p-4 mb-4 bg-red-100 text-red-800 rounded flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : questions.length === 0 ? (
          <p className="text-gray-500 py-4">No questions found. Add a question to get started.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="p-4 border border-gray-200 rounded">
                <div className="font-medium">{question.text}</div>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>Category: {question.category}</span>
                  <span>Created: {new Date(question.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
} 