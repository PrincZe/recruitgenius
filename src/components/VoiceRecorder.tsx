'use client';

import { useState, useEffect, useRef } from 'react';
import { useDeepgram } from '../lib/contexts/DeepgramContext';
import { motion } from 'framer-motion';
import { Mic, Pause, Loader2, Send, Volume2, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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

  // Check if there's an existing recording for this question
  const checkExistingRecording = () => {
    try {
      const recordingsData = localStorage.getItem('recordings');
      if (recordingsData) {
        const recordings = JSON.parse(recordingsData);
        const existingRecording = recordings.find(
          (r: any) => r.candidateId === candidateId && r.questionId === questionId
        );
        
        if (existingRecording && existingRecording.audioUrl) {
          console.log(`Found existing recording for question ${questionId}`);
          setAudioBase64(existingRecording.audioUrl);
          setAudioUrl(existingRecording.audioUrl);
          return true;
        }
      }
      console.log(`No existing recording found for question ${questionId}`);
      return false;
    } catch (error) {
      console.error('Error checking existing recording:', error);
      return false;
    }
  };

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Cleanup function for audio URL
  useEffect(() => {
    return () => {
      // Revoke any object URLs to prevent memory leaks
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleStartRecording = async () => {
    try {
      // Reset state
      setAudioBlob(null);
      setAudioError(null);
      
      // Revoke previous URL if exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      
      setAudioUrl(null);
      setAudioBase64(null);
      setRecordingTime(0);
      audioChunksRef.current = [];

      // Start Deepgram for real-time transcription
      await connectToDeepgram();

      // Start audio recording with MediaRecorder
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try multiple audio formats for better compatibility
      let mediaRecorder;
      const mimeTypes = [
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav',
        ''  // Let the browser decide
      ];
      
      for (const mimeType of mimeTypes) {
        if (mimeType === '' || MediaRecorder.isTypeSupported(mimeType)) {
          try {
            mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            console.log(`Using MIME type: ${mediaRecorder.mimeType}`);
            break;
          } catch (e) {
            console.warn(`Failed to create MediaRecorder with MIME type ${mimeType}:`, e);
          }
        }
      }
      
      if (!mediaRecorder) {
        throw new Error('No supported media recorder format found');
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          // Create a blob with the detected type
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          setAudioBlob(audioBlob);
          
          // Create a URL for preview in the browser
          const url = URL.createObjectURL(audioBlob);
          audioUrlRef.current = url;
          setAudioUrl(url);
          
          // Also convert to base64 for storage
          try {
            const base64 = await blobToBase64(audioBlob);
            setAudioBase64(base64);
          } catch (error) {
            console.error('Error converting audio to base64:', error);
            setAudioError('Error processing audio. Please try recording again.');
          }
        } catch (error) {
          console.error('Error processing audio after recording:', error);
          setAudioError('Error processing audio. Please try recording again.');
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every 1000ms (1 second) for more stable chunks
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setAudioError('Could not access microphone. Please check your browser permissions.');
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    try {
      // Stop MediaRecorder and Deepgram
      mediaRecorderRef.current.stop();
      disconnectFromDeepgram();
      setIsRecording(false);

      // Clean up MediaRecorder tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      setAudioError('Error stopping recording. Please try again.');
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
      
      // Convert to base64 if not already done
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
      
      // If we still don't have base64 audio, create a placeholder
      if (!base64Audio) {
        setAudioError('No audio data available. Please try recording again.');
        setIsProcessing(false);
        return;
      }
      
      // Use an empty string if no transcript is available
      const transcript = realtimeTranscript || "";
      console.log('Using transcript:', transcript ? 'Available' : 'Empty');
      
      // Save recording data to localStorage
      const recordingData = {
        id: recordingId,
        candidateId,
        questionId,
        transcript: transcript,
        audioUrl: base64Audio, // Store as base64 string
        createdAt: new Date().toISOString(),
      };

      // Get existing recordings or initialize empty array
      const existingRecordings = JSON.parse(localStorage.getItem('recordings') || '[]');
      
      // Check if a recording for this question already exists
      const existingIndex = existingRecordings.findIndex(
        (r: any) => r.candidateId === candidateId && r.questionId === questionId
      );
      
      if (existingIndex >= 0) {
        // Update existing recording
        console.log(`Updating existing recording at index ${existingIndex}`);
        existingRecordings[existingIndex] = recordingData;
      } else {
        // Add new recording
        console.log(`Adding new recording for question ${questionId}`);
        existingRecordings.push(recordingData);
      }
      
      // Save back to localStorage
      localStorage.setItem('recordings', JSON.stringify(existingRecordings));

      // Call onRecordingComplete callback with the recorded data
      if (onRecordingComplete) {
        onRecordingComplete({
          audioUrl: base64Audio,
          transcript: transcript,
          candidateId,
          questionId,
        });
      }
      
      console.log('Recording saved successfully:', recordingId);
    } catch (error) {
      console.error('Error saving recording:', error);
      setAudioError('Error saving recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudioError = () => {
    console.warn('Audio playback error detected');
    setAudioError('Audio playback error. Try recording again.');
    
    // Try alternative playback methods if available
    if (audioElementRef.current && audioBase64) {
      console.log('Attempting to use base64 audio as fallback');
      audioElementRef.current.src = audioBase64;
    }
  };

  // Initialize component - check for existing recordings
  useEffect(() => {
    checkExistingRecording();
  }, []);

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col space-y-4">
        {!isRecording && !audioUrl && (
          <button
            onClick={handleStartRecording}
            className="flex items-center justify-center w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </button>
        )}

        {isRecording && (
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="relative mb-4">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
                className="flex items-center justify-center w-16 h-16 bg-red-500 rounded-full"
              >
                <Mic className="w-8 h-8 text-white" />
              </motion.div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-100 rounded-full"></div>
              </div>
            </div>
            <div className="text-xl font-bold mb-2">{formatTime(recordingTime)}</div>
            <button
              onClick={handleStopRecording}
              className="flex items-center justify-center px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
            >
              <Pause className="w-5 h-5 mr-2" />
              Stop Recording
            </button>
          </div>
        )}

        {audioUrl && !isRecording && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mb-2 font-medium">Preview your recording:</div>
            <audio 
              ref={audioElementRef}
              controls 
              src={audioUrl} 
              className="w-full mb-4"
              onError={handleAudioError}
            ></audio>
            
            {audioError && (
              <div className="p-2 mb-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {audioError}. <button 
                  onClick={handleStartRecording} 
                  className="text-blue-600 hover:underline"
                >
                  Try recording again
                </button>
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={handleStartRecording}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Re-record
              </button>
              <button
                onClick={handleSaveRecording}
                disabled={isProcessing || !!audioError}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                {isProcessing ? "Saving..." : "Submit Recording"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}