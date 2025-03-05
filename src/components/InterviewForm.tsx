'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Save, Rocket, Check, Volume2 } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import InterviewSessionRecovery from './InterviewSessionRecovery';
import TextToSpeech from './TextToSpeech';
import { getRecordingsByCandidate, addCandidate, getQuestions } from '../lib/services/supabaseService';

interface Question {
  id: string;
  text: string;
}

// Sample questions - these will be replaced with data from Supabase in production
const sampleQuestions: Question[] = [
  { id: '1', text: 'Tell me about yourself and your background.' },
  { id: '2', text: 'What are your strengths and weaknesses?' },
  { id: '3', text: 'Why are you interested in this position?' },
  { id: '4', text: 'Describe a challenging situation you faced and how you handled it.' },
  { id: '5', text: 'Where do you see yourself in 5 years?' },
];

export default function InterviewForm() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [candidateId, setCandidateId] = useState<string>('');
  const [completedQuestions, setCompletedQuestions] = useState<Record<string, boolean>>({});
  const [sessionRecovered, setSessionRecovered] = useState(false);
  const [submittedRecordings, setSubmittedRecordings] = useState<Record<string, boolean>>({});
  const [recordingsData, setRecordingsData] = useState<any[]>([]);
  const [currentRecording, setCurrentRecording] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate a random candidate ID on component mount if one doesn't already exist
  useEffect(() => {
    const initializeCandidate = async () => {
      // Use persistentCandidateId instead of candidateId for better persistence across sessions
      const existingCandidateId = localStorage.getItem('persistentCandidateId');
      if (existingCandidateId) {
        setCandidateId(existingCandidateId);
        console.log('Using existing persistent candidate ID:', existingCandidateId);
      } else {
        const newCandidateId = `candidate_${Math.floor(Math.random() * 1000000)}`;
        
        // Create a record in Supabase for this candidate
        await addCandidate({
          name: 'Anonymous Candidate',
          email: `anonymous_${newCandidateId}@example.com`,
        });
        
        localStorage.setItem('persistentCandidateId', newCandidateId);
        setCandidateId(newCandidateId);
        console.log('Generated new persistent candidate ID:', newCandidateId);
      }

      // Load questions from Supabase
      try {
        const fetchedQuestions = await getQuestions();
        if (fetchedQuestions && fetchedQuestions.length > 0) {
          setQuestions(fetchedQuestions);
          console.log('Loaded questions from Supabase:', fetchedQuestions.length);
        } else {
          // Fallback to sample questions
          console.log('Using sample questions as fallback');
        }
      } catch (error) {
        console.error('Error loading questions:', error);
      }

      // Load existing recordings and mark questions as completed
      await loadRecordings();
      setIsLoading(false);
    };

    initializeCandidate();
  }, []);

  // Update current recording
  const updateCurrentRecording = useCallback(() => {
    if (!questions || questions.length === 0 || !recordingsData) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    // Find recording for current question
    const recordingForCurrentQuestion = recordingsData.find(
      (r) => r.questionId === currentQuestion.id
    );
    
    setCurrentRecording(recordingForCurrentQuestion || null);
  }, [currentQuestionIndex, questions, recordingsData]);

  // Load recordings for the current candidate
  const loadRecordings = useCallback(async () => {
    try {
      // Load recordings from Supabase (with localStorage as fallback during migration)
      const currentCandidateId = candidateId || localStorage.getItem('persistentCandidateId');
      console.log('Loading recordings for candidate:', currentCandidateId);
      
      if (!currentCandidateId) {
        console.error('No candidate ID available');
        return;
      }
      
      // Try to get recordings from Supabase
      const candidateRecordings = await getRecordingsByCandidate(currentCandidateId);
      
      // Check localStorage as fallback
      const recordingsJson = localStorage.getItem('recordings');
      let localRecordings: any[] = [];
      if (recordingsJson) {
        localRecordings = JSON.parse(recordingsJson).filter((r: any) => r.candidateId === currentCandidateId);
      }
      
      // If we didn't get any recordings from Supabase, use localStorage
      if (candidateRecordings.length === 0 && localRecordings.length > 0) {
        console.log('Using recordings from localStorage:', localRecordings.length);
        setRecordingsData(localRecordings);
      } else {
        console.log('Using recordings from Supabase:', candidateRecordings.length);
        setRecordingsData(candidateRecordings);
      }
      
      // Calculate completed questions
      const completed: Record<string, boolean> = {};
      
      // Mark questions as completed if they have recordings
      [...candidateRecordings, ...localRecordings].forEach((recording: any) => {
        completed[recording.questionId] = true;
      });
      
      setCompletedQuestions(completed);
      
      // Update the current recording based on the current question
      updateCurrentRecording();
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  }, [candidateId, updateCurrentRecording, getRecordingsByCandidate]);

  // Update current recording when question index or recordings data changes
  useEffect(() => {
    updateCurrentRecording();
  }, [currentQuestionIndex, recordingsData, updateCurrentRecording]);

  // Load recordings initially and when candidateId or questions change
  useEffect(() => {
    loadRecordings();
  }, [candidateId, questions, loadRecordings]);

  const handleSessionRecovery = (recoveredData: any) => {
    if (recoveredData) {
      // Set candidateId from recovered data
      setCandidateId(recoveredData.candidateId);
      
      // If there's a specific starting point, set the current question index
      if (recoveredData.lastQuestionIndex !== undefined) {
        setCurrentQuestionIndex(recoveredData.lastQuestionIndex);
      }
      
      setSessionRecovered(true);
      
      // Trigger a reload of the recordings
      loadRecordings();
    }
  };

  const handleRecordingComplete = (data: any) => {
    // Mark question as completed
    setCompletedQuestions(prev => ({
      ...prev,
      [data.questionId]: true
    }));
    
    // Mark as submitted
    setSubmittedRecordings(prev => ({
      ...prev,
      [data.questionId]: true
    }));
    
    // Add to recordings data
    setRecordingsData(prev => {
      // Check if this recording already exists
      const existingIndex = prev.findIndex(
        r => r.candidateId === data.candidateId && r.questionId === data.questionId
      );
      
      if (existingIndex >= 0) {
        // Update existing recording
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          audioUrl: data.audioUrl,
          transcript: data.transcript
        };
        return updated;
      } else {
        // Add new recording
        return [...prev, data];
      }
    });
    
    // Save current progress to localStorage
    localStorage.setItem('lastQuestionIndex', currentQuestionIndex.toString());
    
    // Automatically go to the next question if not the last one
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        goToNextQuestion();
      }, 1000);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // This fix prevents the audio from restarting mid-playback
  const preventAudioOverlap = () => {
    // Pause all audio elements to prevent overlapping playback
    document.querySelectorAll('audio').forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-600">Loading interview...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {!sessionRecovered && (
        <InterviewSessionRecovery 
          onRecoveryComplete={handleSessionRecovery} 
        />
      )}
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Interview Questions</h1>
          <div className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(currentQuestionIndex + 1) / totalQuestions * 100}%` }}
          ></div>
        </div>
        
        {/* Question navigation */}
        <div className="flex items-center mb-2 space-x-2 overflow-x-auto py-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`flex items-center justify-center rounded-full min-w-8 h-8 px-3 text-sm font-medium transition-colors 
                ${currentQuestionIndex === index 
                  ? 'bg-blue-600 text-white' 
                  : completedQuestions[q.id]
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {completedQuestions[q.id] ? (
                <Check className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-md overflow-hidden mb-8"
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {currentQuestion?.text}
            </h2>
            
            <div className="mb-6" onClick={preventAudioOverlap}>
              <TextToSpeech 
                text={currentQuestion?.text} 
                autoPlay={false}
              />
            </div>
            
            {/* Voice Recorder Component with key to force re-render on question change */}
            <div className="mt-6">
              <VoiceRecorder
                key={`recorder-${currentQuestion?.id}-${candidateId}`}
                questionId={currentQuestion?.id}
                candidateId={candidateId}
                onRecordingComplete={handleRecordingComplete}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      <div className="flex justify-between">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Previous
        </button>
        
        <button
          onClick={goToNextQuestion}
          disabled={currentQuestionIndex === questions.length - 1}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          Next
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
      
      {currentQuestionIndex === questions.length - 1 && (
        <div className="mt-8 p-4 bg-green-50 border border-green-100 rounded-lg">
          <div className="flex items-start">
            <Rocket className="w-6 h-6 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-green-800">Ready to submit your interview?</h3>
              <p className="text-green-700 mb-4">
                You&apos;ve completed all questions. Review your responses before submitting.
              </p>
              <button 
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                onClick={() => alert("Interview submitted successfully!")}
              >
                <Save className="w-5 h-5 mr-2 inline-block" />
                Submit Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 