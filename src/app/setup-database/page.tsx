'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface TableStatus {
  exists: boolean;
  error: string | null;
}

interface StorageStatus {
  exists: boolean;
  error?: string | null;
}

interface SetupResults {
  success: boolean;
  tables: {
    questions: TableStatus;
    candidates: TableStatus;
    recordings: TableStatus;
    sessions: TableStatus;
  };
  storage: StorageStatus;
  error?: string;
}

export default function SetupDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SetupResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setupDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/setup-database');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Failed to set up database: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Setup</h1>
      
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <p className="mb-4 text-gray-700">
          This page will help you verify the database tables and storage buckets for the RecruitGenius application.
          Click the button below to check if the following exist:
        </p>
        
        <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
          <li><strong>Questions Table</strong> - Stores interview questions</li>
          <li><strong>Candidates Table</strong> - Stores candidate information</li>
          <li><strong>Recordings Table</strong> - Stores audio recordings and transcripts</li>
          <li><strong>Sessions Table</strong> - Stores interview session data</li>
          <li><strong>Storage Bucket</strong> - For storing audio recordings</li>
        </ul>
        
        <div className="flex justify-center">
          <button
            onClick={setupDatabase}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking Database...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Check Database Setup
              </>
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Setup Results</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Database Tables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  {results.tables.questions.exists ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">Questions Table</span>
                </div>
                {results.tables.questions.error && (
                  <p className="mt-2 text-sm text-red-600">{results.tables.questions.error}</p>
                )}
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  {results.tables.candidates.exists ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">Candidates Table</span>
                </div>
                {results.tables.candidates.error && (
                  <p className="mt-2 text-sm text-red-600">{results.tables.candidates.error}</p>
                )}
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  {results.tables.recordings.exists ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">Recordings Table</span>
                </div>
                {results.tables.recordings.error && (
                  <p className="mt-2 text-sm text-red-600">{results.tables.recordings.error}</p>
                )}
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  {results.tables.sessions.exists ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium">Sessions Table</span>
                </div>
                {results.tables.sessions.error && (
                  <p className="mt-2 text-sm text-red-600">{results.tables.sessions.error}</p>
                )}
              </div>
            </div>
            
            {results.storage && (
              <>
                <h3 className="text-lg font-medium mt-6">Storage</h3>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {results.storage.exists ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">Recordings Storage Bucket</span>
                  </div>
                  {results.storage.error && (
                    <p className="mt-2 text-sm text-red-600">{results.storage.error}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-between">
        <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
          Back to Home
        </Link>
        
        {results && results.success && (
          <Link href="/test-supabase-columns" className="text-blue-600 hover:text-blue-800 underline">
            Test Database
          </Link>
        )}
      </div>
    </div>
  );
} 