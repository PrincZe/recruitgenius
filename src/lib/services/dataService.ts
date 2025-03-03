import { createClient } from '@supabase/supabase-js';
import { Question, Candidate, Session, Recording } from '../models/types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Question related functions
export async function addQuestion(data: { text: string; category?: string }) {
  try {
    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        text: data.text,
        category: data.category || 'General',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error adding question:', error);
      return null;
    }
    
    return question?.id || null;
  } catch (error) {
    console.error('Exception adding question:', error);
    return null;
  }
}

export async function getQuestions() {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
    
    return data as Question[];
  } catch (error) {
    console.error('Exception fetching questions:', error);
    return [];
  }
}

export async function getQuestionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching question:', error);
      return null;
    }
    
    return data as Question;
  } catch (error) {
    console.error('Exception fetching question:', error);
    return null;
  }
}

// Candidate related functions
export async function addCandidate(data: { name: string; email: string; sessionId: string | null }) {
  try {
    const { data: candidate, error } = await supabase
      .from('candidates')
      .insert({
        name: data.name,
        email: data.email,
        session_id: data.sessionId,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error adding candidate:', error);
      return null;
    }
    
    return candidate?.id || null;
  } catch (error) {
    console.error('Exception adding candidate:', error);
    return null;
  }
}

export async function getCandidates() {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
    
    return data as Candidate[];
  } catch (error) {
    console.error('Exception fetching candidates:', error);
    return [];
  }
}

export async function getCandidateById(id: string) {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }
    
    return data as Candidate;
  } catch (error) {
    console.error('Exception fetching candidate:', error);
    return null;
  }
}

// Session related functions
export async function createSession(candidateId: string, questionIds: string[]) {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        candidate_id: candidateId,
        questions: questionIds,
        progress: 0,
        is_completed: false,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    // Update the candidate with the session ID
    const { error: updateError } = await supabase
      .from('candidates')
      .update({ session_id: session.id })
      .eq('id', candidateId);
    
    if (updateError) {
      console.error('Error updating candidate with session ID:', updateError);
    }
    
    return session?.id || null;
  } catch (error) {
    console.error('Exception creating session:', error);
    return null;
  }
}

export async function getSessionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    
    return data as Session;
  } catch (error) {
    console.error('Exception fetching session:', error);
    return null;
  }
}

export async function updateSessionProgress(id: string, progress: number) {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({
        progress,
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating session progress:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception updating session progress:', error);
    return false;
  }
}

export async function completeSession(id: string) {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error completing session:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception completing session:', error);
    return false;
  }
}

// Recording related functions
export async function getRecordings() {
  try {
    const { data, error } = await supabase
      .from('recordings')
      .select('*, candidates(*), questions(*)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching recordings:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching recordings:', error);
    return [];
  }
}

export async function getRecordingById(id: string) {
  try {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching recording:', error);
      return null;
    }
    
    return data as Recording;
  } catch (error) {
    console.error('Exception fetching recording:', error);
    return null;
  }
}

export async function updateRecordingNotes(id: string, notes: string) {
  try {
    const { error } = await supabase
      .from('recordings')
      .update({
        notes,
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating recording notes:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception updating recording notes:', error);
    return false;
  }
} 