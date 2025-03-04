"use client";

import {
  createClient,
  LiveClient,
  SOCKET_STATES,
  LiveTranscriptionEvents,
  type LiveSchema,
  type LiveTranscriptionEvent,
} from "@deepgram/sdk";

import { createContext, useContext, useState, ReactNode, FunctionComponent, useRef, useEffect } from "react";

interface DeepgramContextType {
  connectToDeepgram: () => Promise<void>;
  disconnectFromDeepgram: () => void;
  connectionState: SOCKET_STATES;
  realtimeTranscript: string;
  error: string | null;
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(undefined);

interface DeepgramContextProviderProps {
  children: ReactNode;
}

const getApiKey = async (): Promise<string> => {
  try {
    const response = await fetch("/api/deepgram", { cache: "no-store" });
    const result = await response.json();
    return result.key;
  } catch (error) {
    console.error("Error fetching Deepgram API key:", error);
    throw new Error("Failed to get Deepgram API key");
  }
};

const DeepgramContextProvider: FunctionComponent<DeepgramContextProviderProps> = ({ children }) => {
  const [connection, setConnection] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<SOCKET_STATES>(SOCKET_STATES.closed);
  const [realtimeTranscript, setRealtimeTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<MediaRecorder | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      disconnectFromDeepgram();
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  const connectToDeepgram = async () => {
    try {
      // Clean up any existing connections first
      disconnectFromDeepgram();
      
      // Clear any existing timeouts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      setError(null);
      setRealtimeTranscript("");
      
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log("Creating audio recorder...");
      const options = { mimeType: 'audio/webm;codecs=opus' };
      let recorder;
      
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.log('MediaRecorder with specified options not supported, trying default');
        recorder = new MediaRecorder(stream);
      }
      
      audioRef.current = recorder;

      console.log("Fetching Deepgram API key...");
      const apiKey = await getApiKey();
      
      if (!apiKey) {
        throw new Error("Failed to get Deepgram API key. Please check your environment variables.");
      }

      console.log("Opening WebSocket connection...");
      const socket = new WebSocket("wss://api.deepgram.com/v1/listen", ["token", apiKey]);
      
      // Set a timeout to close connection if it doesn't establish quickly
      connectionTimeoutRef.current = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.error("Connection timed out");
          setError("Connection to Deepgram timed out. Please try again.");
          disconnectFromDeepgram();
        }
      }, 10000);

      socket.onopen = () => {
        try {
          // Clear the timeout
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          
          setConnectionState(SOCKET_STATES.open);
          console.log("WebSocket connection opened successfully");
          
          if (audioRef.current) {
            audioRef.current.addEventListener("dataavailable", (event) => {
              if (event.data && event.data.size > 0 && socket && socket.readyState === WebSocket.OPEN) {
                try {
                  socket.send(event.data);
                } catch (error) {
                  console.error("Error sending audio data:", error);
                }
              }
            });

            try {
              audioRef.current.start(1000); // Collect data every 1 second for stability
              console.log("Audio recording started");
            } catch (error) {
              console.error("Error starting audio recording:", error);
              setError("Failed to start audio recording");
            }
          }
        } catch (error) {
          console.error("Error in WebSocket onopen handler:", error);
          setError("Error setting up connection");
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.channel && data.channel.alternatives && data.channel.alternatives[0]) {
            const newTranscript = data.channel.alternatives[0].transcript;
            if (newTranscript) {
              setRealtimeTranscript((prev) => prev + " " + newTranscript);
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      socket.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("Error connecting to Deepgram. Please try again.");
        disconnectFromDeepgram();
      };

      socket.onclose = (event) => {
        setConnectionState(SOCKET_STATES.closed);
        console.log("WebSocket connection closed:", event.code, event.reason);
      };

      setConnection(socket);
    } catch (error) {
      console.error("Error starting voice recognition:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setConnectionState(SOCKET_STATES.closed);
      
      // Make sure to clean up any partial setup
      try {
        if (audioRef.current && audioRef.current.stream) {
          audioRef.current.stream.getTracks().forEach(track => track.stop());
        }
      } catch (cleanupError) {
        console.error("Error during cleanup after connection failure:", cleanupError);
      }
    }
  };

  const disconnectFromDeepgram = () => {
    try {
      console.log("Disconnecting from Deepgram...");
      
      // Clear connection timeout if it exists
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Close WebSocket connection
      if (connection) {
        try {
          if (connection.readyState === WebSocket.OPEN || connection.readyState === WebSocket.CONNECTING) {
            connection.close(1000, "Disconnected by user");
          }
        } catch (wsError) {
          console.error("Error closing WebSocket connection:", wsError);
        }
        setConnection(null);
      }
      
      // Stop MediaRecorder and release media tracks
      if (audioRef.current) {
        try {
          if (audioRef.current.state !== 'inactive') {
            audioRef.current.stop();
          }
        } catch (recorderError) {
          console.error("Error stopping MediaRecorder:", recorderError);
        }
        
        // Clean up media tracks
        try {
          if (audioRef.current.stream) {
            audioRef.current.stream.getTracks().forEach(track => {
              try {
                track.stop();
              } catch (trackError) {
                console.error("Error stopping media track:", trackError);
              }
            });
          }
        } catch (streamError) {
          console.error("Error accessing MediaRecorder stream:", streamError);
        }
        
        audioRef.current = null;
      }
      
      // Reset state
      setRealtimeTranscript("");
      setConnectionState(SOCKET_STATES.closed);
      console.log("Disconnected from Deepgram");
    } catch (error) {
      console.error("Error in disconnectFromDeepgram:", error);
      // Still reset state even if errors occur
      setConnectionState(SOCKET_STATES.closed);
      setConnection(null);
    }
  };

  return (
    <DeepgramContext.Provider
      value={{
        connectToDeepgram,
        disconnectFromDeepgram,
        connectionState,
        realtimeTranscript,
        error,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

// Use the useDeepgram hook to access the deepgram context and use the deepgram in any component.
// This allows you to connect to the deepgram and disconnect from the deepgram via a socket.
// Make sure to wrap your application in a DeepgramContextProvider to use the deepgram.
function useDeepgram(): DeepgramContextType {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error("useDeepgram must be used within a DeepgramContextProvider");
  }
  return context;
}

export {
  DeepgramContextProvider,
  useDeepgram,
  SOCKET_STATES,
  LiveTranscriptionEvents,
  type LiveTranscriptionEvent,
};
