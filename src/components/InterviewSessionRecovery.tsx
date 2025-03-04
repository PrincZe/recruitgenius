'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface InterviewSessionRecoveryProps {
  onRecoveryComplete: (recoveredData: any) => void;
}

export default function InterviewSessionRecovery({ onRecoveryComplete }: InterviewSessionRecoveryProps) {
  const [recoveryMode, setRecoveryMode] = useState<'none' | 'found' | 'recovered'>('none');
  const [sessionData, setSessionData] = useState<any>(null);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [existingCandidateId, setExistingCandidateId] = useState<string | null>(null);
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);

  const checkForExistingSession = () => {
    // Check for existing candidateId in localStorage
    const candidateId = localStorage.getItem('candidateId');
    
    if (candidateId) {
      // Check if we have any recordings for this candidate
      const recordingsData = localStorage.getItem('recordings');
      
      if (recordingsData) {
        try {
          const recordings = JSON.parse(recordingsData);
          const candidateRecordings = recordings.filter(
            (r: any) => r.candidateId === candidateId
          );
          
          if (candidateRecordings.length > 0) {
            // We found existing recordings for this candidate
            setRecoveryMode('found');
            setSessionData({
              candidateId,
              recordings: candidateRecordings
            });
            setHasExistingSession(true);
            setExistingCandidateId(candidateId);
            
            // Find the most recent recording
            const mostRecentTimestamp = candidateRecordings.reduce((latest: string, recording: any) => {
              if (!latest) return recording.createdAt;
              return new Date(recording.createdAt) > new Date(latest) ? recording.createdAt : latest;
            }, null);
            
            if (mostRecentTimestamp) {
              // Format the date to a readable string
              const date = new Date(mostRecentTimestamp);
              setLastSessionDate(date.toLocaleString());
            }
            
            // Show the recovery prompt
            setShowRecoveryPrompt(true);
            return;
          }
        } catch (error) {
          console.error('Error parsing recordings:', error);
        }
      }
    }
    
    setRecoveryMode('none');
  };

  useEffect(() => {
    checkForExistingSession();
  }, []);

  const handleRecoverSession = () => {
    // Get the last question index
    const lastQuestionIndex = localStorage.getItem('lastQuestionIndex');
    
    // Recover the session by passing the existing candidateId
    onRecoveryComplete({
      candidateId: existingCandidateId,
      lastQuestionIndex: lastQuestionIndex ? parseInt(lastQuestionIndex) : 0
    });
    setShowRecoveryPrompt(false);
  };

  const handleStartNew = () => {
    // Clear existing data
    localStorage.removeItem('candidateId');
    localStorage.removeItem('recordings');
    localStorage.removeItem('lastQuestionIndex');
    
    // Generate a new candidate ID
    const newCandidateId = `candidate_${Math.floor(Math.random() * 1000000)}`;
    localStorage.setItem('candidateId', newCandidateId);
    
    // Start a new session
    onRecoveryComplete({
      candidateId: newCandidateId,
    });
    
    setShowRecoveryPrompt(false);
  };

  if (!showRecoveryPrompt) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">Interview Session Recovery</h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              We found an existing interview session from{" "}
              {lastSessionDate ? <span className="font-medium">{lastSessionDate}</span> : "a previous session"}.
              Would you like to continue where you left off or start a new interview?
            </p>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleRecoverSession}
              className="inline-flex items-center px-3 py-1.5 border border-amber-600 text-xs font-medium rounded-md text-amber-800 bg-amber-100 hover:bg-amber-200"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Continue Previous Session
            </button>
            <button
              onClick={handleStartNew}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Start New Interview
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 