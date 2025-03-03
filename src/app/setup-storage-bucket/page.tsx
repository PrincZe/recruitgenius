'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Check, X, HardDrive, ExternalLink, Copy } from 'lucide-react';

export default function SetupStorageBucketPage() {
  const [loading, setLoading] = useState(true);
  const [bucketExists, setBucketExists] = useState(false);
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const bucketPoliciesSql = `
-- Enable RLS on storage.buckets if not already enabled
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to create buckets
CREATE POLICY "Allow anonymous users to create buckets"
ON storage.buckets FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users to create buckets
CREATE POLICY "Allow authenticated users to create buckets"
ON storage.buckets FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow anonymous users to select buckets
CREATE POLICY "Allow anonymous users to select buckets"
ON storage.buckets FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to select buckets
CREATE POLICY "Allow authenticated users to select buckets"
ON storage.buckets FOR SELECT
TO authenticated
USING (true);
  `.trim();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const checkBucket = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/check-storage-bucket');
      const data = await response.json();
      
      if (data.success) {
        setBucketExists(data.exists);
        if (data.exists) {
          setSuccess('Recordings bucket exists!');
        }
      } else {
        setError(data.error || 'Failed to check storage bucket');
      }
    } catch (err) {
      setError('Error checking storage bucket: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const createBucket = async () => {
    setCreatingBucket(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/create-storage-bucket', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setBucketExists(true);
        setSuccess('Recordings bucket created successfully!');
      } else {
        if (data.error && data.error.includes('row-level security policy')) {
          setError('RLS policy violation. You need to run the SQL script below in the Supabase SQL Editor first to set up bucket policies.');
        } else {
          setError(data.error || 'Failed to create storage bucket');
        }
      }
    } catch (err) {
      setError('Error creating storage bucket: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setCreatingBucket(false);
    }
  };

  useEffect(() => {
    checkBucket();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <a 
          href="https://app.supabase.com/project/_/storage/buckets"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Supabase Storage
        </a>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Setup Storage Bucket</h1>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">
            This page will check if the &quot;recordings&quot; bucket exists in your Supabase storage and create it if needed.
            The bucket is necessary for storing audio recordings from interviews.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Storage Bucket Status</h2>
          
          {loading ? (
            <div className="flex items-center text-gray-600">
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Checking storage bucket...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${bucketExists ? 'bg-green-100' : 'bg-red-100'}`}>
                  {bucketExists ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <span className="text-lg">
                  {bucketExists ? 'Recordings bucket exists' : 'Recordings bucket not found'}
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                  {success}
                </div>
              )}

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={checkBucket}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                {!bucketExists && (
                  <button
                    onClick={createBucket}
                    disabled={creatingBucket}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    <HardDrive className="mr-2 h-4 w-4" />
                    {creatingBucket ? 'Creating...' : 'Create Bucket'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Storage Bucket Policies</h2>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">
              <strong>Important:</strong> If you encounter a &quot;row-level security policy&quot; error when creating the bucket,
              you need to run the SQL script below in the Supabase SQL Editor first to set up the necessary policies.
            </p>
          </div>
          
          <div className="relative mb-6">
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{bucketPoliciesSql}</pre>
            <button
              onClick={() => copyToClipboard(bucketPoliciesSql, 'policies')}
              className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm hover:bg-gray-50"
              aria-label="Copy SQL"
            >
              {copied === 'policies' ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          
          <a 
            href="https://app.supabase.com/project/_/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open SQL Editor
          </a>
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          {bucketExists ? (
            <div>
              <p className="text-gray-700 mb-4">
                Now that your storage bucket is set up, make sure you have the proper storage policies in place:
              </p>
              <Link 
                href="/setup-storage-policies"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
              >
                Setup Storage Policies
              </Link>
            </div>
          ) : (
            <p className="text-gray-700">
              Create the recordings bucket first, then set up storage policies to allow access to it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 