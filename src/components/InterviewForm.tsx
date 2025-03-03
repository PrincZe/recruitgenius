'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Save, Rocket, Check, Volume2 } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import InterviewSessionRecovery from './InterviewSessionRecovery';

interface Question {
  id: string;
  text: string;
}

const questions: Question[] = [
  { id: '1', text: 'Tell me about yourself and your background.' },
  { id: '2', text: 'What are your strengths and weaknesses?' },
  { id: '3', text: 'Why are you interested in this position?' },
  { id: '4', text: 'Describe a challenging situation you faced and how you handled it.' },
  { id: '5', text: 'Where do you see yourself in 5 years?' },
];

export default function InterviewForm() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [candidateId, setCandidateId] = useState('');
  const [completedQuestions, setCompletedQuestions] = useState<Record<string, boolean>>({});
  const [sessionRecovered, setSessionRecovered] = useState(false);
  const [submittedRecordings, setSubmittedRecordings] = useState<Record<string, boolean>>({});
  const [recordingsData, setRecordingsData] = useState<any[]>([]);
  const [currentRecording, setCurrentRecording] = useState<any>(null);

  // Generate a random candidate ID on component mount if one doesn't already exist
  useEffect(() => {
    const existingCandidateId = localStorage.getItem('candidateId');
    if (existingCandidateId) {
      setCandidateId(existingCandidateId);
      console.log('Using existing candidate ID:', existingCandidateId);
    } else {
      const newCandidateId = `candidate_${Math.floor(Math.random() * 1000000)}`;
      localStorage.setItem('candidateId', newCandidateId);
      setCandidateId(newCandidateId);
      console.log('Generated new candidate ID:', newCandidateId);
    }

    // Load existing recordings and mark questions as completed
    loadRecordings();
  }, []);

  // Load recordings from localStorage
  const loadRecordings = () => {
    try {
      const recordingsJson = localStorage.getItem('recordings');
      if (recordingsJson) {
        const parsedRecordings = JSON.parse(recordingsJson);
        setRecordingsData(parsedRecordings);
        
        // Mark questions as completed if they have recordings
        const completed: Record<string, boolean> = {};
        const submitted: Record<string, boolean> = {};
        
        const candidateRecordings = parsedRecordings.filter(
          (r: any) => r.candidateId === candidateId || r.candidateId === localStorage.getItem('candidateId')
        );
        
        candidateRecordings.forEach((recording: any) => {
          completed[recording.questionId] = true;
          submitted[recording.questionId] = true;
        });
        
        setCompletedQuestions(completed);
        setSubmittedRecordings(submitted);
        console.log('Loaded recordings and set completed questions:', completed);
        
        // Set the current recording for the current question
        updateCurrentRecording();
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  // Update the current recording when question index changes
  const updateCurrentRecording = () => {
    if (!recordingsData.length) {
      setCurrentRecording(null);
      return;
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
      setCurrentRecording(null);
      return;
    }
    
    // Use the current candidateId or the one from localStorage if not yet set
    const currentCandidateId = candidateId || localStorage.getItem('candidateId');
    
    const recording = recordingsData.find(
      r => r.candidateId === currentCandidateId && r.questionId === currentQuestion.id
    );
    
    console.log(`Updating current recording for question ${currentQuestion.id}:`, recording ? 'Found' : 'Not found');
    setCurrentRecording(recording);
  };

  // Update current recording when question or recordings change
  useEffect(() => {
    updateCurrentRecording();
  }, [currentQuestionIndex, recordingsData, candidateId]);

  // Handle session recovery
  const handleSessionRecovery = (recoveredData: any) => {
    console.log('Recovering session with data:', recoveredData);
    
    if (recoveredData.candidateId) {
      setCandidateId(recoveredData.candidateId);
      localStorage.setItem('candidateId', recoveredData.candidateId);
    }
    
    // Reload recordings after recovery
    loadRecordings();
    setSessionRecovered(true);
  };

  // Handle recording completion
  const handleRecordingComplete = (data: any) => {
    console.log('Recording completed for question:', data.questionId);
    
    // Mark this question as completed
    setCompletedQuestions(prev => ({
      ...prev,
      [data.questionId]: true
    }));
    
    // Mark this question as having a submitted recording
    setSubmittedRecordings(prev => ({
      ...prev,
      [data.questionId]: true
    }));
    
    // Reload recordings to update the state
    loadRecordings();
  };

  // Navigation handlers
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

  // Current question
  const currentQuestion = questions[currentQuestionIndex];

  // Check if all questions are completed
  const allQuestionsCompleted = questions.every(q => completedQuestions[q.id]);

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 500 : -500,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {!sessionRecovered && (
        <InterviewSessionRecovery onSessionRecovered={handleSessionRecovery} />
      )}
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Practice Interview</h2>
          <div className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</div>
        </div>
        
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <AnimatePresence initial={false} mode="wait" custom={currentQuestionIndex}>
          <motion.div
            key={currentQuestion.id}
            custom={currentQuestionIndex}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="p-4"
          >
            <h3 className="text-xl font-semibold mb-4">
              {currentQuestionIndex + 1}. {currentQuestion.text}
            </h3>
            
            <div className="mt-6">
              <VoiceRecorder 
                key={`recorder-${currentQuestion.id}`}
                questionId={currentQuestion.id} 
                candidateId={candidateId}
                onRecordingComplete={handleRecordingComplete}
              />
            </div>
            
            {currentRecording && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <Volume2 className="w-4 h-4 mr-1 text-gray-500" />
                  Your Submitted Recording
                </h4>
                <audio 
                  key={`audio-${currentQuestion.id}`}
                  controls 
                  className="w-full mb-4" 
                  src={currentRecording.audioUrl}
                />
                {currentRecording.transcript && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-600">{currentRecording.transcript}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="flex justify-between items-center">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 flex items-center text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Previous
        </button>
        
        <div className="flex space-x-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index === currentQuestionIndex
                  ? 'bg-blue-500 text-white'
                  : completedQuestions[q.id]
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {completedQuestions[q.id] ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </button>
          ))}
        </div>
        
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={goToNextQuestion}
            className="px-4 py-2 flex items-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Next Question
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        ) : (
          <button
            disabled={!allQuestionsCompleted}
            className={`px-4 py-2 flex items-center rounded-lg ${
              allQuestionsCompleted
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Rocket className="w-5 h-5 mr-2" />
            Submit Interview
          </button>
        )}
      </div>
    </div>
  );
} 