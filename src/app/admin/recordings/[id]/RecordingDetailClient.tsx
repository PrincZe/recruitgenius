'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { Recording, Question, Candidate } from '@/lib/models/types';
import { supabase } from '@/lib/supabase/supabaseClient';

// Get recording from Supabase
const getRecordingById = async (id: string): Promise<Recording | null> => {
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
    
    if (!data) {
      return null;
    }
    
    // Convert database format to application format
    return {
      id: data.id,
      candidateId: data.candidate_id,
      questionId: data.question_id,
      audioUrl: data.audio_url,
      transcript: data.transcript || '',
      createdAt: data.created_at,
      notes: data.notes || ''
    };
  } catch (error) {
    console.error(`Error getting recording with ID ${id}:`, error);
    return null;
  }
};

// Get question from Supabase
const getQuestionById = async (id: string): Promise<Question | null> => {
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
    
    if (!data) {
      return null;
    }
    
    // Convert database format to application format
    return {
      id: data.id,
      text: data.text,
      category: data.category || 'General',
      createdAt: data.created_at
    };
  } catch (error) {
    console.error(`Error getting question with ID ${id}:`, error);
    return null;
  }
};

// Get candidate from Supabase
const getCandidateById = async (id: string): Promise<Candidate | null> => {
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
    
    if (!data) {
      return null;
    }
    
    // Convert database format to application format
    return {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      createdAt: data.created_at
    };
  } catch (error) {
    console.error(`Error getting candidate with ID ${id}:`, error);
    return null;
  }
};

// Update recording notes in Supabase
const updateRecordingNotes = async (id: string, notes: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('recordings')
      .update({ notes })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating recording notes:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating notes for recording with ID ${id}:`, error);
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
  const [processing, setProcessing] = useState(false);
  const [processingSuccess, setProcessingSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get recording data from Supabase
        const recordingData = await getRecordingById(params.id);
        
        if (!recordingData) {
          setError('Recording not found');
          setLoading(false);
          return;
        }
        
        setRecording(recordingData);
        setNotes(recordingData.notes || '');
        
        // Get related question data from Supabase
        const questionData = await getQuestionById(recordingData.questionId);
        setQuestion(questionData);
        
        // Get related candidate data from Supabase
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
      
      // Update notes in Supabase
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

  const handleProcessRecording = async () => {
    if (!recording || !recording.audioUrl) {
      setError('No audio URL available for processing');
      return;
    }

    try {
      setProcessing(true);
      setProcessingSuccess(false);
      setError(null);

      const response = await fetch('/api/recordings/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId: recording.id,
          audioUrl: recording.audioUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process recording');
      }

      const data = await response.json();
      
      // Update the recording state with the new data
      setRecording(prev => {
        if (!prev) return null;
        return {
          ...prev,
          transcript: data.transcript,
          sentimentScore: data.sentimentScore,
          sentimentType: data.sentimentType,
          isProcessed: true
        };
      });
      
      setProcessingSuccess(true);
    } catch (error) {
      console.error('Error processing recording:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  // Helper function to render sentiment score with color
  const renderSentimentScore = (score: number | undefined) => {
    if (score === undefined) return null;
    
    let color = 'text-gray-500';
    
    if (score > 0.5) color = 'text-green-500';
    else if (score > 0) color = 'text-green-400';
    else if (score === 0) color = 'text-gray-500';
    else if (score > -0.5) color = 'text-red-400';
    else color = 'text-red-500';
    
    return (
      <span className={`font-medium ${color}`}>
        {score.toFixed(2)}
      </span>
    );
  };

  // Helper function to render sentiment type with icon
  const renderSentimentType = (type: string | undefined) => {
    if (!type) return null;
    
    let icon = '😐';
    let color = 'text-gray-500';
    
    switch (type.toLowerCase()) {
      case 'positive':
        icon = '😊';
        color = 'text-green-500';
        break;
      case 'negative':
        icon = '😟';
        color = 'text-red-500';
        break;
      case 'neutral':
        icon = '😐';
        color = 'text-gray-500';
        break;
    }
    
    return (
      <span className={`font-medium ${color}`}>
        {icon} {type}
      </span>
    );
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
      
      {recording && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Audio Response</h2>
          <div className="bg-white p-4 rounded-md shadow-sm mb-4">
            <audio 
              src={recording.audioUrl} 
              controls 
              className="w-full"
              onError={(e) => {
                console.error('Audio playback error:', e);
                setError('Error playing audio. The audio file might be unavailable or in an unsupported format.');
              }}
            />
          </div>
        </div>
      )}
      
      {/* Transcript and Sentiment Analysis Section */}
      {recording && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Transcript & Sentiment Analysis</h2>
            <button
              className={`px-4 py-2 rounded-md flex items-center ${
                recording.isProcessed 
                  ? 'bg-gray-200 text-gray-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handleProcessRecording}
              disabled={processing || recording.isProcessed}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : recording.isProcessed ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Processed
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Process Recording
                </>
              )}
            </button>
          </div>
          
          {processingSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Recording processed successfully!
            </div>
          )}
          
          <div className="bg-white p-6 rounded-md shadow-sm mb-4">
            <h3 className="text-md font-medium mb-2">Transcript</h3>
            {recording.transcript ? (
              <div className="bg-gray-50 p-4 rounded mb-4">
                <p className="whitespace-pre-wrap">{recording.transcript}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                {recording.isProcessed 
                  ? "No transcript was generated." 
                  : "Click 'Process Recording' to generate a transcript."}
              </p>
            )}
            
            <h3 className="text-md font-medium mt-4 mb-2">Sentiment Analysis</h3>
            {recording.sentimentScore !== undefined && recording.sentimentType ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sentiment Score</p>
                  <p className="text-lg">
                    {renderSentimentScore(recording.sentimentScore)}
                    <span className="text-xs text-gray-500 ml-2">(-1 to 1 scale)</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Overall Sentiment</p>
                    <p className="text-lg">
                      {renderSentimentType(recording.sentimentType)}
                    </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                {recording.isProcessed 
                  ? "No sentiment analysis was generated." 
                  : "Click 'Process Recording' to analyze sentiment."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 