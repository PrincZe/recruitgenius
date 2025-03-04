'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { Mic, Square, RefreshCw, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  questionId: string;
  candidateId: string;
  onRecordingComplete?: (data: {
    audioUrl: string;
    transcript: string | null;
    candidateId: string;
    questionId: string;
  }) => void;
}

export default function VoiceRecorder({ questionId, candidateId, onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingSaved, setRecordingSaved] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const questionIdRef = useRef<string>(questionId);

  // Cleanup function
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  // Track question changes
  useEffect(() => {
    // If question changes, clean up previous recording state
    if (questionIdRef.current !== questionId) {
      cleanupRecording();
      setAudioUrl(null);
      setError(null);
      setRecordingSaved(false);
      questionIdRef.current = questionId;
    }
  }, [questionId]);

  const cleanupRecording = () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping media recorder:', error);
      }
    }

    // Stop and release media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Reset recording state
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
  };

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

  const blobToFile = (blob: Blob, fileName: string): File => {
    return new File([blob], fileName, { type: blob.type });
  };

  const handleStartRecording = async () => {
    setError(null);
    setAudioUrl(null);
    setRecordingSaved(false);
    audioChunksRef.current = [];

    try {
      // Request microphone access with specific constraints for better audio quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });
      
      streamRef.current = stream;
      
      // Try different MIME types for better browser compatibility
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      
      let mimeType = '';
      
      // Find a supported MIME type
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      if (!mimeType) {
        throw new Error('No supported MIME types found for audio recording');
      }
      
      console.log(`Using MIME type: ${mimeType} for recording`);

      // Create the MediaRecorder with the selected MIME type
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Received data chunk of size: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        } else {
          console.warn('Received empty data chunk');
        }
      };

      mediaRecorder.onstart = () => {
        console.log('Recording started');
        setIsRecording(true);
        
        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped');
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setIsRecording(false);
        
        // Check if we collected any audio chunks
        if (audioChunksRef.current.length === 0) {
          setError('No audio recorded. Please try again.');
          return;
        }
        
        try {
          // Create audio blob from chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          
          if (audioBlob.size === 0) {
            setError('Recording failed: empty audio file. Please try again.');
            return;
          }
          
          console.log(`Audio blob created, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
          
          // Create a URL for the blob
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // Save the recording if needed
          if (onRecordingComplete) {
            await handleSaveRecording(audioBlob, url);
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          setError('Error processing recording. Please try again.');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred. Please try again.');
        cleanupRecording();
      };

      // Start recording, collect data every second
      mediaRecorder.start(1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      let errorMessage = 'Failed to start recording.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
        } else if (error.name === 'NotFoundError' || error.message.includes('device')) {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else {
          errorMessage = `Recording error: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      cleanupRecording();
    }
  };

  const handleStopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        
        // Stop all tracks in the stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        setError('Error stopping recording. Please try again.');
        cleanupRecording();
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveRecording = async (audioBlob?: Blob, blobUrl?: string) => {
    try {
      setIsUploading(true);
      
      // Use provided blob or get it from the URL
      const blob = audioBlob || (audioUrl ? await fetch(audioUrl).then(r => r.blob()) : null);
      
      if (!blob) {
        throw new Error('No audio data available');
      }
      
      // Create a unique filename
      const timestamp = new Date().getTime();
      const filename = `${candidateId}_${questionId}_${timestamp}.webm`;
      
      // Convert blob to file
      const file = blobToFile(blob, filename);
      
      // Upload to Supabase
      const { data, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw new Error(`Supabase upload error: ${uploadError.message}`);
      }
      
      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(filename);
      
      console.log('Recording saved to Supabase:', publicUrl);
      
      // Store in local storage as fallback
      const audioBase64 = await blobToBase64(blob);
      try {
        localStorage.setItem(`recording_${candidateId}_${questionId}`, audioBase64);
      } catch (localStorageError) {
        console.warn('Failed to save to localStorage (may be too large):', localStorageError);
      }
      
      setRecordingSaved(true);
      
      // Call the callback if provided
      if (onRecordingComplete) {
        onRecordingComplete({
          audioUrl: publicUrl,
          transcript: null, // No transcript yet
          candidateId,
          questionId
        });
      }
      
    } catch (error) {
      console.error('Error saving recording:', error);
      setError('Failed to save recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReRecord = () => {
    cleanupRecording();
    setAudioUrl(null);
    setError(null);
    setRecordingSaved(false);
  };

  const handleAudioError = () => {
    setError('Error playing audio. Please try re-recording.');
    URL.revokeObjectURL(audioUrl || '');
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 relative" role="alert">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {audioUrl ? (
        <div className="space-y-2">
          <audio 
            src={audioUrl} 
            controls 
            className="w-full" 
            onError={handleAudioError}
          />
          
          <div className="flex space-x-2">
            <button 
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200 disabled:opacity-50"
              onClick={handleReRecord}
              disabled={isUploading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-record
            </button>
            
            {!recordingSaved && (
              <button 
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                onClick={() => handleSaveRecording()} 
                disabled={isUploading}
              >
                {isUploading ? 'Saving...' : 'Save Recording'}
              </button>
            )}
            
            {recordingSaved && (
              <button 
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 border border-gray-300 disabled:opacity-50"
                disabled
              >
                Recording Saved
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {isRecording ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-xl font-bold text-red-500">
                Recording in progress {formatTime(recordingTime)}
              </div>
              
              <button 
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                onClick={handleStopRecording}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </button>
            </div>
          ) : (
            <button 
              className="flex items-center justify-center w-full py-6 text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              onClick={handleStartRecording} 
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </button>
          )}
        </div>
      )}
    </div>
  );
}