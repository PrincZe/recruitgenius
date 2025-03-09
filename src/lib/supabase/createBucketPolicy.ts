import { supabase } from './supabaseClient';

/**
 * Creates a comprehensive policy for the resumes bucket 
 * that allows authenticated users to both read and write files
 */
export const createResumesBucketPolicy = async () => {
  // Create an INSERT policy
  const { error: insertError } = await supabase.rpc('create_storage_policy', {
    bucket_id: 'resumes',
    name: 'Allow authenticated uploads to resumes',
    definition: "auth.role() = 'authenticated'",
    operation: 'INSERT'
  });
  
  if (insertError) {
    console.error('Error creating INSERT policy for resumes bucket:', insertError);
    return { error: insertError };
  }
  
  // Create a SELECT policy
  const { error: selectError } = await supabase.rpc('create_storage_policy', {
    bucket_id: 'resumes',
    name: 'Allow authenticated downloads from resumes',
    definition: "auth.role() = 'authenticated'",
    operation: 'SELECT'
  });
  
  if (selectError) {
    console.error('Error creating SELECT policy for resumes bucket:', selectError);
    return { error: selectError };
  }
  
  console.log('Successfully created policies for resumes bucket');
  return { success: true };
};

/**
 * Checks if the policy for the resumes bucket exists and creates it if not
 */
export const ensureResumesBucketPolicy = async () => {
  try {
    // Try to create the bucket first if it doesn't exist
    const { error: bucketError } = await supabase.storage.createBucket('resumes', {
      public: true  // Make sure the bucket is public
    });
    
    // Ignore errors if bucket already exists
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating resumes bucket:', bucketError);
    }
    
    // Create the policies
    return await createResumesBucketPolicy();
  } catch (error) {
    console.error('Error ensuring resumes bucket policy:', error);
    return { error };
  }
}; 