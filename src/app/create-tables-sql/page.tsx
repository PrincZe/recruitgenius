'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Database, ExternalLink } from 'lucide-react';

export default function CreateTablesSqlPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const questionsTableSql = `
-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
  `.trim();

  const candidatesTableSql = `
-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
  `.trim();

  const recordingsTableSql = `
-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id),
  question_id UUID REFERENCES questions(id),
  audio_url TEXT,
  transcript TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
  `.trim();

  const sessionsTableSql = `
-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id),
  questions JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
  `.trim();

  const allTablesSql = `
-- Create all tables for RecruitGenius

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id),
  questions JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id),
  question_id UUID REFERENCES questions(id),
  audio_url TEXT,
  transcript TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
  `.trim();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <a 
          href="https://app.supabase.com/project/_/sql"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Supabase SQL Editor
        </a>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Create Database Tables</h1>
        
        <p className="mb-6 text-gray-700">
          Use the SQL scripts below to create the necessary tables in your Supabase database.
          Copy the SQL and paste it into the Supabase SQL Editor.
        </p>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">All Tables (Recommended)</h2>
          <div className="relative">
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{allTablesSql}</pre>
            <button
              onClick={() => copyToClipboard(allTablesSql, 'all')}
              className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm hover:bg-gray-50"
              aria-label="Copy SQL"
            >
              {copied === 'all' ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Individual Tables</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Questions Table</h3>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{questionsTableSql}</pre>
                <button
                  onClick={() => copyToClipboard(questionsTableSql, 'questions')}
                  className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm hover:bg-gray-50"
                  aria-label="Copy SQL"
                >
                  {copied === 'questions' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Candidates Table</h3>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{candidatesTableSql}</pre>
                <button
                  onClick={() => copyToClipboard(candidatesTableSql, 'candidates')}
                  className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm hover:bg-gray-50"
                  aria-label="Copy SQL"
                >
                  {copied === 'candidates' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Sessions Table</h3>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{sessionsTableSql}</pre>
                <button
                  onClick={() => copyToClipboard(sessionsTableSql, 'sessions')}
                  className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm hover:bg-gray-50"
                  aria-label="Copy SQL"
                >
                  {copied === 'sessions' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Recordings Table</h3>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{recordingsTableSql}</pre>
                <button
                  onClick={() => copyToClipboard(recordingsTableSql, 'recordings')}
                  className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm hover:bg-gray-50"
                  aria-label="Copy SQL"
                >
                  {copied === 'recordings' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>Copy the SQL script for all tables</li>
            <li>Open the Supabase SQL Editor</li>
            <li>Paste the SQL and run it</li>
            <li>Return to the app and seed sample questions</li>
          </ol>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <Link 
              href="/seed-questions"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Seed Sample Questions
            </Link>
            
            <Link 
              href="/setup-database"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Check Database Setup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 