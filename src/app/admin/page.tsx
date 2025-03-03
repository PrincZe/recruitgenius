'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Question, Candidate, Recording } from '@/lib/models/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Loader2, ChevronRight, User, FileQuestion, Mic, Plus } from 'lucide-react';
import { CandidatesTab } from '@/components/admin/CandidatesTab';
import { QuestionsTab } from '@/components/admin/QuestionsTab';
import { RecordingsTab } from '@/components/admin/RecordingsTab';
import { v4 as uuidv4 } from 'uuid';

// Demo data for initialization
const demoQuestions = [
  {
    id: "q1",
    text: "Tell me about your background and experience.",
    category: "Background",
    createdAt: new Date().toISOString()
  },
  {
    id: "q2",
    text: "What are your strengths and weaknesses?",
    category: "Personal",
    createdAt: new Date().toISOString()
  },
  {
    id: "q3",
    text: "Describe a challenging situation you faced at work and how you handled it.",
    category: "Experience",
    createdAt: new Date().toISOString()
  }
];

const demoCandidates = [
  {
    id: "c1",
    name: "John Smith",
    email: "john.smith@example.com",
    createdAt: new Date().toISOString()
  }
];

const demoRecordings = [
  {
    id: "r1",
    candidateId: "c1",
    questionId: "q1",
    audioUrl: "data:audio/webm;base64,PLACEHOLDER",
    transcript: "I have over 5 years of experience in software development, with a focus on web technologies and cloud infrastructure. I've worked on projects ranging from small business websites to large enterprise applications.",
    notes: "Good communication skills, relevant experience.",
    createdAt: new Date().toISOString()
  },
  {
    id: "r2",
    candidateId: "c1",
    questionId: "q2",
    audioUrl: "data:audio/webm;base64,PLACEHOLDER",
    transcript: "My strengths include problem-solving, attention to detail, and teamwork. My weakness is that I sometimes focus too much on details, but I'm working on improving my big-picture thinking.",
    notes: "Honest about weaknesses, shows self-awareness.",
    createdAt: new Date().toISOString()
  }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('questions');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize localStorage with demo data if needed
  useEffect(() => {
    // Check if questions exist in localStorage
    const questionsData = localStorage.getItem('questions');
    if (!questionsData || JSON.parse(questionsData).length === 0) {
      // If no questions exist, add demo questions
      localStorage.setItem('questions', JSON.stringify(demoQuestions));
      console.log('Added demo questions to localStorage');
    }

    // Check if candidates exist in localStorage
    const candidatesData = localStorage.getItem('candidates');
    if (!candidatesData || JSON.parse(candidatesData).length === 0) {
      // If no candidates exist, add demo candidates
      localStorage.setItem('candidates', JSON.stringify(demoCandidates));
      console.log('Added demo candidates to localStorage');
    }

    // Check if recordings exist in localStorage
    const recordingsData = localStorage.getItem('recordings');
    if (!recordingsData || JSON.parse(recordingsData).length === 0) {
      // If no recordings exist, add demo recordings
      localStorage.setItem('recordings', JSON.stringify(demoRecordings));
      console.log('Added demo recordings to localStorage');
    }

    // Fetch data after initialization
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get questions from localStorage
      const questionsData = localStorage.getItem('questions');
      if (questionsData) {
        setQuestions(JSON.parse(questionsData));
      }
      
      // Get candidates from localStorage
      const candidatesData = localStorage.getItem('candidates');
      if (candidatesData) {
        setCandidates(JSON.parse(candidatesData));
      }
      
      // Get recordings from localStorage
      const recordingsData = localStorage.getItem('recordings');
      if (recordingsData) {
        setRecordings(JSON.parse(recordingsData));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="questions" onClick={() => handleTabChange('questions')}>
            Questions
          </TabsTrigger>
          <TabsTrigger value="candidates" onClick={() => handleTabChange('candidates')}>
            Candidates
          </TabsTrigger>
          <TabsTrigger value="recordings" onClick={() => handleTabChange('recordings')}>
            Recordings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions">
          <QuestionsTab 
            questions={questions} 
            setQuestions={setQuestions} 
          />
        </TabsContent>
        
        <TabsContent value="candidates">
          <CandidatesTab candidates={candidates} />
        </TabsContent>
        
        <TabsContent value="recordings">
          <RecordingsTab 
            recordings={recordings} 
            questions={questions}
            candidates={candidates}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 