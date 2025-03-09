-- SQL to create permissive RLS policies for resumes table

-- First, make sure RLS is enabled on the table
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to insert resumes (for hackathon)
CREATE POLICY resumes_insert_policy 
ON public.resumes
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create a policy to allow anyone to select resumes (for hackathon)
CREATE POLICY resumes_select_policy 
ON public.resumes
FOR SELECT 
TO anon, authenticated
USING (true);

-- Create a policy to allow anyone to update resumes (for hackathon)
CREATE POLICY resumes_update_policy 
ON public.resumes
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Note: For a production application, you would want more restrictive policies.
-- These policies are permissive for the purpose of a hackathon. 