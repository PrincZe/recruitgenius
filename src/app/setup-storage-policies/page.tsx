'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Database, ExternalLink, HardDrive } from 'lucide-react';

export default function SetupStoragePoliciesPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const recordingsStoragePolicySql = `
-- Storage policies for the recordings bucket

-- Allow anonymous read access to recordings
CREATE POLICY "Allow anonymous users to read recordings"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'recordings');

-- Allow authenticated read access to recordings
CREATE POLICY "Allow authenticated users to read recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'recordings');

-- Allow anonymous users to insert recordings
CREATE POLICY "Allow anonymous users to insert recordings"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'recordings');

-- Allow authenticated users to insert recordings
CREATE POLICY "Allow authenticated users to insert recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recordings');

-- Allow anonymous users to update recordings
CREATE POLICY "Allow anonymous users to update recordings"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'recordings');

-- Allow authenticated users to update recordings
CREATE POLICY "Allow authenticated users to update recordings"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'recordings');

-- Allow anonymous users to delete recordings
CREATE POLICY "Allow anonymous users to delete recordings"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'recordings');

-- Allow authenticated users to delete recordings
CREATE POLICY "Allow authenticated users to delete recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'recordings');
  `.trim();

  const storageObjectsRlsSql = `
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  `.trim();

  const allStoragePoliciesSql = `
-- Storage policies for RecruitGenius

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to recordings
CREATE POLICY "Allow anonymous users to read recordings"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'recordings');

-- Allow authenticated read access to recordings
CREATE POLICY "Allow authenticated users to read recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'recordings');

-- Allow anonymous users to insert recordings
CREATE POLICY "Allow anonymous users to insert recordings"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'recordings');

-- Allow authenticated users to insert recordings
CREATE POLICY "Allow authenticated users to insert recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recordings');

-- Allow anonymous users to update recordings
CREATE POLICY "Allow anonymous users to update recordings"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'recordings');

-- Allow authenticated users to update recordings
CREATE POLICY "Allow authenticated users to update recordings"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'recordings');

-- Allow anonymous users to delete recordings
CREATE POLICY "Allow anonymous users to delete recordings"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'recordings');

-- Allow authenticated users to delete recordings
CREATE POLICY "Allow authenticated users to delete recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'recordings');
  `.trim();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <a 
          href="https://app.supabase.com/project/_/storage/policies"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Supabase Storage Policies
        </a>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Setup Storage Policies</h1>
        
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            <strong>Note:</strong> When Row Level Security (RLS) is enabled on storage, all access is denied by default. 
            You need to create policies to allow specific operations. The scripts below will create policies 
            that allow anonymous and authenticated users to perform all operations on the recordings bucket.
          </p>
        </div>
        
        <p className="mb-6 text-gray-700">
          Use the SQL scripts below to set up storage policies for your Supabase recordings bucket.
          Copy the SQL and paste it into the Supabase SQL Editor.
        </p>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">All Storage Policies (Recommended)</h2>
          <div className="relative">
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{allStoragePoliciesSql}</pre>
            <button
              onClick={() => copyToClipboard(allStoragePoliciesSql, 'all')}
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
          <h2 className="text-xl font-semibold mb-4">Individual Policies</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Enable RLS on Storage Objects</h3>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{storageObjectsRlsSql}</pre>
                <button
                  onClick={() => copyToClipboard(storageObjectsRlsSql, 'rls')}
                  className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm hover:bg-gray-50"
                  aria-label="Copy SQL"
                >
                  {copied === 'rls' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Recordings Bucket Policies</h3>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{recordingsStoragePolicySql}</pre>
                <button
                  onClick={() => copyToClipboard(recordingsStoragePolicySql, 'recordings')}
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
            <li>Copy the SQL script for all storage policies</li>
            <li>Open the Supabase SQL Editor</li>
            <li>Paste the SQL and run it</li>
            <li>Return to the app and test uploading and accessing recordings</li>
          </ol>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            
            <a 
              href="https://app.supabase.com/project/_/storage/buckets"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <HardDrive className="w-4 h-4" />
              View Storage Buckets
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 