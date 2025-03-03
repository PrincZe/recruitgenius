'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Database, ExternalLink, Shield } from 'lucide-react';

export default function SetupRlsPoliciesPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const questionsRlsSql = `
-- RLS Policies for questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to select questions
CREATE POLICY "Allow anonymous users to select questions"
ON questions FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to select questions
CREATE POLICY "Allow authenticated users to select questions"
ON questions FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert questions
CREATE POLICY "Allow authenticated users to insert questions"
ON questions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to update their own questions
CREATE POLICY "Allow authenticated users to update questions"
ON questions FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete their own questions
CREATE POLICY "Allow authenticated users to delete questions"
ON questions FOR DELETE
TO anon, authenticated
USING (true);
  `.trim();

  const candidatesRlsSql = `
-- RLS Policies for candidates table
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to select candidates
CREATE POLICY "Allow anonymous users to select candidates"
ON candidates FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to select candidates
CREATE POLICY "Allow authenticated users to select candidates"
ON candidates FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to insert candidates
CREATE POLICY "Allow anonymous users to insert candidates"
ON candidates FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to update candidates
CREATE POLICY "Allow authenticated users to update candidates"
ON candidates FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete candidates
CREATE POLICY "Allow authenticated users to delete candidates"
ON candidates FOR DELETE
TO anon, authenticated
USING (true);
  `.trim();

  const recordingsRlsSql = `
-- RLS Policies for recordings table
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to select recordings
CREATE POLICY "Allow anonymous users to select recordings"
ON recordings FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to select recordings
CREATE POLICY "Allow authenticated users to select recordings"
ON recordings FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to insert recordings
CREATE POLICY "Allow anonymous users to insert recordings"
ON recordings FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to update recordings
CREATE POLICY "Allow authenticated users to update recordings"
ON recordings FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete recordings
CREATE POLICY "Allow authenticated users to delete recordings"
ON recordings FOR DELETE
TO anon, authenticated
USING (true);
  `.trim();

  const sessionsRlsSql = `
-- RLS Policies for sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to select sessions
CREATE POLICY "Allow anonymous users to select sessions"
ON sessions FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to select sessions
CREATE POLICY "Allow authenticated users to select sessions"
ON sessions FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to insert sessions
CREATE POLICY "Allow anonymous users to insert sessions"
ON sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to update sessions
CREATE POLICY "Allow authenticated users to update sessions"
ON sessions FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete sessions
CREATE POLICY "Allow authenticated users to delete sessions"
ON sessions FOR DELETE
TO anon, authenticated
USING (true);
  `.trim();

  const allPoliciesSql = `
-- RLS Policies for all tables in RecruitGenius

-- Questions table policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to select questions
CREATE POLICY "Allow anonymous users to select questions"
ON questions FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to select questions
CREATE POLICY "Allow authenticated users to select questions"
ON questions FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to insert questions
CREATE POLICY "Allow anonymous users to insert questions"
ON questions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to update questions
CREATE POLICY "Allow authenticated users to update questions"
ON questions FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete questions
CREATE POLICY "Allow authenticated users to delete questions"
ON questions FOR DELETE
TO anon, authenticated
USING (true);

-- Candidates table policies
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to select candidates
CREATE POLICY "Allow anonymous users to select candidates"
ON candidates FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to select candidates
CREATE POLICY "Allow authenticated users to select candidates"
ON candidates FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to insert candidates
CREATE POLICY "Allow anonymous users to insert candidates"
ON candidates FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to update candidates
CREATE POLICY "Allow authenticated users to update candidates"
ON candidates FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete candidates
CREATE POLICY "Allow authenticated users to delete candidates"
ON candidates FOR DELETE
TO anon, authenticated
USING (true);

-- Sessions table policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to select sessions
CREATE POLICY "Allow anonymous users to select sessions"
ON sessions FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to select sessions
CREATE POLICY "Allow authenticated users to select sessions"
ON sessions FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to insert sessions
CREATE POLICY "Allow anonymous users to insert sessions"
ON sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to update sessions
CREATE POLICY "Allow authenticated users to update sessions"
ON sessions FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete sessions
CREATE POLICY "Allow authenticated users to delete sessions"
ON sessions FOR DELETE
TO anon, authenticated
USING (true);

-- Recordings table policies
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to select recordings
CREATE POLICY "Allow anonymous users to select recordings"
ON recordings FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to select recordings
CREATE POLICY "Allow authenticated users to select recordings"
ON recordings FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to insert recordings
CREATE POLICY "Allow anonymous users to insert recordings"
ON recordings FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to update recordings
CREATE POLICY "Allow authenticated users to update recordings"
ON recordings FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete recordings
CREATE POLICY "Allow authenticated users to delete recordings"
ON recordings FOR DELETE
TO anon, authenticated
USING (true);
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
        <h1 className="text-2xl font-bold mb-6">Setup Row Level Security Policies</h1>
        
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            <strong>Note:</strong> When Row Level Security (RLS) is enabled on a table, all access is denied by default. 
            You need to create policies to allow specific operations. The scripts below will create policies 
            that allow anonymous and authenticated users to perform all operations on the tables.
          </p>
        </div>
        
        <p className="mb-6 text-gray-700">
          Use the SQL scripts below to set up RLS policies for your Supabase tables.
          Copy the SQL and paste it into the Supabase SQL Editor.
        </p>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">All Policies (Recommended)</h2>
          <div className="relative">
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{allPoliciesSql}</pre>
            <button
              onClick={() => copyToClipboard(allPoliciesSql, 'all')}
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
          <h2 className="text-xl font-semibold mb-4">Individual Table Policies</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Questions Table Policies</h3>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{questionsRlsSql}</pre>
                <button
                  onClick={() => copyToClipboard(questionsRlsSql, 'questions')}
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
              <h3 className="font-medium mb-2">Candidates Table Policies</h3>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{candidatesRlsSql}</pre>
                <button
                  onClick={() => copyToClipboard(candidatesRlsSql, 'candidates')}
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
              <h3 className="font-medium mb-2">Sessions Table Policies</h3>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{sessionsRlsSql}</pre>
                <button
                  onClick={() => copyToClipboard(sessionsRlsSql, 'sessions')}
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
              <h3 className="font-medium mb-2">Recordings Table Policies</h3>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{recordingsRlsSql}</pre>
                <button
                  onClick={() => copyToClipboard(recordingsRlsSql, 'recordings')}
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
            <li>Copy the SQL script for all policies</li>
            <li>Open the Supabase SQL Editor</li>
            <li>Paste the SQL and run it</li>
            <li>Return to the app and try seeding sample questions again</li>
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