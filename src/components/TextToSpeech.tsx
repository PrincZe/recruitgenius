'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Volume2 } from 'lucide-react';

interface TextToSpeechProps {
  text: string;
  autoPlay?: boolean;
  onPlaybackStarted?: () => void;
  onPlaybackEnded?: () => void;
  voice?: string;
}

export default function TextToSpeech({ 
  text, 
  autoPlay = false, 
  onPlaybackStarted, 
  onPlaybackEnded,
  voice = 'alloy'
}: TextToSpeechProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioDataRef = useRef<string | null>(null);
  const textRef = useRef<string>(text);
  const isPlayingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Define playAudio function for the OpenAI TTS implementation
  const playAudio = useCallback(() => {
    if (!audioDataRef.current) return;
    
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio(`data:audio/mp3;base64,${audioDataRef.current}`);
      
      audioRef.current.addEventListener('play', () => {
        setIsPlaying(true);
        isPlayingRef.current = true;
        setIsLoading(false); // Ensure loading is set to false when audio starts playing
        onPlaybackStarted?.();
      });
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        isPlayingRef.current = false;
        onPlaybackEnded?.();
      });
      
      audioRef.current.addEventListener('pause', () => {
        // Only update playing state if it's not due to seeking/buffering
        if (!audioRef.current!.seeking) {
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        isPlayingRef.current = false;
        setIsLoading(false);
        setError('Failed to play audio. Please try again.');
        // Clear the audio data to force a reload next time
        audioDataRef.current = null;
        audioRef.current = null;
      });
      
      // Add timeupdate listener to detect and fix any playback issues
      audioRef.current.addEventListener('timeupdate', () => {
        const audio = audioRef.current;
        if (audio && audio.duration > 0) {
          // If audio unexpectedly starts over while playing (not at the end)
          if (audio.currentTime < 0.5 && isPlayingRef.current && audio.duration > 1) {
            console.log('Detected unexpected audio restart, correcting...');
            // Stop the propagation of timeupdate events temporarily
            audio.removeEventListener('timeupdate', () => {});
            // Resume playback from where it should be
            const targetTime = audio.duration * 0.1; // Jump ahead slightly
            audio.currentTime = targetTime;
            setTimeout(() => {
              // Re-add the timeupdate listener after a short delay
              if (audioRef.current) {
                audioRef.current.addEventListener('timeupdate', () => {});
              }
            }, 500);
          }
        }
      });
    }
    
    // Play the audio
    try {
      // Reset the audio to the beginning to prevent looping issues
      audioRef.current.currentTime = 0;
      
      // Some browsers require user interaction before playing audio
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
          isPlayingRef.current = false;
          setIsLoading(false);
          setError('Failed to play audio. Please try again.');
          // Clear the audio data to force a reload next time
          audioDataRef.current = null;
          audioRef.current = null;
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      isPlayingRef.current = false;
      setIsLoading(false);
      setError('Failed to play audio. Please try again.');
      // Clear the audio data to force a reload next time
      audioDataRef.current = null;
      audioRef.current = null;
    }
  }, [onPlaybackStarted, onPlaybackEnded]);

  // Memoize the convertTextToSpeech function to avoid dependency issues
  const convertTextToSpeech = useCallback(async () => {
    if (!text) return;
    
    // If we already have audio data, just play it
    if (audioDataRef.current) {
      playAudio();
      return;
    }
    
    try {
      setError(null);
      setIsLoading(true);
      
      // Create a new AbortController for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/openai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to convert text to speech: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.audio) {
        throw new Error('No audio data received from API');
      }
      
      audioDataRef.current = data.audio;
      playAudio();
      
      // Set a timeout to reset loading state if it gets stuck
      setTimeout(() => {
        if (isLoading) {
          console.log('Loading state was stuck, resetting');
          setIsLoading(false);
        }
      }, 5000);
      
    } catch (error) {
      // Only log error if it's not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error with OpenAI TTS:', error);
        setIsLoading(false);
        setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [text, voice, playAudio, isLoading]);

  // Reset audio data when text changes
  useEffect(() => {
    if (textRef.current !== text) {
      console.log('Text changed, resetting audio data');
      audioDataRef.current = null;
      if (audioRef.current) {
        // Stop any ongoing playback
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
        audioRef.current = null;
      }
      
      // Reset states
      setError(null);
      setIsPlaying(false);
      isPlayingRef.current = false;
      textRef.current = text;
      
      // Auto-play if enabled
      if (autoPlay) {
        convertTextToSpeech();
      }
    }
  }, [text, autoPlay, convertTextToSpeech]);

  // Initial auto-play
  useEffect(() => {
    if (autoPlay && text && !audioDataRef.current && !isPlaying) {
      convertTextToSpeech();
    }
  }, [autoPlay, text, convertTextToSpeech, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        // Stop any ongoing playback
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
        audioRef.current = null;
      }
      
      // Abort any ongoing fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      audioDataRef.current = null;
      isPlayingRef.current = false;
    };
  }, []);

  const handleClick = () => {
    if (isPlaying) {
      // If already playing, pause it
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      // If not playing, start playing
      setError(null);
      convertTextToSpeech();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="flex items-center justify-center p-2 text-gray-700 bg-white rounded-full shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Volume2 className={`w-5 h-5 ${isPlaying ? 'text-blue-600' : 'text-gray-700'}`} />
        )}
      </button>
      <span className="text-sm text-gray-500">
        {isLoading ? "Loading audio..." : isPlaying ? "Playing" : "Click to play"}
      </span>
      {error && (
        <span className="text-sm text-red-500 ml-2">{error}</span>
      )}
    </div>
  );
} 