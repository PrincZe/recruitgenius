import { supabase } from './supabaseClient';

/**
 * Since the RPC approach doesn't work, this function now provides
 * instructions for creating the policies manually in the Supabase UI
 */
export const createResumesBucketPolicy = async () => {
  console.log(`
    ===== MANUAL SUPABASE POLICY SETUP REQUIRED =====
    
    Please set up the following policies in your Supabase dashboard:
    
    1. Go to Storage > Buckets > resumes
    2. Click on "Policies" tab
    3. Delete any existing policies for the resumes bucket to start fresh
    4. Create two new policies:
    
    POLICY 1 - For viewing/downloading resumes:
    - Name: "Allow authenticated users to view resumes" 
    - Allowed operation: SELECT
    - Policy definition: auth.role() = 'authenticated'
    - Target roles: authenticated
    
    POLICY 2 - For uploading resumes:
    - Name: "Allow authenticated users to upload resumes"
    - Allowed operation: INSERT
    - Policy definition: auth.role() = 'authenticated'  
    - Target roles: authenticated
    
    IMPORTANT:
    - Make sure your user is properly authenticated when uploading
    - Make sure the bucket is set to PRIVATE (not public) since we're using RLS
    - No need to add 'private/' to any paths - upload directly to root of bucket
    
    After creating these policies, your resume upload should work correctly.
  `);
  
  return { success: false, manualSetupRequired: true };
};

/**
 * Creates the resumes bucket if it doesn't exist
 * and provides instructions for setting up policies
 */
export const ensureResumesBucketPolicy = async () => {
  try {
    // Check authentication status
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.warn("User is not authenticated! Policies will only work for authenticated users.");
    } else {
      console.log("User is authenticated as:", session.session.user.email);
    }
    
    // Try to create the bucket first if it doesn't exist
    const { error: bucketError } = await supabase.storage.createBucket('resumes', {
      public: false  // Make private since we'll use policies to control access
    });
    
    // Ignore errors if bucket already exists
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating resumes bucket:', bucketError);
    } else {
      console.log('Resumes bucket exists or was created successfully');
    }
    
    // Display manual policy creation instructions
    return await createResumesBucketPolicy();
  } catch (error) {
    console.error('Error ensuring resumes bucket:', error);
    return { error };
  }
}; 