// Question type
export interface Question {
  id: string;
  text: string;
  category?: string;
  createdAt: string;
}

// Candidate type
export interface Candidate {
  id: string;
  name: string;
  email: string;
  sessionId?: string;
  createdAt: string;
}

// Recording type
export interface Recording {
  id: string;
  candidateId: string;
  questionId: string;
  transcript: string;
  audioUrl: string;
  notes?: string;
  sentimentScore?: number;
  sentimentType?: string;
  summary?: string;
  topics?: Array<{topic: string, confidence: number}>;
  isProcessed?: boolean;
  createdAt: string;
}

// Session type
export interface Session {
  id: string;
  candidateId: string;
  questions: string[];
  progress: number;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
}

// Column mappings for database to model conversion
export const questionColumnMapping: Record<string, string> = {
  id: 'id',
  text: 'text',
  category: 'category',
  createdAt: 'created_at'
};

export const candidateColumnMapping: Record<string, string> = {
  id: 'id',
  name: 'name',
  email: 'email',
  sessionId: 'session_id',
  createdAt: 'created_at'
};

export const recordingColumnMapping: Record<string, string> = {
  id: 'id',
  candidateId: 'candidate_id',
  questionId: 'question_id',
  transcript: 'transcript',
  audioUrl: 'audio_url',
  notes: 'notes',
  sentimentScore: 'sentiment_score',
  sentimentType: 'sentiment_type',
  summary: 'summary',
  topics: 'topics',
  isProcessed: 'is_processed',
  createdAt: 'created_at'
};

export const sessionColumnMapping: Record<string, string> = {
  id: 'id',
  candidateId: 'candidate_id',
  questions: 'questions',
  startedAt: 'started_at',
  completedAt: 'completed_at'
};

// Helper functions for future Supabase integration
export const supabaseHelpers = {
  // Convert a recording for Supabase storage
  prepareRecordingForSupabase: (recording: Recording): any => {
    // This function would prepare the recording data for Supabase
    // For example, it might convert the base64 audio to a file for storage
    return {
      id: recording.id,
      candidate_id: recording.candidateId,
      question_id: recording.questionId,
      transcript: recording.transcript,
      // In a real implementation, you would upload the audio file to Supabase Storage
      // and store the URL here instead of the base64 string
      audio_url: recording.audioUrl,
      created_at: recording.createdAt,
      notes: recording.notes || null
    };
  },
  
  // Convert a candidate for Supabase storage
  prepareCandidateForSupabase: (candidate: Candidate): any => {
    return {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      session_id: candidate.sessionId,
      created_at: candidate.createdAt
    };
  },
  
  // Convert a session for Supabase storage
  prepareSessionForSupabase: (session: Session): any => {
    return {
      id: session.id,
      candidate_id: session.candidateId,
      questions: session.questions,
      progress: session.progress,
      is_completed: session.isCompleted,
      created_at: session.createdAt,
      completed_at: session.completedAt || null
    };
  }
}; 