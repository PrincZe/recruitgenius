'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function DebugSchemaPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug-schema');
      const result = await response.json();
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <button 
          onClick={fetchDebugInfo} 
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Database Schema Debug</h1>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">Error: {error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Column Names</h2>
              {data.columnNames && data.columnNames.length > 0 ? (
                <div className="bg-gray-50 p-3 rounded-md">
                  <ul className="list-disc list-inside space-y-1">
                    {data.columnNames.map((column: string) => (
                      <li key={column} className="text-gray-700">
                        {column}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500">No columns found</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">created_at Format</h2>
              {data.createdAtFormat ? (
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium">Value:</p>
                      <p className="text-gray-700 font-mono text-sm">{data.createdAtFormat.value}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Type:</p>
                      <p className="text-gray-700 font-mono text-sm">{data.createdAtFormat.type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Is Date Object:</p>
                      <p className="text-gray-700 font-mono text-sm">{data.createdAtFormat.isDate ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">As String:</p>
                      <p className="text-gray-700 font-mono text-sm">{data.createdAtFormat.asString}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium">Parsed as ISO:</p>
                      <p className="text-gray-700 font-mono text-sm">{data.createdAtFormat.parsed}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-yellow-600">created_at column not found or empty</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Sample Data</h2>
              {data.sampleData.questions && data.sampleData.questions.length > 0 ? (
                <div className="bg-gray-50 p-3 rounded-md overflow-auto">
                  <pre className="text-xs">{JSON.stringify(data.sampleData.questions, null, 2)}</pre>
                </div>
              ) : (
                <p className="text-gray-500">No sample data available</p>
              )}
              {data.sampleData.error && (
                <p className="text-red-600 mt-2">Error: {data.sampleData.error}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No data available</p>
        )}
      </div>

      <div className="mt-6 flex justify-center space-x-4">
        <Link 
          href="/list-questions" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          View All Questions
        </Link>
        <Link 
          href="/test-supabase-full" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Comprehensive Supabase Test
        </Link>
      </div>
    </div>
  );
} 