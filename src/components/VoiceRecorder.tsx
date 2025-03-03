'use client';

import { useState, useEffect, useRef } from 'react';
import { useDeepgram } from '../lib/contexts/DeepgramContext';
import { motion } from 'framer-motion';
import { Mic, Pause, Loader2, Send } from 'lucide-react';
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
  const { connectToDeepgram, disconnectFromDeepgram, connectionState, realtimeTranscript } = useDeepgram();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);

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
      
      // Use a simpler audio format to avoid corruption issues
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm' // Simplified format without codecs specification
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          // Create a blob with a simpler type
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
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
          }
        } catch (error) {
          console.error('Error processing audio after recording:', error);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every 1000ms (1 second) for more stable chunks
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
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
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSaveRecording = async () => {
    // Remove the transcript check to allow submission even without a transcript
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
        }
      }
      
      // If we still don't have base64 audio, create a placeholder
      if (!base64Audio) {
        base64Audio = "data:audio/webm;base64,PLACEHOLDER";
        console.warn('Using placeholder for audio data');
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
      
      // Add new recording
      existingRecordings.push(recordingData);
      
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
    } finally {
      setIsProcessing(false);
    }
  };

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
                  ease: "easeInOut",
                }}
                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"
              >
                <Mic className="w-6 h-6 text-white" />
              </motion.div>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                REC
              </span>
            </div>
            <div className="font-mono text-2xl font-bold mb-4">{formatTime(recordingTime)}</div>
            <button
              onClick={handleStopRecording}
              className="flex items-center justify-center w-full py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
              <Pause className="w-5 h-5 mr-2" />
              Stop Recording
            </button>
          </div>
        )}

        {!isRecording && audioUrl && (
          <div className="flex flex-col space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Preview your recording:</div>
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              <audio 
                controls 
                className="w-full"
                src={audioUrl}
                onError={(e) => {
                  console.error('Audio playback error:', e);
                  // Try to use the base64 version if available
                  if (audioBase64 && e.currentTarget) {
                    console.log('Falling back to base64 audio');
                    e.currentTarget.src = audioBase64;
                  }
                }}
              />
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-600">
                {realtimeTranscript 
                  ? realtimeTranscript 
                  : <span className="text-gray-400 italic">No transcript available. You can still submit your recording.</span>}
              </p>
            </div>
            <button
              onClick={handleSaveRecording}
              disabled={isProcessing || !audioBlob}
              className="flex items-center justify-center w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Recording
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}