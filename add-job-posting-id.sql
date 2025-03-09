-- SQL to add job_posting_id to existing resumes table

-- Add job_posting_id column
ALTER TABLE public.resumes 
ADD COLUMN job_posting_id UUID;

-- Create index for job_posting_id
CREATE INDEX IF NOT EXISTS idx_resumes_job_posting_id ON public.resumes(job_posting_id);

-- Add comment
COMMENT ON COLUMN public.resumes.job_posting_id IS 'Reference to the job posting this resume is for'; 