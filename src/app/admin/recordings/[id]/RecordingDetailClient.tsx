'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Recording, Question, Candidate } from '@/lib/models/types';

// Get recording from localStorage
const getRecordingById = async (id: string): Promise<Recording | null> => {
  try {
    // Try to get recordings from localStorage
    const storedRecordings = localStorage.getItem('recordings');
    if (storedRecordings) {
      const recordings: Recording[] = JSON.parse(storedRecordings);
      const recording = recordings.find(r => r.id === id);
      if (recording) {
        return recording;
      }
    }
    
    // For the MVP demo, return a mock recording if id matches and not found in localStorage
    if (id === 'demo-recording') {
      return {
        id: 'demo-recording',
        candidateId: 'demo-candidate',
        questionId: 'question1',
        transcript: 'This is a mock transcript for demonstration purposes. In a real application, this would be the actual transcription of the candidate\'s response to the interview question.',
        audioUrl: '#', // This would be a real audio URL in production
        createdAt: new Date().toISOString(),
        notes: 'Initial notes about this candidate response.'
      };
    }
    return null;
  } catch (error) {
    console.error(`Error getting recording with ID ${id}:`, error);
    return null;
  }
};

// Get question from localStorage
const getQuestionById = async (id: string): Promise<Question | null> => {
  try {
    // Try to get questions from localStorage
    const storedQuestions = localStorage.getItem('questions');
    if (storedQuestions) {
      const questions: Question[] = JSON.parse(storedQuestions);
      const question = questions.find(q => q.id === id);
      if (question) {
        return question;
      }
    }
    
    // Return from demo questions if not found
    const demoQuestions: Record<string, Question> = {
      'question1': {
        id: 'question1',
        text: 'Tell me about your professional background and experience.',
        category: 'Background',
        createdAt: new Date().toISOString(),
      },
      'question2': {
        id: 'question2',
        text: 'Describe a challenging project you worked on and how you overcame obstacles.',
        category: 'Experience',
        createdAt: new Date().toISOString(),
      },
      'question3': {
        id: 'question3',
        text: 'Why are you interested in this position and what makes you a good fit?',
        category: 'Motivation',
        createdAt: new Date().toISOString(),
      },
    };
    
    return demoQuestions[id] || null;
  } catch (error) {
    console.error(`Error getting question with ID ${id}:`, error);
    return null;
  }
};

// Get candidate from localStorage
const getCandidateById = async (id: string): Promise<Candidate | null> => {
  try {
    // Try to get candidates from localStorage
    const storedCandidates = localStorage.getItem('candidates');
    if (storedCandidates) {
      const candidates: Candidate[] = JSON.parse(storedCandidates);
      const candidate = candidates.find(c => c.id === id);
      if (candidate) {
        return candidate;
      }
    }
    
    // Return demo candidate if id matches
    if (id === 'demo-candidate') {
      return {
        id: 'demo-candidate',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        createdAt: new Date().toISOString(),
        sessionId: 'demo-session',
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting candidate with ID ${id}:`, error);
    return null;
  }
};

// Update recording notes in localStorage
const updateRecordingNotes = async (id: string, notes: string): Promise<boolean> => {
  try {
    // Get recordings from localStorage
    const storedRecordings = localStorage.getItem('recordings');
    if (!storedRecordings) {
      return false;
    }
    
    const recordings: Recording[] = JSON.parse(storedRecordings);
    const recordingIndex = recordings.findIndex(r => r.id === id);
    
    if (recordingIndex === -1) {
      return false;
    }
    
    // Update the notes
    recordings[recordingIndex].notes = notes;
    
    // Save back to localStorage
    localStorage.setItem('recordings', JSON.stringify(recordings));
    
    return true;
  } catch (error) {
    console.error(`Error updating notes for recording ${id}:`, error);
    return false;
  }
};

export default function RecordingDetailClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get recording data from localStorage
        const recordingData = await getRecordingById(params.id);
        
        if (!recordingData) {
          setError('Recording not found');
          setLoading(false);
          return;
        }
        
        setRecording(recordingData);
        setNotes(recordingData.notes || '');
        
        // Get related question data from localStorage
        const questionData = await getQuestionById(recordingData.questionId);
        setQuestion(questionData);
        
        // Get related candidate data from localStorage
        const candidateData = await getCandidateById(recordingData.candidateId);
        setCandidate(candidateData);
      } catch (error) {
        console.error('Error fetching recording data:', error);
        setError('An error occurred while loading the recording data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.id]);

  const handleSaveNotes = async () => {
    if (!recording?.id) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      
      // Update notes in localStorage
      const success = await updateRecordingNotes(recording.id, notes);
      
      if (!success) {
        throw new Error('Failed to update notes');
      }
      
      setSaveSuccess(true);
      
      // Update the recording state with new notes
      setRecording({
        ...recording,
        notes,
      });
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving notes:', error);
      setError('An error occurred while saving notes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
          <p className="mt-4 text-lg font-medium text-gray-700">Loading recording data...</p>
        </div>
      </div>
    );
  }

  if (error || !recording || !candidate || !question) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error || 'An unexpected error occurred.'}</p>
          <Link
            href="/admin"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Recording Details</h1>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Candidate Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-base text-gray-900">{candidate.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base text-gray-900">{candidate.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Interview Date</p>
                <p className="text-base text-gray-900">{new Date(recording.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Question</h2>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-gray-800">{question.text}</p>
              {question.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                  {question.category}
                </span>
              )}
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Response</h2>
            
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Audio Recording</p>
              {recording.audioUrl && recording.audioUrl.startsWith('data:audio') ? (
                <audio 
                  src={recording.audioUrl} 
                  controls 
                  className="w-full"
                  onError={(e) => {
                    console.error('Audio playback error:', e);
                    // Set fallback text when audio fails to load
                    const target = e.target as HTMLAudioElement;
                    target.style.display = 'none';
                    target.parentElement?.appendChild(
                      Object.assign(document.createElement('div'), {
                        className: 'p-4 bg-red-50 text-red-700 rounded-md',
                        textContent: 'Audio playback error. The recording may be corrupted or in an unsupported format.'
                      })
                    );
                  }}
                />
              ) : (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                  Audio format not supported or audio not available
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Transcription</p>
              <div className="p-4 bg-gray-50 rounded-md max-h-48 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-line">{recording.transcript}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Evaluation Notes</h2>
            
            <div className="mb-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add your notes about this candidate's response..."
              />
            </div>
            
            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                Notes saved successfully!
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Notes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 