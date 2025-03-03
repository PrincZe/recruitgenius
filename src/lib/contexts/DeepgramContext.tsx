"use client";

import {
  createClient,
  LiveClient,
  SOCKET_STATES,
  LiveTranscriptionEvents,
  type LiveSchema,
  type LiveTranscriptionEvent,
} from "@deepgram/sdk";

import { createContext, useContext, useState, ReactNode, FunctionComponent, useRef } from "react";

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

  const connectToDeepgram = async () => {
    try {
      // Clean up any existing connections first
      disconnectFromDeepgram();
      
      setError(null);
      setRealtimeTranscript("");
      
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log("Creating audio recorder...");
      audioRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm' // Use a simpler format
      });

      console.log("Fetching Deepgram API key...");
      const apiKey = await getApiKey();

      console.log("Opening WebSocket connection...");
      const socket = new WebSocket("wss://api.deepgram.com/v1/listen", ["token", apiKey]);

      socket.onopen = () => {
        try {
          setConnectionState(SOCKET_STATES.open);
          console.log("WebSocket connection opened successfully");
          
          if (audioRef.current) {
            audioRef.current.addEventListener("dataavailable", (event) => {
              if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
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
      
      if (connection) {
        if (connection.readyState === WebSocket.OPEN) {
          connection.close(1000, "Disconnected by user");
        }
        setConnection(null);
      }
      
      if (audioRef.current) {
        try {
          if (audioRef.current.state !== 'inactive') {
            audioRef.current.stop();
          }
          
          // Clean up media tracks
          if (audioRef.current.stream) {
            audioRef.current.stream.getTracks().forEach(track => track.stop());
          }
        } catch (error) {
          console.error("Error stopping audio recording:", error);
        }
        audioRef.current = null;
      }
      
      // Reset the transcript when disconnecting
      setRealtimeTranscript("");
      
      setConnectionState(SOCKET_STATES.closed);
      console.log("Disconnected from Deepgram");
    } catch (error) {
      console.error("Error disconnecting from Deepgram:", error);
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
