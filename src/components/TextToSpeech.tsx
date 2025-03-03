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

  // Define playAudio function first so it can be used in the useCallback
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
        throw new Error('Failed to convert text to speech');
      }

      const data = await response.json();
      audioDataRef.current = data.audio;
      
      playAudio();
    } catch (error) {
      console.error('Error converting text to speech:', error);
    } finally {
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
    if (autoPlay && text && !audioDataRef.current) {
      convertTextToSpeech();
    }
  }, [autoPlay, text, convertTextToSpeech]);

  return (
    <button
      onClick={convertTextToSpeech}
      disabled={isLoading || isPlaying}
      className={`flex items-center justify-center px-4 py-2 rounded-md text-white ${
        isPlaying 
          ? 'bg-green-500 hover:bg-green-600' 
          : 'bg-blue-500 hover:bg-blue-600'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Volume2 className="w-5 h-5 mr-2" />
          {isPlaying ? 'Playing...' : 'Play Question'}
        </>
      )}
    </button>
  );
} 