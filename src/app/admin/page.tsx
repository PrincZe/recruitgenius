'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Question, Candidate, Recording } from '@/lib/models/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Loader2, ChevronRight, User, FileQuestion, Mic, Plus } from 'lucide-react';
import { CandidatesTab } from '@/components/admin/CandidatesTab';
import { QuestionsTab } from '@/components/admin/QuestionsTab';
import { RecordingsTab } from '@/components/admin/RecordingsTab';
import { v4 as uuidv4 } from 'uuid';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('candidates');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Wrap demoQuestions in useMemo to prevent it from changing on every render
  const demoQuestions = useMemo(() => [
    {
      id: uuidv4(),
      text: "Tell me about yourself and your background.",
      category: "Introduction",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      text: "What are your greatest strengths and how do they help you in your work?",
      category: "Self-Assessment",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      text: "Describe a challenging project you worked on and how you overcame obstacles.",
      category: "Experience",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      text: "Why are you interested in this position and what can you contribute to our team?",
      category: "Motivation",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      text: "Where do you see yourself professionally in five years?",
      category: "Career Goals",
      createdAt: new Date().toISOString(),
    },
  ], []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Load candidates from localStorage
        const storedCandidates = localStorage.getItem('candidates');
        if (storedCandidates) {
          setCandidates(JSON.parse(storedCandidates));
        } else {
          // Initialize with empty array if not found
          localStorage.setItem('candidates', JSON.stringify([]));
        }

        // Load questions from localStorage
        const storedQuestions = localStorage.getItem('questions');
        if (storedQuestions) {
          setQuestions(JSON.parse(storedQuestions));
        } else {
          // Initialize with demo questions if not found
          localStorage.setItem('questions', JSON.stringify(demoQuestions));
          setQuestions(demoQuestions);
        }

        // Load recordings from localStorage
        const storedRecordings = localStorage.getItem('recordings');
        if (storedRecordings) {
          setRecordings(JSON.parse(storedRecordings));
        } else {
          // Initialize with empty array if not found
          localStorage.setItem('recordings', JSON.stringify([]));
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        setError('An error occurred while loading the dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [demoQuestions]);

  // Simple UI components for the tabs
  const TabsComponent = () => {
    // Use a useEffect to update the activeTab state when the tab changes
    const handleTabChange = (value: string) => {
      setActiveTab(value);
    };

    // Create a custom TabsTrigger that updates our state
    const CustomTabsTrigger = ({ value, children, className = '' }: { value: string, children: React.ReactNode, className?: string }) => (
      <TabsTrigger 
        value={value} 
        className={className}
        onClick={() => handleTabChange(value)}
      >
        {children}
      </TabsTrigger>
    );

    return (
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="mb-8 flex border-b border-gray-200">
          <CustomTabsTrigger value="recordings" className="px-4 py-2 text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600">
            <Mic className="w-4 h-4 mr-2" />
            Recordings
          </CustomTabsTrigger>
          <CustomTabsTrigger value="questions" className="px-4 py-2 text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600">
            <FileQuestion className="w-4 h-4 mr-2" />
            Questions
          </CustomTabsTrigger>
          <CustomTabsTrigger value="candidates" className="px-4 py-2 text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600">
            <User className="w-4 h-4 mr-2" />
            Candidates
          </CustomTabsTrigger>
        </TabsList>
        
        <TabsContent value="recordings">
          <RecordingsTab recordings={recordings} questions={questions} candidates={candidates} />
        </TabsContent>
        
        <TabsContent value="questions">
          <QuestionsTab 
            questions={questions} 
            setQuestions={(newQuestions) => {
              setQuestions(newQuestions);
              localStorage.setItem('questions', JSON.stringify(newQuestions));
            }} 
          />
        </TabsContent>
        
        <TabsContent value="candidates">
          <CandidatesTab candidates={candidates} />
        </TabsContent>
      </Tabs>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
          <p className="mt-4 text-lg font-medium text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link
            href="/admin/questions/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Question
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <TabsComponent />
          </div>
        </div>
      </div>
    </div>
  );
} 