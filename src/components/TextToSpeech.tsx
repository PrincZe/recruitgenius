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
  const webSpeechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isStaticSite = useRef<boolean>(
    typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
  );

  // Function to stop any existing speech synthesis
  const stopWebSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (webSpeechSynthRef.current) {
        webSpeechSynthRef.current = null;
      }
    }
  }, []);

  // Web Speech API implementation - regular function, not a hook
  const speakWithWebSpeechAPI = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Web Speech API not supported in this browser');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Cancel any ongoing speech
      stopWebSpeech();
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      webSpeechSynthRef.current = utterance;
      
      // Set up event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
        onPlaybackStarted?.();
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        webSpeechSynthRef.current = null;
        onPlaybackEnded?.();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        setIsLoading(false);
        webSpeechSynthRef.current = null;
      };
      
      // Set voice (try to use a neutral voice if available)
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Find a neutral or female voice if possible
        const preferredVoice = voices.find(
          v => v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Samantha')
        ) || voices[0];
        utterance.voice = preferredVoice;
      }
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (error) {
      console.error('Error using Web Speech API:', error);
      setIsLoading(false);
      return false;
    }
  }, [text, onPlaybackStarted, onPlaybackEnded, stopWebSpeech]);

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
    
    // For static sites or vercel.app domains, try Web Speech API first
    if (isStaticSite.current) {
      if (speakWithWebSpeechAPI()) {
        return; // Web Speech API worked, we're done
      }
      // If Web Speech API failed, continue to OpenAI TTS as fallback
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
      // If OpenAI TTS fails and we haven't tried Web Speech yet, fall back to it
      if (!isStaticSite.current) {
        speakWithWebSpeechAPI();
      } else {
        setIsLoading(false);
      }
    } finally {
      if (audioDataRef.current) {
        setIsLoading(false);
      }
    }
  }, [text, voice, playAudio, speakWithWebSpeechAPI]);

  // Reset audio data when text changes
  useEffect(() => {
    if (textRef.current !== text) {
      console.log('Text changed, resetting audio data');
      audioDataRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Stop any web speech synthesis
      stopWebSpeech();
      
      textRef.current = text;
      
      // Auto-play if enabled
      if (autoPlay) {
        convertTextToSpeech();
      }
    }
  }, [text, autoPlay, convertTextToSpeech, stopWebSpeech]);

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
      stopWebSpeech();
    };
  }, [stopWebSpeech]);

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