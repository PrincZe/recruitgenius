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
import { 
  getQuestions, 
  getCandidates, 
  getRecordings, 
  addQuestion, 
  addCandidate 
} from '@/lib/services/supabaseService';

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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('recordings');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize data and fetch from Supabase
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get questions from Supabase
      const fetchedQuestions = await getQuestions();
      if (fetchedQuestions.length === 0) {
        // Seed with demo questions if none exist
        await Promise.all(demoQuestions.map(async (q) => {
          await addQuestion({
            text: q.text,
            category: q.category || 'General'
          });
        }));
        const seededQuestions = await getQuestions();
        setQuestions(seededQuestions);
      } else {
        setQuestions(fetchedQuestions);
      }
      
      // Get candidates from Supabase
      const fetchedCandidates = await getCandidates();
      if (fetchedCandidates.length === 0) {
        // Seed with demo candidates if none exist
        await Promise.all(demoCandidates.map(async (c) => {
          await addCandidate({
            name: c.name,
            email: c.email
          });
        }));
        const seededCandidates = await getCandidates();
        setCandidates(seededCandidates);
      } else {
        setCandidates(fetchedCandidates);
      }
      
      // Get recordings from Supabase
      const fetchedRecordings = await getRecordings();
      setRecordings(fetchedRecordings);
      
      // Fallback to check localStorage during migration
      if (fetchedRecordings.length === 0) {
        const recordingsData = localStorage.getItem('recordings');
        if (recordingsData) {
          const localRecordings = JSON.parse(recordingsData);
          console.log('Using recordings from localStorage as fallback:', localRecordings.length);
          setRecordings(localRecordings);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleRefresh = () => {
    fetchData();
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center"
        >
          <Loader2 className="w-4 h-4 mr-2" />
          Refresh Data
        </button>
      </div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="questions" onClick={() => handleTabChange('questions')}>
            <FileQuestion className="w-4 h-4 mr-2" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="candidates" onClick={() => handleTabChange('candidates')}>
            <User className="w-4 h-4 mr-2" />
            Candidates
          </TabsTrigger>
          <TabsTrigger value="recordings" onClick={() => handleTabChange('recordings')}>
            <Mic className="w-4 h-4 mr-2" />
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