-- SQL script to clear resume data
-- To use: Execute this in the Supabase SQL Editor

-- 0. First, handle foreign key constraints by setting resume_id to NULL in candidates table
UPDATE "public"."candidates"
SET "resume_id" = NULL
WHERE "resume_id" IS NOT NULL;

-- 1. Delete resume evaluations (they reference resumes)
DELETE FROM "public"."resume_evaluations";

-- 2. Then delete resumes
DELETE FROM "public"."resumes";

-- 3. Delete any storage objects for resumes
-- Note: This requires running through the Supabase client or REST API
-- as SQL cannot directly manage storage objects
-- You'll need to use the Storage API to delete objects in the "resumes" bucket

-- 4. Status check - confirm tables are empty
SELECT 'Resume evaluations count: ' || COUNT(*) AS status FROM "public"."resume_evaluations"
UNION ALL
SELECT 'Resumes count: ' || COUNT(*) AS status FROM "public"."resumes"
UNION ALL
SELECT 'Candidates with resume_id: ' || COUNT(*) AS status FROM "public"."candidates" WHERE "resume_id" IS NOT NULL;

-- 5. Optional: Reset sequence if you want to start IDs from 1 again
-- ALTER SEQUENCE resume_evaluations_id_seq RESTART WITH 1;
-- ALTER SEQUENCE resumes_id_seq RESTART WITH 1;

-- Note: To also clear storage objects, you'll need to use the Supabase Dashboard
-- or make API calls to the Storage API separately 