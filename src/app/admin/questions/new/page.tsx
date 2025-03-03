'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addQuestion } from '@/lib/services/dataService';
import TextToSpeech from '@/components/TextToSpeech';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewQuestionPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text) {
      setError('Question text is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const questionId = await addQuestion({
        text,
        category: category || undefined,
      });
      
      if (!questionId) {
        throw new Error('Failed to create question');
      }
      
      // Redirect to questions list
      router.push('/admin');
    } catch (error) {
      console.error('Error creating question:', error);
      setError('An error occurred while creating the question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePreview = () => {
    if (!text) {
      setError('Please enter question text to preview');
      return;
    }
    
    setError(null);
    setPreviewMode(!previewMode);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Add New Question</h1>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          {previewMode ? (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Question Preview</h3>
                <p className="text-gray-700 p-4 bg-gray-50 rounded-lg mb-4">{text}</p>
                
                <div className="mb-6">
                  <TextToSpeech text={text} autoPlay={false} />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={togglePreview}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Edit Question
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="text" className="block text-sm font-medium text-gray-700">
                    Question Text
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="text"
                      name="text"
                      rows={4}
                      required
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter the interview question..."
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category (Optional)
                  </label>
                  <div className="mt-1">
                    <input
                      id="category"
                      name="category"
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., Technical, Experience, Background"
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

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={togglePreview}
                    disabled={!text}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Preview Question
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !text}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save Question'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 