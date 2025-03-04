'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDeepgram } from '../lib/contexts/DeepgramContext';
import { motion } from 'framer-motion';
import { Mic, StopCircle, RefreshCw, Check, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { connectToDeepgram, disconnectFromDeepgram, connectionState, realtimeTranscript } = useDeepgram();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const questionIdRef = useRef<string | null>(null);
  
  // Clean up resources when component unmounts or questionId changes
  useEffect(() => {
    questionIdRef.current = questionId;
    
    // Reset state when question changes
    if (questionIdRef.current !== questionId) {
      setIsRecording(false);
      setAudioBlob(null);
      setAudioUrl('');
      setRecordingTime(0);
      setIsProcessing(false);
      setAudioError(null);
      setHasRecorded(false);
      setIsPreviewMode(false);
      
      // Clean up any recording in progress
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Disconnect from Deepgram if connected
      disconnectFromDeepgram();
    }
    
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      disconnectFromDeepgram();
    };
  }, [questionId, disconnectFromDeepgram, isRecording]);
  
  // Check if we have already recorded this question
  const checkExistingRecording = useCallback(async () => {
    if (!questionId) return;
    
    try {
      setIsLoading(true);
      
      try {
        // Check Supabase for existing recordings
        const existingRecordings = await getRecordingsByQuestion(questionId);
        const recording = existingRecordings.find(r => r.candidateId === candidateId);
        if (recording && recording.audioUrl) {
          console.log(`Found existing recording in Supabase for question ${questionId}`);
          
          setAudioUrl(recording.audioUrl);
          setHasRecorded(true);
          setIsPreviewMode(true);
          return;
        }
      } catch (err) {
        console.error(`Error retrieving Supabase recordings for question ${questionId}:`, err);
      }
      
      console.log(`No existing recording found for question ${questionId}`);
    } catch (error) {
      console.error('Error checking for existing recordings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [questionId, candidateId]);
  
  // Load existing recording when component mounts or questionId changes
  useEffect(() => {
    if (questionId) {
      checkExistingRecording();
    }
  }, [questionId, checkExistingRecording]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
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
      // Reset state
      setAudioError(null);
      setAudioBlob(null);
      setAudioUrl('');
      setRecordingTime(0);
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create a new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          // Create a single Blob from all the chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(audioBlob);
          
          // Create an object URL for the blob
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          console.log(`Recording stopped. Blob size: ${audioBlob.size} bytes`);
        } catch (error) {
          console.error('Error processing recording:', error);
          setAudioError(`Error processing recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      // Convert blob to a File object for Supabase upload
      const fileName = `${candidateId}_${questionId}_${recordingId}.${audioBlob.type.split('/')[1] || 'webm'}`;
      const audioFile = blobToFile(audioBlob, fileName);
      
      // Upload to Supabase Storage
      const storagePath = `${candidateId}/${fileName}`;
      const uploadResult = await uploadAudioFile(audioFile, storagePath);
      
      if (!uploadResult) {
        throw new Error('Failed to upload audio file to Supabase');
      }
      
      const audioUrlFromStorage = uploadResult as string;
      
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

      const addResult = await addRecording(recordingData);
      
      if (!addResult) {
        throw new Error('Failed to add recording record to Supabase');
      }
      
      const newRecordingId = addResult as string;
      console.log('Recording saved to Supabase:', newRecordingId);
      
      // Update UI state to show the recording is saved
      setHasRecorded(true);
      setIsPreviewMode(true);
      
      // Call onRecordingComplete callback with the recorded data
      if (onRecordingComplete) {
        onRecordingComplete({
          audioUrl: audioUrlFromStorage as string,
          transcript: transcript,
          candidateId,
          questionId,
        });
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error saving recording:', error);
      setAudioError(`Error saving recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  const handleReRecord = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setAudioError(null);
    setIsPreviewMode(false);
    setHasRecorded(false);
  };

  const handleAudioError = () => {
    setAudioError('Error playing audio. Please try recording again.');
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-600">Loading recording...</span>
        </div>
      ) : isPreviewMode ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-800">Your Recording</h3>
            <button 
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              onClick={handleReRecord}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Record Again
            </button>
          </div>
          
          {audioError ? (
            <div className="flex items-center p-3 bg-red-50 text-red-800 rounded-md">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              <p className="text-sm">{audioError}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-md">
                <audio 
                  src={audioUrl} 
                  controls 
                  className="w-full" 
                  onError={handleAudioError}
                />
              </div>
              
              <div className="flex items-center text-sm text-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Recording saved successfully
              </div>
              
              {realtimeTranscript && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Transcript:</h4>
                  <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">{realtimeTranscript}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4">
            {audioBlob ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <audio 
                    src={audioUrl} 
                    controls 
                    className="w-full" 
                    onError={handleAudioError}
                  />
                </div>
                
                {audioError ? (
                  <div className="flex items-center p-3 bg-red-50 text-red-800 rounded-md">
                    <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                    <p className="text-sm">{audioError}</p>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleReRecord}
                      className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Record Again
                    </button>
                    
                    <button
                      onClick={handleSaveRecording}
                      disabled={isProcessing}
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Save Recording
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-600">
                <Mic className="w-5 h-5" />
                <span>Ready to record your answer</span>
              </div>
            )}
          </div>
          
          {audioError && !audioBlob && (
            <div className="mb-4 flex items-center p-3 bg-red-50 text-red-800 rounded-md">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              <p className="text-sm">{audioError}</p>
            </div>
          )}
          
          {!audioBlob && (
            <div>
              {isRecording ? (
                <div>
                  <motion.div 
                    className="mb-4 p-4 bg-red-50 rounded-md flex items-center justify-between"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                        <motion.div 
                          className="absolute top-0 left-0 w-3 h-3 bg-red-600 rounded-full"
                          animate={{ scale: [1, 2], opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        ></motion.div>
                      </div>
                      <span className="ml-3 font-medium text-red-800">Recording in progress</span>
                    </div>
                    <span className="text-red-800 font-mono">{formatTime(recordingTime)}</span>
                  </motion.div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <StopCircle className="w-5 h-5 mr-2" />
                      Stop Recording
                    </button>
                  </div>
                  
                  {/* Check if Deepgram connection is open to display transcript */}
                  {connectionState && connectionState.toString() === "open" && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Real-time transcript:</p>
                      <p className="text-sm text-gray-700">
                        {realtimeTranscript || "Speak clearly into your microphone..."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}