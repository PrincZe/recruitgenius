'use client';

import { useState, useEffect } from 'react';
import { checkSupabaseConnection } from '@/lib/supabase/supabaseClient';
import Link from 'next/link';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        const connectionSuccess = await checkSupabaseConnection();
        setResult({ 
          success: connectionSuccess, 
          message: connectionSuccess 
            ? 'Supabase connection successful' 
            : 'Supabase connection failed'
        });
        setStatus(connectionSuccess ? 'success' : 'error');
      } catch (error) {
        console.error('Error testing Supabase connection:', error);
        setResult({ success: false, message: 'Unexpected error occurred', error: String(error) });
        setStatus('error');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Supabase Connection Test</h1>
        
        {status === 'loading' && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Testing connection...</span>
          </div>
        )}
        
        {status === 'error' && (
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
            <p className="text-red-700 mb-3">{result?.message}</p>
            {result?.error && (
              <div className="bg-red-100 p-3 rounded text-sm text-red-800 font-mono overflow-auto">
                {result.error}
              </div>
            )}
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Connection Successful</h2>
            <p className="text-green-700">{result?.message}</p>
          </div>
        )}
        
        <div className="mt-6 border-t pt-4">
          <p className="mb-4">
            Make sure you have:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-6">
            <li>Set up your Supabase project</li>
            <li>Added the correct environment variables in .env.local</li>
            <li>Created the required tables in your Supabase database</li>
          </ul>
          
          <div className="flex justify-between">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 