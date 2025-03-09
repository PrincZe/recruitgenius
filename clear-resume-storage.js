// Run this in the browser console on your app to clear resume storage objects
// First, make sure you're logged in to your app with an account that has storage access

// Step 1: List all files in the resumes bucket
async function listAndDeleteResumes() {
  try {
    console.log("Listing resume files in storage...");
    const { data: files, error } = await window.supabase
      .storage
      .from('resumes')
      .list();
    
    if (error) {
      console.error("Error listing files:", error);
      return;
    }
    
    console.log(`Found ${files.length} files in the resumes bucket`);
    
    // Step 2: Delete each file
    const deletePromises = files.map(async (file) => {
      console.log(`Deleting: ${file.name}`);
      const { error: deleteError } = await window.supabase
        .storage
        .from('resumes')
        .remove([file.name]);
      
      if (deleteError) {
        console.error(`Error deleting ${file.name}:`, deleteError);
        return { name: file.name, success: false };
      }
      return { name: file.name, success: true };
    });
    
    // Wait for all deletions to complete
    const results = await Promise.all(deletePromises);
    
    // Count successes and failures
    const successes = results.filter(r => r.success).length;
    const failures = results.filter(r => !r.success).length;
    
    console.log(`
    ============= SUMMARY =============
    Total files processed: ${results.length}
    Successfully deleted: ${successes}
    Failed to delete: ${failures}
    ===================================
    `);
    
    // Step 3: Verify the bucket is now empty
    const { data: remainingFiles, error: verifyError } = await window.supabase
      .storage
      .from('resumes')
      .list();
      
    if (verifyError) {
      console.error("Error verifying bucket is empty:", verifyError);
    } else {
      console.log(`Verification complete. Bucket now has ${remainingFiles.length} files.`);
    }
    
  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

// Execute the function
listAndDeleteResumes()
  .then(() => console.log("Operation complete"))
  .catch(e => console.error("Fatal error:", e));

// Instructions:
// 1. Open your application in a browser
// 2. Make sure you're logged in with admin privileges
// 3. Open the browser console (F12 or right-click > Inspect > Console)
// 4. Paste this entire script and press Enter
// 5. Watch the console for progress and results 