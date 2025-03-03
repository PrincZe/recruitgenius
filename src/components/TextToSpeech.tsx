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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioDataRef = useRef<string | null>(null);
  const textRef = useRef<string>(text);

  // Define playAudio function for the OpenAI TTS implementation
  const playAudio = useCallback(() => {
    if (!audioDataRef.current) return;
    
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio(`data:audio/mp3;base64,${audioDataRef.current}`);
      
      audioRef.current.addEventListener('play', () => {
        setIsPlaying(true);
        onPlaybackStarted?.();
      });
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        onPlaybackEnded?.();
      });
      
      audioRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setIsLoading(false);
        // Clear the audio data to force a reload next time
        audioDataRef.current = null;
        audioRef.current = null;
      });
    }
    
    // Play the audio
    try {
      // Reset the audio to the beginning to prevent looping issues
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
        setIsLoading(false);
        // Clear the audio data to force a reload next time
        audioDataRef.current = null;
        audioRef.current = null;
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setIsLoading(false);
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
      setIsLoading(true);
      const response = await fetch('/api/openai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        throw new Error(`Failed to convert text to speech: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      audioDataRef.current = data.audio;
      
      playAudio();
    } catch (error) {
      console.error('Error with OpenAI TTS:', error);
      setIsLoading(false);
    }
  }, [text, voice, playAudio]);

  // Reset audio data when text changes
  useEffect(() => {
    if (textRef.current !== text) {
      console.log('Text changed, resetting audio data');
      audioDataRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
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
        audioRef.current.pause();
        audioRef.current = null;
      }
      audioDataRef.current = null;
    };
  }, []);

  const handleClick = () => {
    if (isPlaying) {
      // If already playing, pause it
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      // If not playing, start playing
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
    </div>
  );
} 