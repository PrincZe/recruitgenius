import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabaseClient';

export async function POST() {
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return NextResponse.json({ 
        success: false, 
        error: listError.message 
      }, { status: 500 });
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'recordings');
    
    // If bucket already exists, return success
    if (bucketExists) {
      return NextResponse.json({
        success: true,
        message: 'Recordings bucket already exists',
        created: false
      });
    }
    
    // Create the recordings bucket
    const { data, error } = await supabase.storage.createBucket('recordings', {
      public: false, // Set to false for security, we'll use policies to control access
      fileSizeLimit: 52428800 // 50MB limit for audio files
    });
    
    if (error) {
      console.error('Error creating recordings bucket:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Recordings bucket created successfully',
      created: true
    });
  } catch (error) {
    console.error('Error creating storage bucket:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 