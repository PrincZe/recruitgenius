-- SQL script to create the resumes table

-- Create resumes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    content_text TEXT,
    job_posting_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for job_posting_id
CREATE INDEX IF NOT EXISTS idx_resumes_job_posting_id ON public.resumes(job_posting_id);

-- Add comments for schema clarity
COMMENT ON TABLE public.resumes IS 'Stores resume files and metadata';
COMMENT ON COLUMN public.resumes.id IS 'Unique identifier for the resume';
COMMENT ON COLUMN public.resumes.file_url IS 'URL to the uploaded resume file in Supabase storage';
COMMENT ON COLUMN public.resumes.file_name IS 'Original filename of the uploaded resume';
COMMENT ON COLUMN public.resumes.file_size IS 'Size of the file in bytes';
COMMENT ON COLUMN public.resumes.content_text IS 'Extracted text content from the resume';
COMMENT ON COLUMN public.resumes.job_posting_id IS 'Reference to the job posting this resume is for';

-- If job_postings table already exists, add foreign key relationship (uncomment if needed)
-- ALTER TABLE public.resumes 
--    ADD CONSTRAINT fk_resumes_job_postings 
--    FOREIGN KEY (job_posting_id) 
--    REFERENCES public.job_postings(id)
--    ON DELETE CASCADE; 