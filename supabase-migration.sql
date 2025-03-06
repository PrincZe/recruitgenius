-- This SQL file adds the necessary columns to the recordings table
-- for storing transcription and sentiment analysis data.
-- You can execute this in the Supabase SQL editor to update your schema.

-- First, check if the transcript column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recordings' 
        AND column_name = 'transcript'
    ) THEN
        ALTER TABLE recordings ADD COLUMN transcript TEXT;
    END IF;
END $$;

-- Add sentiment_score column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recordings' 
        AND column_name = 'sentiment_score'
    ) THEN
        ALTER TABLE recordings ADD COLUMN sentiment_score FLOAT;
    END IF;
END $$;

-- Add sentiment_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recordings' 
        AND column_name = 'sentiment_type'
    ) THEN
        ALTER TABLE recordings ADD COLUMN sentiment_type TEXT;
    END IF;
END $$;

-- Add is_processed column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recordings' 
        AND column_name = 'is_processed'
    ) THEN
        ALTER TABLE recordings ADD COLUMN is_processed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add summary column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recordings' 
        AND column_name = 'summary'
    ) THEN
        ALTER TABLE recordings ADD COLUMN summary TEXT;
    END IF;
END $$;

-- Add topics column if it doesn't exist (storing as JSON)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recordings' 
        AND column_name = 'topics'
    ) THEN
        ALTER TABLE recordings ADD COLUMN topics JSONB;
    END IF;
END $$;

-- Create an index on the is_processed column for efficient querying
CREATE INDEX IF NOT EXISTS idx_recordings_is_processed ON recordings (is_processed);

-- Create an index on the candidate_id for efficient filtering
CREATE INDEX IF NOT EXISTS idx_recordings_candidate_id ON recordings (candidate_id);

-- Success message
SELECT 'Schema migration completed successfully. The recordings table now has columns for transcription and sentiment analysis.' as message; 