/**
 * Supabase Database Initialization Script
 * 
 * This script helps initialize your Supabase database with sample data.
 * Run this script with: npx ts-node src/scripts/init-supabase.ts
 * 
 * Note: You need to install ts-node first: npm install -g ts-node
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample data
const sampleQuestions = [
  {
    text: 'Tell me about your professional background and experience.',
    category: 'Background'
  },
  {
    text: 'Describe a challenging project you worked on and how you overcame obstacles.',
    category: 'Experience'
  },
  {
    text: 'Why are you interested in this position and what makes you a good fit?',
    category: 'Motivation'
  },
  {
    text: 'How do you handle tight deadlines and pressure?',
    category: 'Work Style'
  },
  {
    text: 'Describe your experience working in a team environment.',
    category: 'Teamwork'
  }
];

// SQL statements for creating tables
const createTablesSql = `
-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recordings Table
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  transcript TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  questions JSONB NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
`;

async function createTables() {
  console.log('Creating tables...');
  const { error } = await supabase.rpc('exec_sql', { sql: createTablesSql });
  
  if (error) {
    console.error('Error creating tables:', error);
    return false;
  }
  
  console.log('Tables created successfully');
  return true;
}

async function createStorageBucket() {
  console.log('Creating storage bucket...');
  
  // Check if bucket already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return false;
  }
  
  const recordingsBucket = buckets.find(bucket => bucket.name === 'recordings');
  
  if (recordingsBucket) {
    console.log('Recordings bucket already exists');
    return true;
  }
  
  // Create the bucket
  const { error } = await supabase.storage.createBucket('recordings', {
    public: true
  });
  
  if (error) {
    console.error('Error creating recordings bucket:', error);
    return false;
  }
  
  console.log('Recordings bucket created successfully');
  return true;
}

async function insertSampleQuestions() {
  console.log('Inserting sample questions...');
  
  // Check if questions already exist
  const { data: existingQuestions, error: checkError } = await supabase
    .from('questions')
    .select('*');
  
  if (checkError) {
    console.error('Error checking existing questions:', checkError);
    return false;
  }
  
  if (existingQuestions && existingQuestions.length > 0) {
    console.log(`${existingQuestions.length} questions already exist, skipping insertion`);
    return true;
  }
  
  // Insert sample questions
  const { error } = await supabase
    .from('questions')
    .insert(sampleQuestions);
  
  if (error) {
    console.error('Error inserting sample questions:', error);
    return false;
  }
  
  console.log(`${sampleQuestions.length} sample questions inserted successfully`);
  return true;
}

async function main() {
  console.log('Initializing Supabase database...');
  
  try {
    // Create tables
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.log('Note: Tables may already exist or you may need to run SQL manually');
      console.log('Check SUPABASE_SETUP.md for SQL statements');
    }
    
    // Create storage bucket
    const bucketCreated = await createStorageBucket();
    if (!bucketCreated) {
      console.log('Note: You may need to create the recordings bucket manually');
    }
    
    // Insert sample questions
    const questionsInserted = await insertSampleQuestions();
    
    console.log('\nInitialization complete!');
    console.log('You can now run your application and test the connection at:');
    console.log('  http://localhost:3000/test-supabase-full');
    
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

main(); 