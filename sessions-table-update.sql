-- SQL to add is_completed column to sessions table

-- Add is_completed column with default value
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- Enable RLS on the sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy
CREATE POLICY sessions_insert_policy 
ON public.sessions
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create SELECT policy
CREATE POLICY sessions_select_policy 
ON public.sessions
FOR SELECT 
TO anon, authenticated
USING (true);

-- Create UPDATE policy
CREATE POLICY sessions_update_policy 
ON public.sessions
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Add column comment
COMMENT ON COLUMN public.sessions.is_completed IS 'Indicates whether the interview session is completed'; 