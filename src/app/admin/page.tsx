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
import { supabase } from '@/lib/supabase/supabaseClient';

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
    
    // Set up an interval to refresh data every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing data...');
      fetchData();
    }, 30000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data from Supabase...');
      
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
      
      // Get recordings from Supabase - with retry logic
      let fetchedRecordings: Recording[] = [];
      let retryCount = 0;
      
      while (retryCount < 3) {
        try {
          console.log(`Attempt ${retryCount + 1} to fetch recordings from Supabase`);
          fetchedRecordings = await getRecordings();
          console.log(`Found ${fetchedRecordings.length} recordings in Supabase`);
          
          if (fetchedRecordings.length > 0) {
            break; // We got recordings, no need to retry
          }
          
          // Wait before retrying
          if (retryCount < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          retryCount++;
        } catch (error) {
          console.error(`Error fetching recordings (attempt ${retryCount + 1}):`, error);
          retryCount++;
          if (retryCount < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      setRecordings(fetchedRecordings);
      
      // Fallback to check localStorage only if we didn't get ANY recordings from Supabase
      if (fetchedRecordings.length === 0) {
        const recordingsData = localStorage.getItem('recordings');
        if (recordingsData) {
          try {
            const localRecordings = JSON.parse(recordingsData);
            console.log('No Supabase recordings found. Using recordings from localStorage as fallback:', localRecordings.length);
            
            // Try to migrate these recordings to Supabase
            if (localRecordings.length > 0) {
              console.log('Attempting to migrate localStorage recordings to Supabase...');
              for (const recording of localRecordings) {
                try {
                  // Format the recording for Supabase
                  const recordingData = {
                    id: recording.id || `recording_${Date.now()}${Math.floor(Math.random() * 1000)}`,
                    candidate_id: recording.candidateId,
                    question_id: recording.questionId,
                    transcript: recording.transcript || null,
                    audio_url: recording.audioUrl,
                    created_at: recording.createdAt || new Date().toISOString(),
                    notes: recording.notes || null
                  };
                  
                  // Check if this recording already exists in Supabase
                  const { data: existingRecordings, error: checkError } = await supabase
                    .from('recordings')
                    .select('id')
                    .eq('candidate_id', recording.candidateId)
                    .eq('question_id', recording.questionId);
                  
                  if (checkError) {
                    console.error('Error checking for existing recordings:', checkError);
                    continue;
                  }
                  
                  if (existingRecordings && existingRecordings.length > 0) {
                    console.log(`Recording for candidate ${recording.candidateId} and question ${recording.questionId} already exists in Supabase`);
                    continue;
                  }
                  
                  // Insert the recording into Supabase
                  const { error: insertError } = await supabase
                    .from('recordings')
                    .insert([recordingData]);
                  
                  if (insertError) {
                    console.error('Error migrating recording to Supabase:', insertError);
                  } else {
                    console.log(`Successfully migrated recording for candidate ${recording.candidateId} and question ${recording.questionId} to Supabase`);
                  }
                } catch (migrationError) {
                  console.error('Error during recording migration:', migrationError);
                }
              }
              
              // Try to fetch recordings again after migration
              try {
                const migratedRecordings = await getRecordings();
                if (migratedRecordings.length > 0) {
                  console.log(`Successfully fetched ${migratedRecordings.length} recordings after migration`);
                  setRecordings(migratedRecordings);
                  return;
                }
              } catch (error) {
                console.error('Error fetching recordings after migration:', error);
              }
            }
            
            setRecordings(localRecordings);
          } catch (parseError) {
            console.error('Error parsing localStorage recordings:', parseError);
          }
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

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchData();
      // Display success message
      const refreshMessage = document.createElement('div');
      refreshMessage.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded';
      refreshMessage.innerHTML = 'Data refreshed successfully!';
      document.body.appendChild(refreshMessage);
      
      // Remove the message after 3 seconds
      setTimeout(() => {
        document.body.removeChild(refreshMessage);
      }, 3000);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDebug = async () => {
    try {
      console.log('Running Supabase connection debug...');
      
      // Check Supabase connection
      const { data: healthCheck, error: healthError } = await supabase.from('recordings').select('count');
      
      if (healthError) {
        console.error('Supabase connection error:', healthError);
        alert(`Supabase connection error: ${healthError.message}`);
        return;
      }
      
      console.log('Supabase connection successful');
      
      // Check for recordings in Supabase
      const { data: recordingsData, error: recordingsError } = await supabase.from('recordings').select('*');
      
      if (recordingsError) {
        console.error('Error fetching recordings:', recordingsError);
        alert(`Error fetching recordings: ${recordingsError.message}`);
        return;
      }
      
      console.log(`Found ${recordingsData?.length || 0} recordings in Supabase`);
      
      // Check localStorage
      const localStorageRecordings = localStorage.getItem('recordings');
      const persistentCandidateId = localStorage.getItem('persistentCandidateId');
      
      console.log('Persistent candidate ID:', persistentCandidateId);
      console.log('localStorage recordings:', localStorageRecordings ? JSON.parse(localStorageRecordings).length : 0);
      
      // Display debug info
      alert(`
Debug Info:
- Supabase connection: OK
- Recordings in Supabase: ${recordingsData?.length || 0}
- Persistent candidate ID: ${persistentCandidateId || 'Not found'}
- Recordings in localStorage: ${localStorageRecordings ? JSON.parse(localStorageRecordings).length : 0}
      `);
      
    } catch (error) {
      console.error('Debug error:', error);
      alert(`Debug error: ${error instanceof Error ? error.message : String(error)}`);
    }
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
        <div className="flex space-x-2">
          <button 
            onClick={handleDebug}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex items-center"
          >
            Debug
          </button>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Loader2 className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
        </div>
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