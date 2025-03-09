import { supabase } from './supabaseClient';

/**
 * For the hackathon, this function provides instructions for creating
 * policies that allow anonymous uploads and access
 */
export const createResumesBucketPolicy = async () => {
  console.log(`
    ===== MANUAL SUPABASE POLICY SETUP FOR HACKATHON MODE =====
    
    Since this is a hackathon project, we'll set up policies that allow anyone to access without authentication:
    
    PART 1: STORAGE BUCKET POLICIES
    -------------------------------
    1. Go to Storage > Buckets > resumes
    2. Click on "Policies" tab
    3. Delete any existing policies for the resumes bucket to start fresh
    4. Create two new policies:
    
    POLICY 1 - Allow anyone to view/download resumes:
    - Name: "Allow anyone to view resumes" 
    - Allowed operation: SELECT
    - Policy definition: true
    - Target roles: anon, authenticated (select both)
    
    POLICY 2 - Allow anyone to upload resumes:
    - Name: "Allow anyone to upload resumes"
    - Allowed operation: INSERT
    - Policy definition: true
    - Target roles: anon, authenticated (select both)
    
    PART 2: DATABASE TABLE POLICIES
    ------------------------------
    1. Go to Authentication > Policies
    2. Select the "resumes" table from the dropdown
    3. Create the following policies:
    
    POLICY 1 - Allow anyone to insert resumes:
    - Name: "resumes_insert_policy"
    - Allowed operation: INSERT
    - Target roles: anon, authenticated (select both)
    - Policy definition: true
    
    POLICY 2 - Allow anyone to view resumes:
    - Name: "resumes_select_policy"
    - Allowed operation: SELECT
    - Target roles: anon, authenticated (select both)
    - Policy definition: true
    
    POLICY 3 - Allow anyone to update resumes:
    - Name: "resumes_update_policy"
    - Allowed operation: UPDATE
    - Target roles: anon, authenticated (select both)
    - Policy definition: true
    
    IMPORTANT NOTES FOR HACKATHON:
    - This setup allows ANYONE to access files and data (no authentication required)
    - This is NOT recommended for production but is fine for a hackathon
    - Make sure the bucket is set to PRIVATE since we're using policies to control access
    - No need to add path prefixes - upload directly to root of bucket
    
    After creating these policies, your resume upload should work without authentication.
  `);
  
  return { success: false, manualSetupRequired: true };
};

/**
 * Creates the resumes bucket if it doesn't exist
 * and provides instructions for setting up permissive policies
 */
export const ensureResumesBucketPolicy = async () => {
  try {
    console.log("Hackathon mode: Will set up policies for anonymous access (no authentication required)");
    
    // Try to create the bucket first if it doesn't exist
    const { error: bucketError } = await supabase.storage.createBucket('resumes', {
      public: false  // Keep bucket private but use permissive policies
    });
    
    // Ignore errors if bucket already exists
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating resumes bucket:', bucketError);
    } else {
      console.log('Resumes bucket exists or was created successfully');
    }
    
    // Display policy creation instructions for hackathon mode
    return await createResumesBucketPolicy();
  } catch (error) {
    console.error('Error ensuring resumes bucket:', error);
    return { error };
  }
}; 