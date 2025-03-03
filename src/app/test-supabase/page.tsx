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
        const connectionResult = await checkSupabaseConnection();
        setResult(connectionResult);
        setStatus(connectionResult.success ? 'success' : 'error');
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
            <h2 className="text-lg font-medium text-red-800 mb-2">Connection Error</h2>
            <p className="text-red-700">{result?.error || 'Unknown error'}</p>
            <div className="mt-4 p-3 bg-gray-100 rounded-md overflow-auto">
              <p className="text-sm font-mono">
                Check your .env.local file and make sure your Supabase environment variables are set correctly:
              </p>
              <ul className="mt-2 text-sm font-mono space-y-1">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <h2 className="text-lg font-medium text-green-800 mb-2">Connection Successful!</h2>
            <p className="text-green-700 mb-4">Your Supabase connection is working correctly.</p>
          </div>
        )}
        
        <div className="mt-6 space-y-3">
          <Link 
            href="/"
            className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Home
          </Link>
          
          <Link
            href="https://app.supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Open Supabase Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 