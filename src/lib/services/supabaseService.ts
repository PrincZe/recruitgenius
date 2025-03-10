import { 
  Question, 
  Candidate, 
  Recording, 
  Session, 
  questionColumnMapping,
  candidateColumnMapping,
  recordingColumnMapping,
  sessionColumnMapping
} from '../models/types';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to map database columns to model properties
function mapDbToModel<T>(dbItem: any, columnMapping: Record<string, string>): T {
  const result: any = {};
  
  for (const [modelProp, dbColumn] of Object.entries(columnMapping)) {
    result[modelProp] = dbItem[dbColumn];
  }
  
  return result as T;
}

// Question Service
export const getQuestions = async (): Promise<Question[]> => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Map database columns to model properties
    return data ? data.map(item => mapDbToModel<Question>(item, questionColumnMapping)) : [];
  } catch (error) {
    console.error('Error getting questions:', error);
    return [];
  }
};

export const getQuestionById = async (id: string): Promise<Question | null> => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data ? mapDbToModel<Question>(data, questionColumnMapping) : null;
  } catch (error) {
    console.error(`Error getting question with ID ${id}:`, error);
    return null;
  }
};

export const addQuestion = async (question: Omit<Question, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    // Map model properties to database columns
    const dbQuestion: any = {};
    for (const [modelKey, dbKey] of Object.entries(questionColumnMapping)) {
      if (modelKey in question) {
        dbQuestion[dbKey] = (question as any)[modelKey];
      }
    }
    
    // Add created_at field
    dbQuestion.created_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('questions')
      .insert([dbQuestion])
      .select();
    
    if (error) throw error;
    return data?.[0]?.id || null;
  } catch (error) {
    console.error('Error adding question:', error);
    return null;
  }
};

export const updateQuestion = async (id: string, questionData: Partial<Question>): Promise<boolean> => {
  try {
    // Map model properties to database columns
    const dbQuestion: any = {};
    for (const [modelKey, dbKey] of Object.entries(questionColumnMapping)) {
      if (modelKey in questionData) {
        dbQuestion[dbKey] = (questionData as any)[modelKey];
      }
    }
    
    const { error } = await supabase
      .from('questions')
      .update(dbQuestion)
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating question with ID ${id}:`, error);
    return false;
  }
};

export const deleteQuestion = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting question with ID ${id}:`, error);
    return false;
  }
};

// Candidate Service
export const getCandidates = async (): Promise<Candidate[]> => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data ? data.map(item => mapDbToModel<Candidate>(item, candidateColumnMapping)) : [];
  } catch (error) {
    console.error('Error getting candidates:', error);
    return [];
  }
};

export const getCandidateById = async (id: string): Promise<Candidate | null> => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data ? mapDbToModel<Candidate>(data, candidateColumnMapping) : null;
  } catch (error) {
    console.error(`Error getting candidate with ID ${id}:`, error);
    return null;
  }
};

export const addCandidate = async (candidate: Omit<Candidate, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    // Map model properties to database columns
    const dbCandidate: any = {};
    for (const [modelKey, dbKey] of Object.entries(candidateColumnMapping)) {
      if (modelKey in candidate) {
        dbCandidate[dbKey] = (candidate as any)[modelKey];
      }
    }
    
    // Add created_at field
    dbCandidate.created_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('candidates')
      .insert([dbCandidate])
      .select();
    
    if (error) throw error;
    return data?.[0]?.id || null;
  } catch (error) {
    console.error('Error adding candidate:', error);
    return null;
  }
};

// Recording Service
export const getRecordings = async (): Promise<Recording[]> => {
  try {
    console.log('Fetching all recordings from Supabase...');
    
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error fetching recordings:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} recordings from Supabase`);
    
    // Map database columns to model properties
    return data ? data.map(item => mapDbToModel<Recording>(item, recordingColumnMapping)) : [];
  } catch (error) {
    console.error('Error getting recordings:', error);
    return [];
  }
};

export const getRecordingsByCandidate = async (candidateId: string): Promise<Recording[]> => {
  try {
    console.log(`Fetching recordings for candidate ${candidateId} from Supabase...`);
    
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Supabase error fetching recordings for candidate ${candidateId}:`, error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} recordings for candidate ${candidateId} from Supabase`);
    
    // Map database columns to model properties
    return data ? data.map(item => mapDbToModel<Recording>(item, recordingColumnMapping)) : [];
  } catch (error) {
    console.error(`Error getting recordings for candidate ${candidateId}:`, error);
    return [];
  }
};

export const getRecordingsByQuestion = async (questionId: string): Promise<Recording[]> => {
  try {
    // Check if questionId is a valid UUID before querying
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // If it's not a UUID, try fetching the actual question first to get the real UUID
    if (!uuidRegex.test(questionId)) {
      console.log(`Question ID ${questionId} is not a UUID, attempting to find actual question record`);
      
      // If this is a demo "q1" style ID, we will fallback to localStorage
      // since these questions don't exist in Supabase with those IDs
      return [];
    }
    
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data ? data.map(item => mapDbToModel<Recording>(item, recordingColumnMapping)) : [];
  } catch (error) {
    console.error(`Error getting recordings for question ${questionId}:`, error);
    return [];
  }
};

export const addRecording = async (recording: Omit<Recording, 'id' | 'createdAt'>): Promise<string | null> => {
  try {
    console.log('Adding a new recording to Supabase database...');
    
    // Map model properties to database columns
    const dbRecording: any = {};
    for (const [modelKey, dbKey] of Object.entries(recordingColumnMapping)) {
      if (modelKey in recording) {
        dbRecording[dbKey] = (recording as any)[modelKey];
      }
    }
    
    // Add created_at field if not present
    if (!dbRecording.created_at) {
      dbRecording.created_at = new Date().toISOString();
    }
    
    // Add an ID if not present
    if (!dbRecording.id) {
      dbRecording.id = `recording_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }
    
    console.log('Saving recording to Supabase:', dbRecording);
    
    const { data, error } = await supabase
      .from('recordings')
      .insert([dbRecording])
      .select();
    
    if (error) {
      console.error('Error adding recording to Supabase:', error);
      throw error;
    }
    
    console.log('Recording added successfully to Supabase database');
    return data?.[0]?.id || null;
  } catch (error) {
    console.error('Error adding recording:', error);
    return null;
  }
};

export const updateRecordingNotes = async (id: string, notes: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('recordings')
      .update({ notes })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating notes for recording ${id}:`, error);
    return false;
  }
};

// Session Service
export const createSession = async (candidateId: string, questionIds: string[]): Promise<string | null> => {
  try {
    const dbSession = {
      candidate_id: candidateId,
      questions: questionIds,
      started_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('sessions')
      .insert([dbSession])
      .select();
    
    if (error) throw error;
    return data?.[0]?.id || null;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
};

export const completeSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error completing session ${sessionId}:`, error);
    return false;
  }
};

export const getSessionById = async (sessionId: string): Promise<Session | null> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) throw error;
    
    return data ? mapDbToModel<Session>(data, sessionColumnMapping) : null;
  } catch (error) {
    console.error(`Error getting session ${sessionId}:`, error);
    return null;
  }
};

// Storage Service for Audio Files
export const uploadAudioFile = async (file: File, path: string): Promise<string | null> => {
  try {
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(path, file, { 
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading audio file:', error);
      return null;
    }
    
    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(data.path);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Exception uploading audio file:', error);
    return null;
  }
};

// Delete a recording from both the database and storage
export const deleteRecording = async (id: string, storagePath: string): Promise<boolean> => {
  try {
    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('recordings')
      .remove([storagePath]);
    
    if (storageError) {
      console.error('Error deleting recording from storage:', storageError);
      return false;
    }
    
    // Delete the record from the database
    const { error: dbError } = await supabase
      .from('recordings')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      console.error('Error deleting recording from database:', dbError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting recording:', error);
    return false;
  }
};

// Add a new method to update recording with transcription and sentiment data
export const updateRecordingTranscript = async (
  id: string, 
  transcript: string,
  sentimentScore?: number,
  sentimentType?: string,
  summary?: string,
  topics?: Array<{topic: string, confidence: number}>
): Promise<boolean> => {
  try {
    console.log(`Updating recording ${id} with transcript and analysis data`);
    
    const updateData: any = {
      transcript,
      is_processed: true
    };
    
    // Add sentiment data if available
    if (sentimentScore !== undefined) {
      updateData.sentiment_score = sentimentScore;
    }
    
    if (sentimentType) {
      updateData.sentiment_type = sentimentType;
    }
    
    // Add summary if available
    if (summary) {
      updateData.summary = summary;
    }
    
    // Add topics if available
    if (topics && topics.length > 0) {
      updateData.topics = topics;
    }
    
    const { error } = await supabase
      .from('recordings')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error(`Error updating recording ${id} with transcript:`, error);
      throw error;
    }
    
    console.log(`Successfully updated recording ${id} with transcript and analysis data`);
    return true;
  } catch (error) {
    console.error(`Error updating recording transcript for ID ${id}:`, error);
    return false;
  }
};

// Add a method to get unprocessed recordings
export const getUnprocessedRecordings = async (): Promise<Recording[]> => {
  try {
    console.log('Fetching unprocessed recordings from Supabase...');
    
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .is('is_processed', null) // null or false
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error fetching unprocessed recordings:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} unprocessed recordings from Supabase`);
    
    // Map database columns to model properties
    return data ? data.map(item => mapDbToModel<Recording>(item, recordingColumnMapping)) : [];
  } catch (error) {
    console.error('Error getting unprocessed recordings:', error);
    return [];
  }
};

// Modify the get recordings method to include transcripts and sentiment data
// Replacing or adding to the existing getRecordings function
export const getRecordingsWithDetails = async (): Promise<Recording[]> => {
  try {
    console.log('Fetching all recordings with details from Supabase...');
    
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error fetching recordings with details:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} recordings with details from Supabase`);
    
    // Map database columns to model properties and include transcript and sentiment data
    return data ? data.map(item => {
      const recording = mapDbToModel<Recording>(item, recordingColumnMapping);
      
      // Add transcript and sentiment data if they exist in the database row
      recording.transcript = item.transcript || '';
      recording.sentimentScore = item.sentiment_score;
      recording.sentimentType = item.sentiment_type;
      recording.isProcessed = item.is_processed === true;
      
      return recording;
    }) : [];
  } catch (error) {
    console.error('Error getting recordings with details:', error);
    return [];
  }
}; 