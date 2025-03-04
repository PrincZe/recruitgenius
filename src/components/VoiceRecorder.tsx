'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDeepgram } from '../lib/contexts/DeepgramContext';
import { motion } from 'framer-motion';
import { Mic, Pause, Loader2, Send, Volume2, RefreshCw, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { addRecording, uploadAudioFile, getRecordingsByQuestion } from '../lib/services/supabaseService';

interface VoiceRecorderProps {
  questionId: string;
  candidateId: string;
  onRecordingComplete?: (data: {
    audioUrl: string;
    transcript: string;
    candidateId: string;
    questionId: string;
  }) => void;
}

export default function VoiceRecorder({ questionId, candidateId, onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { connectToDeepgram, disconnectFromDeepgram, connectionState, realtimeTranscript } = useDeepgram();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const currentQuestionIdRef = useRef<string>(questionId);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Reset component state when questionId changes
  useEffect(() => {
    console.log(`VoiceRecorder: questionId changed from ${currentQuestionIdRef.current} to ${questionId}`);
    
    // Only reset if questionId has actually changed
    if (currentQuestionIdRef.current !== questionId) {
      // Cleanup previous recording
      if (mediaRecorderRef.current && isRecording) {
        console.log('Stopping ongoing recording due to question change');
        mediaRecorderRef.current.stop();
        disconnectFromDeepgram();
        
        // Clean up MediaRecorder tracks
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
      
      // Reset state
      setIsRecording(false);
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioError(null);
      
      // Revoke previous URL if exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      
      setAudioUrl(null);
      setAudioBase64(null);
      audioChunksRef.current = [];
      
      // Update the ref
      currentQuestionIdRef.current = questionId;
      
      // Check if this question already has a recording
      checkExistingRecording();
    }
  }, [questionId, disconnectFromDeepgram, isRecording]);

  // Check if we have already recorded this question
  const checkExistingRecording = useCallback(async () => {
    if (!questionId) return;
    
    try {
      setIsLoading(true);
      
      // First check if the questionId is a demo format (like q1, q2)
      const isDemo = /^q\d+$/i.test(questionId);
      console.log(`Checking for recording with ${isDemo ? 'demo' : 'UUID'} question ID: ${questionId}`);
      
      // If this is a demo question, prioritize checking localStorage
      if (isDemo) {
        const recordingsData = localStorage.getItem('recordings');
        if (recordingsData) {
          try {
            const recordings = JSON.parse(recordingsData);
            const existingRecording = recordings.find(
              (r: any) => r.questionId === questionId && r.candidateId === candidateId
            );
            
            if (existingRecording) {
              console.log(`Found existing recording in localStorage for demo question ${questionId}`);
              setAudioBase64(existingRecording.audioUrl);
              setAudioUrl(existingRecording.audioUrl);
              setHasRecorded(true);
              setIsPreviewMode(true);
              return;
            }
          } catch (error) {
            console.error('Error parsing recordings data:', error);
          }
        }
      } else {
        // For UUID-format questions, check Supabase first
        try {
          // First check Supabase for existing recordings
          const existingRecordings = await getRecordingsByQuestion(questionId);
          const recording = existingRecordings.find(r => r.candidateId === candidateId);
          if (recording) {
            console.log(`Found existing recording in Supabase for question ${questionId}`);
            
            setAudioUrl(recording.audioUrl);
            setHasRecorded(true);
            setIsPreviewMode(true);
            return;
          }
        } catch (err) {
          console.error(`Error retrieving Supabase recordings for question ${questionId}:`, err);
        }
        
        // As a fallback, check localStorage 
        const recordingsData = localStorage.getItem('recordings');
        if (recordingsData) {
          try {
            const recordings = JSON.parse(recordingsData);
            const existingRecording = recordings.find(
              (r: any) => r.questionId === questionId && r.candidateId === candidateId
            );
            
            if (existingRecording) {
              console.log(`Found existing recording in localStorage for question ${questionId}`);
              setAudioBase64(existingRecording.audioUrl);
              setAudioUrl(existingRecording.audioUrl);
              setHasRecorded(true);
              setIsPreviewMode(true);
            }
          } catch (error) {
            console.error('Error parsing recordings data:', error);
          }
        }
      }
      
      console.log(`No existing recording found for question ${questionId}`);
    } catch (error) {
      console.error('Error checking for existing recordings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [questionId, candidateId, setAudioUrl, setAudioBase64]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Extract only the base64 data part if it's a data URL
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  
  const blobToFile = (blob: Blob, fileName: string): File => {
    return new File([blob], fileName, { type: blob.type });
  };

  const handleStartRecording = async () => {
    try {
      setAudioError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine the supported audio format
      const mimeTypes = [
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
        'audio/wav'
      ];
      
      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      if (!mimeType) {
        throw new Error('No supported audio format found for your browser');
      }
      
      // Start recording
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // When recording is stopped, concatenate chunks to create a blob
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          setAudioBlob(audioBlob);
          
          // Create an object URL for the audio blob
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          audioUrlRef.current = url;
          
          // Also store as base64 for backup playback option
          try {
            const base64Data = await blobToBase64(audioBlob);
            setAudioBase64(base64Data);
          } catch (error) {
            console.error("Error converting blob to base64:", error);
          }
        }
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start the media recorder
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start the timer to track recording duration
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
      
      // Start Deepgram for real-time transcription
      await connectToDeepgram();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setAudioError(`Microphone access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        // Stop the media recorder
        mediaRecorderRef.current.stop();
        
        // Clear the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Stop Deepgram connection
        disconnectFromDeepgram();
        
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setAudioError(`Error stopping recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSaveRecording = async () => {
    try {
      setIsProcessing(true);

      // Generate a unique ID for the recording
      const recordingId = uuidv4();
      
      // Make sure we have a blob to work with
      if (!audioBlob) {
        setAudioError('No audio data available. Please try recording again.');
        setIsProcessing(false);
        return;
      }
      
      // Convert to base64 if not already done (as backup for playback)
      let base64Audio = audioBase64;
      if (!base64Audio && audioBlob) {
        try {
          base64Audio = await blobToBase64(audioBlob);
          setAudioBase64(base64Audio);
        } catch (error) {
          console.error('Error converting audio to base64:', error);
          setAudioError('Error saving recording. Please try again.');
          setIsProcessing(false);
          return;
        }
      }
      
      // Check if the questionId is a demo format (like q1, q2)
      const isDemo = /^q\d+$/i.test(questionId);
      console.log(`Saving recording with ${isDemo ? 'demo' : 'UUID'} question ID: ${questionId}`);
      
      let audioUrlFromStorage = '';
      let newRecordingId = '';
      
      // For demo questions that don't exist in Supabase, only save to localStorage
      if (!isDemo) {
        try {
          // Convert blob to a File object for Supabase upload
          const fileName = `${candidateId}_${questionId}_${recordingId}.${audioBlob.type.split('/')[1] || 'webm'}`;
          const audioFile = blobToFile(audioBlob, fileName);
          
          // Upload to Supabase Storage
          const storagePath = `${candidateId}/${fileName}`;
          audioUrlFromStorage = await uploadAudioFile(audioFile, storagePath);
          
          if (!audioUrlFromStorage) {
            throw new Error('Failed to upload audio file to Supabase');
          }
          
          // Use an empty string if no transcript is available
          const transcript = realtimeTranscript || "";
          console.log('Using transcript:', transcript ? 'Available' : 'Empty');
          
          // Add recording record to Supabase database
          const recordingData = {
            candidateId,
            questionId,
            transcript: transcript,
            audioUrl: audioUrlFromStorage,
          };

          newRecordingId = await addRecording(recordingData);
          
          if (!newRecordingId) {
            throw new Error('Failed to add recording record to Supabase');
          }
          
          console.log('Recording saved to Supabase:', newRecordingId);
        } catch (error) {
          console.error('Error saving to Supabase:', error);
          // Fall back to localStorage if Supabase fails
          audioUrlFromStorage = '';
        }
      }
      
      // During migration period, also save to localStorage as a backup
      // For demo questions, this will be the primary storage
      try {
        const recordingForStorage = {
          id: newRecordingId || recordingId,
          candidateId,
          questionId,
          transcript: realtimeTranscript || "",
          audioUrl: audioUrlFromStorage || base64Audio, // Use Supabase URL if available, otherwise base64
          createdAt: new Date().toISOString()
        };
        
        // Get existing recordings from localStorage
        const existingRecordings = JSON.parse(localStorage.getItem('recordings') || '[]');
        
        // Check if a recording already exists for this question and candidate
        const existingIndex = existingRecordings.findIndex(
          (r: any) => r.questionId === questionId && r.candidateId === candidateId
        );
        
        if (existingIndex >= 0) {
          // Replace the existing recording
          existingRecordings[existingIndex] = recordingForStorage;
        } else {
          // Add as a new recording
          existingRecordings.push(recordingForStorage);
        }
        
        // Save back to localStorage
        localStorage.setItem('recordings', JSON.stringify(existingRecordings));
        console.log('Recording saved to localStorage');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }

      // Call onRecordingComplete callback with the recorded data
      if (onRecordingComplete) {
        onRecordingComplete({
          audioUrl: audioUrlFromStorage || base64Audio,
          transcript: realtimeTranscript || "",
          candidateId,
          questionId,
        });
      }
    } catch (error) {
      console.error('Error saving recording:', error);
      setAudioError(`Error saving recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudioError = () => {
    console.warn('Audio playback error detected');
    setAudioError('Audio playback error. Try recording again.');
    
    // Try alternative playback methods if available
    if (audioElementRef.current) {
      if (audioBase64) {
        console.log('Attempting to use base64 audio as fallback');
        // Try data URL format
        const dataUrl = `data:audio/webm;base64,${audioBase64}`;
        audioElementRef.current.src = dataUrl;
        audioElementRef.current.load();
        audioElementRef.current.play().catch(err => {
          console.error('Error playing base64 audio:', err);
        });
      } else if (audioBlob) {
        // Try recreating the blob URL
        console.log('Attempting to recreate blob URL');
        const newUrl = URL.createObjectURL(audioBlob);
        audioElementRef.current.src = newUrl;
        audioElementRef.current.load();
        audioElementRef.current.play().catch(err => {
          console.error('Error playing recreated blob URL:', err);
        });
        
        // Store the new URL for cleanup later
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioUrlRef.current = newUrl;
        setAudioUrl(newUrl);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing recording
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        
        // Clean up MediaRecorder tracks
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
      
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Revoke object URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      // Disconnect from Deepgram
      disconnectFromDeepgram();
    };
  }, [isRecording, disconnectFromDeepgram]);

  useEffect(() => {
    if (questionId) {
      checkExistingRecording();
    }
  }, [questionId, checkExistingRecording]);

  return (
    <div className="flex flex-col space-y-4 w-full max-w-md mx-auto">
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading recording...</span>
        </div>
      )}
      
      {/* Error display */}
      {audioError && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-600">{audioError}</p>
            <button 
              onClick={() => setAudioError(null)} 
              className="text-xs text-red-500 mt-1 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      {/* Recording visualizer */}
      <div className="relative h-24 bg-gray-100 rounded-lg overflow-hidden">
        {isRecording ? (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-full flex justify-center items-center space-x-1">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full"
                  animate={{
                    height: [20, Math.random() * 60 + 10, 20],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 bg-blue-100 rounded-full text-xs font-medium text-blue-800">
              {formatTime(recordingTime)}
            </div>
          </motion.div>
        ) : audioUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <audio 
              ref={audioElementRef}
              src={audioUrl} 
              controls 
              className="w-full max-w-xs" 
              onError={handleAudioError}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <p>Click record to start capturing your answer</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {isRecording ? (
          <button
            onClick={handleStopRecording}
            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={isProcessing}
          >
            <Pause className="w-5 h-5 mr-2" />
            Stop Recording
          </button>
        ) : (
          <button
            onClick={handleStartRecording}
            className={`flex items-center justify-center px-4 py-2 ${
              audioUrl ? 'bg-gray-600' : 'bg-blue-600'
            } text-white rounded-full hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isProcessing}
          >
            {audioUrl ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Record Again
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </>
            )}
          </button>
        )}

        {audioUrl && !isRecording && (
          <button
            onClick={handleSaveRecording}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Save Response
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Transcription display */}
      {realtimeTranscript && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Live Transcript:</h3>
          <p className="text-gray-600 text-sm">{realtimeTranscript}</p>
        </div>
      )}
    </div>
  );
}