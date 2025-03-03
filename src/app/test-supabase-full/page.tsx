'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Database, HardDrive, RefreshCw } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  tests: {
    database: {
      success: boolean;
      questionsTable?: {
        exists: boolean;
        count: number;
        sample: any;
      };
      candidatesTable?: {
        exists: boolean;
        error: string | null;
        count: number;
        sample: any;
      };
      error?: string;
    };
    storage: {
      success: boolean;
      buckets?: {
        count: number;
        names: string[];
      };
      recordingsBucket?: {
        exists: boolean;
        details: any;
      };
      error?: string;
    };
  };
  error?: string;
}

export default function TestSupabaseFullPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-supabase-full');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <button 
          onClick={runTest} 
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Testing...' : 'Run Test Again'}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mb-4" />
            <p className="text-gray-600">Testing Supabase connection...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">Error: {error}</p>
            </div>
          </div>
        ) : result ? (
          <div>
            <div className={`mb-6 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {result.success ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 mr-2" />
                )}
                <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                  {result.message}
                </p>
              </div>
              {result.error && <p className="mt-2 text-red-600">Error: {result.error}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Test Results */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <Database className="h-5 w-5 mr-2 text-blue-600" />
                  <h2 className="text-xl font-semibold">Database</h2>
                </div>
                
                {result.tests.database.success ? (
                  <div>
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Questions Table</h3>
                      {result.tests.database.questionsTable?.exists ? (
                        <div className="bg-green-50 p-3 rounded-md">
                          <p className="text-green-700 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> Table exists
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Found {result.tests.database.questionsTable.count} questions
                          </p>
                          {result.tests.database.questionsTable.sample && Array.isArray(result.tests.database.questionsTable.sample) && result.tests.database.questionsTable.sample.length > 0 ? (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Sample questions:</p>
                              <div className="mt-1 space-y-2 max-h-60 overflow-y-auto">
                                {result.tests.database.questionsTable.sample.map((question: any, index: number) => (
                                  <div key={question.id} className="text-xs bg-gray-100 p-2 rounded">
                                    <div className="font-medium">{index + 1}. {question.text}</div>
                                    <div className="flex justify-between mt-1 text-gray-500">
                                      <span>Category: {question.category || 'None'}</span>
                                      <span>ID: {question.id.substring(0, 8)}...</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-right">
                                <Link href="/list-questions" className="text-xs text-blue-600 hover:underline">
                                  View all questions →
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-yellow-600 mt-2">
                              No sample questions available. Try adding some questions.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-3 rounded-md">
                          <p className="text-yellow-700">
                            Table not found or empty. Please create the questions table.
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Candidates Table</h3>
                      {result.tests.database.candidatesTable?.exists ? (
                        <div className="bg-green-50 p-3 rounded-md">
                          <p className="text-green-700 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> Table exists
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Found {result.tests.database.candidatesTable.count} candidates
                          </p>
                          {result.tests.database.candidatesTable.sample && Array.isArray(result.tests.database.candidatesTable.sample) && result.tests.database.candidatesTable.sample.length > 0 ? (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Sample candidates:</p>
                              <div className="mt-1 space-y-2 max-h-40 overflow-y-auto">
                                {result.tests.database.candidatesTable.sample.map((candidate: any) => (
                                  <div key={candidate.id} className="text-xs bg-gray-100 p-2 rounded">
                                    <div className="font-medium">{candidate.name}</div>
                                    <div className="text-gray-500">{candidate.email}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-yellow-600 mt-2">
                              No sample candidates available.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-3 rounded-md">
                          <p className="text-yellow-700">
                            Table not found or empty. Please create the candidates table.
                          </p>
                          {result.tests.database.candidatesTable?.error && (
                            <p className="text-sm text-red-600 mt-1">
                              Error: {result.tests.database.candidatesTable.error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-700 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" /> Database connection failed
                    </p>
                    {result.tests.database.error && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {result.tests.database.error}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Storage Test Results */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <HardDrive className="h-5 w-5 mr-2 text-blue-600" />
                  <h2 className="text-xl font-semibold">Storage</h2>
                </div>
                
                {result.tests.storage.success ? (
                  <div>
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Storage Buckets</h3>
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-green-700 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" /> Storage connection successful
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Found {result.tests.storage.buckets?.count} buckets
                        </p>
                        {result.tests.storage.buckets?.names.length ? (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Bucket names:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {result.tests.storage.buckets.names.map((name, index) => (
                                <li key={index}>{name}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Recordings Bucket</h3>
                      {result.tests.storage.recordingsBucket?.exists ? (
                        <div className="bg-green-50 p-3 rounded-md">
                          <p className="text-green-700 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> Recordings bucket exists
                          </p>
                          {result.tests.storage.recordingsBucket.details && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Bucket details:</p>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-24">
                                {JSON.stringify(result.tests.storage.recordingsBucket.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-3 rounded-md">
                          <p className="text-yellow-700">
                            Recordings bucket not found. Please create a bucket named &quot;recordings&quot;.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-700 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" /> Storage connection failed
                    </p>
                    {result.tests.storage.error && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {result.tests.storage.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  If tables are missing, follow the instructions in <code className="bg-gray-100 px-1 py-0.5 rounded">SUPABASE_SETUP.md</code> to create them
                </li>
                <li>
                  If the recordings bucket is missing, create it in the Supabase dashboard under Storage
                </li>
                <li>
                  Make sure your environment variables are correctly set in <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code>
                </li>
                <li>
                  <Link href="/" className="text-blue-600 hover:underline">
                    Return to the home page
                  </Link> once everything is set up correctly
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Need help? Check out the{' '}
          <a 
            href="https://supabase.com/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Supabase documentation
          </a>
        </p>
      </div>
    </div>
  );
} 