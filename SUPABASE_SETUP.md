# Supabase Setup Guide for RecruitGenius

This guide will help you set up your Supabase project for the RecruitGenius application.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Create a new project with a name like "recruitgenius"
3. Choose a strong database password (save it somewhere secure)
4. Select a region closest to your users
5. Wait for your database to be set up (usually takes about 1 minute)

## 2. Get Your API Keys

1. In your Supabase project dashboard, go to Project Settings (gear icon)
2. Click on "API" in the sidebar
3. You'll find your:
   - **Project URL**: Copy this to `NEXT_PUBLIC_SUPABASE_URL` in your `.env.local` file
   - **anon/public** key: Copy this to `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your `.env.local` file

Your `.env.local` file should include:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
```

## 3. Automatic Setup (Recommended)

We've created a script to automatically set up your Supabase database with the required tables, storage bucket, and sample data:

1. Make sure your `.env.local` file is set up with the correct Supabase URL and key
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Run the initialization script:
   ```bash
   npm run init-db
   ```
4. The script will:
   - Create all required tables if they don't exist
   - Create the "recordings" storage bucket
   - Add sample interview questions

5. Visit `/test-supabase-full` in your application to verify everything is set up correctly

## 4. Manual Setup (Alternative)

If you prefer to set up your database manually, follow these steps:

### Create Database Tables

You need to create the following tables in your Supabase database:

### Questions Table

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Candidates Table

```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Recordings Table

```sql
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  transcript TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  questions JSONB NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

You can create these tables by:

1. Go to the "SQL Editor" in your Supabase dashboard
2. Create a new query
3. Paste each SQL statement and run it

### Set Up Storage

1. Go to "Storage" in the sidebar
2. Click "Create a new bucket"
3. Name it "recordings"
4. Set the access level to "Public"

### Add Sample Data (Optional)

You can add some sample questions to get started:

```sql
INSERT INTO questions (text, category) VALUES
('Tell me about your professional background and experience.', 'Background'),
('Describe a challenging project you worked on and how you overcame obstacles.', 'Experience'),
('Why are you interested in this position and what makes you a good fit?', 'Motivation');
```

## 5. Configure Row-Level Security (Optional but Recommended)

For a production application, you should set up Row-Level Security (RLS) policies. For the MVP, you can use the default public access.

## 6. Test Your Connection

1. Run your Next.js application
2. Visit `/test-supabase-full` to verify your connection is working

## Troubleshooting

- If you see connection errors, double-check your environment variables
- Make sure your tables are created with the exact column names expected by the application
- Check that your storage bucket is named "recordings" and is set to public access 