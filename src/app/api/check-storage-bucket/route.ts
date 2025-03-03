import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

export async function GET() {
  try {
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking storage buckets:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    // Check if recordings bucket exists
    const recordingsBucketExists = buckets?.some(bucket => bucket.name === 'recordings');
    
    return NextResponse.json({
      success: true,
      exists: recordingsBucketExists,
      buckets: buckets?.map(bucket => bucket.name) || []
    });
  } catch (error) {
    console.error('Error checking storage bucket:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 