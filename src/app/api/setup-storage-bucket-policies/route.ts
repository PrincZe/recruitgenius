import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

export async function POST() {
  try {
    // Create a custom function to set up storage bucket policies
    const { error: functionError } = await supabase.rpc('create_storage_bucket_policies', {});
    
    if (functionError) {
      console.error('Error calling RPC function:', functionError);
      
      // Since we can't directly execute SQL, let's create a SQL script for the user to run
      return NextResponse.json({ 
        success: false, 
        error: 'Unable to automatically set up storage bucket policies. Please run the SQL script manually.',
        sqlScript: `
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
        `
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Storage bucket policies set up successfully'
    });
  } catch (error) {
    console.error('Error setting up storage bucket policies:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 