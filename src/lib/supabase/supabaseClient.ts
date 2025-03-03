import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if the required environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is properly configured
export async function checkSupabaseConnection() {
  try {
    // Try to fetch a simple query to check connection
    const { data, error } = await supabase.from('questions').select('count');
    
    if (error) throw error;
    
    return { success: true, message: 'Supabase connection successful' };
  } catch (error: any) {
    console.error('Supabase connection error:', error);
    return { 
      success: false, 
      message: 'Supabase connection failed', 
      error: error.message || 'Unknown error'
    };
  }
} 