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
      
      // Get recordings directly from Supabase database
      console.log('Attempting direct query to Supabase recordings table...');
      
      let fetchedRecordings: Recording[] = [];
      
      try {
        // Direct database query, bypassing the service layer for debugging
        const { data, error } = await supabase
          .from('recordings')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error in direct Supabase query:', error);
        } else {
          console.log(`Direct query found ${data?.length || 0} recordings`);
          
          if (data && data.length > 0) {
            // Map database columns to model properties
            fetchedRecordings = data.map(item => ({
              id: item.id,
              candidateId: item.candidate_id,
              questionId: item.question_id,
              transcript: item.transcript || '',
              audioUrl: item.audio_url,
              notes: item.notes || '',
              createdAt: item.created_at
            }));
          }
        }
      } catch (directQueryError) {
        console.error('Error during direct query:', directQueryError);
      }
      
      // If direct query didn't work, try the service
      if (fetchedRecordings.length === 0) {
        console.log('Direct query failed or returned no results, trying service function...');
        try {
          const serviceRecordings = await getRecordings();
          if (serviceRecordings.length > 0) {
            console.log(`Service found ${serviceRecordings.length} recordings`);
            fetchedRecordings = serviceRecordings;
          }
        } catch (serviceError) {
          console.error('Error using service to get recordings:', serviceError);
        }
      }
      
      // If we found recordings, use them
      if (fetchedRecordings.length > 0) {
        setRecordings(fetchedRecordings);
        console.log('Successfully set recordings from Supabase');
      } else {
        console.log('No recordings found in Supabase, checking localStorage as last resort');
        
        // Last resort: check localStorage
        const recordingsJson = localStorage.getItem('recordings');
        if (recordingsJson) {
          try {
            const localRecordings = JSON.parse(recordingsJson);
            console.log(`Found ${localRecordings.length} recordings in localStorage`);
            
            // Try to migrate these to Supabase
            console.log('Attempting to migrate localStorage recordings to Supabase...');
            
            for (const recording of localRecordings) {
              try {
                // Skip if no audioUrl (invalid recording)
                if (!recording.audioUrl) {
                  console.log('Skipping invalid recording without audioUrl');
                  continue;
                }
                
                // Format for Supabase
                const recordingData = {
                  id: recording.id || self.crypto.randomUUID?.() || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                  candidate_id: recording.candidateId,
                  question_id: recording.questionId,
                  transcript: recording.transcript || '',
                  audio_url: recording.audioUrl,
                  created_at: recording.createdAt || new Date().toISOString(),
                  notes: recording.notes || ''
                };
                
                // Insert directly
                const { error: insertError } = await supabase
                  .from('recordings')
                  .insert([recordingData]);
                  
                if (insertError) {
                  console.error('Error migrating recording to Supabase:', insertError);
                } else {
                  console.log(`Successfully migrated recording ${recordingData.id} to Supabase`);
                }
              } catch (migrationError) {
                console.error('Error during migration:', migrationError);
              }
            }
            
            // Check if migration succeeded
            try {
              const { data: migratedData } = await supabase
                .from('recordings')
                .select('*');
                
              if (migratedData && migratedData.length > 0) {
                console.log(`Migration successful, found ${migratedData.length} recordings in Supabase after migration`);
                
                const mappedRecordings = migratedData.map(item => ({
                  id: item.id,
                  candidateId: item.candidate_id,
                  questionId: item.question_id,
                  transcript: item.transcript || '',
                  audioUrl: item.audio_url,
                  notes: item.notes || '',
                  createdAt: item.created_at
                }));
                
                setRecordings(mappedRecordings);
                return; // Exit if migration successful
              }
            } catch (checkError) {
              console.error('Error checking migration success:', checkError);
            }
            
            // If we're here, migration failed or didn't produce results
            setRecordings(localRecordings);
          } catch (parseError) {
            console.error('Error parsing localStorage recordings:', parseError);
          }
        } else {
          console.log('No recordings found in localStorage either');
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
      
      if (recordingsData && recordingsData.length > 0) {
        console.log('Sample recording:', recordingsData[0]);
      }
      
      // Check Storage bucket for recordings
      const { data: storageData, error: storageError } = await supabase.storage.from('recordings').list();
      
      if (storageError) {
        console.error('Error listing storage files:', storageError);
      } else {
        console.log(`Found ${storageData?.length || 0} files in storage bucket`);
      }
      
      // Check table structure
      const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info', { 
        table_name: 'recordings' 
      });
      
      let tableStructure = 'Could not retrieve table structure';
      
      if (tableError) {
        console.error('Error getting table info:', tableError);
      } else if (tableInfo) {
        tableStructure = JSON.stringify(tableInfo, null, 2);
        console.log('Table structure:', tableStructure);
      }
      
      // Check localStorage
      const localStorageRecordings = localStorage.getItem('recordings');
      const persistentCandidateId = localStorage.getItem('persistentCandidateId');
      
      console.log('Persistent candidate ID:', persistentCandidateId);
      console.log('localStorage recordings:', localStorageRecordings ? JSON.parse(localStorageRecordings).length : 0);
      
      // Try a direct fetch using the persistentCandidateId
      let candidateRecordings = [];
      if (persistentCandidateId) {
        const { data: directRecordings, error: directError } = await supabase
          .from('recordings')
          .select('*')
          .eq('candidate_id', persistentCandidateId);
          
        if (directError) {
          console.error('Error fetching candidate recordings directly:', directError);
        } else {
          candidateRecordings = directRecordings || [];
          console.log(`Found ${candidateRecordings.length} recordings for persistent candidate ID directly from Supabase`);
        }
      }
      
      // Display detailed debug info
      alert(`
Debug Info:
- Supabase connection: OK
- Recordings in Supabase database: ${recordingsData?.length || 0}
- Files in Supabase storage: ${storageData?.length || 0}
- Persistent candidate ID: ${persistentCandidateId || 'Not found'}
- Direct query for candidate recordings: ${candidateRecordings.length}
- Recordings in localStorage: ${localStorageRecordings ? JSON.parse(localStorageRecordings).length : 0}

${recordingsData && recordingsData.length > 0 ? 
  `Sample recording from database:
  - ID: ${recordingsData[0].id}
  - Candidate ID: ${recordingsData[0].candidate_id}
  - Question ID: ${recordingsData[0].question_id}
  - Audio URL: ${recordingsData[0].audio_url}
  - Created: ${new Date(recordingsData[0].created_at).toLocaleString()}` : 
  'No recordings found in database'}
      `);
      
    } catch (error) {
      console.error('Debug error:', error);
      alert(`Debug error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSyncStorageToDatabase = async () => {
    if (!confirm('This will scan your storage bucket and create database entries for all recording files. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('Starting sync of storage files to database...');
      
      // Get all files from the recordings storage bucket
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('recordings')
        .list();
      
      if (storageError) {
        console.error('Error listing storage files:', storageError);
        alert(`Error listing storage files: ${storageError.message}`);
        return;
      }
      
      console.log(`Found ${storageFiles?.length || 0} files in storage bucket`);
      
      if (!storageFiles || storageFiles.length === 0) {
        alert('No files found in storage bucket');
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each file
      for (const file of storageFiles) {
        try {
          // Skip folders
          if (file.id === null) continue;
          
          console.log(`Processing file: ${file.name}`);
          
          // Get public URL for the file
          const { data: { publicUrl } } = supabase.storage
            .from('recordings')
            .getPublicUrl(file.name);
          
          // Try to extract candidate ID and question ID from filename
          // Expected format: candidateId_questionId_timestamp_random.webm
          const filenameParts = file.name.split('_');
          
          let candidateId, questionId;
          
          if (filenameParts.length >= 2) {
            candidateId = filenameParts[0];
            questionId = filenameParts[1];
          } else {
            // If we can't parse the filename, use placeholder IDs
            candidateId = 'unknown';
            questionId = 'unknown';
          }
          
          // Check if a record for this file already exists
          const { data: existingRecords, error: checkError } = await supabase
            .from('recordings')
            .select('id')
            .eq('audio_url', publicUrl);
          
          if (checkError) {
            console.error('Error checking for existing record:', checkError);
            errorCount++;
            continue;
          }
          
          if (existingRecords && existingRecords.length > 0) {
            console.log(`Record already exists for file ${file.name}`);
            continue;
          }
          
          // Create a record in the recordings table
          const { data: insertData, error: insertError } = await supabase
            .from('recordings')
            .insert({
              audio_url: publicUrl,
              candidate_id: candidateId,
              question_id: questionId,
              transcript: '',
              created_at: new Date(file.created_at || Date.now()).toISOString()
            })
            .select();
          
          if (insertError) {
            console.error(`Error creating record for file ${file.name}:`, insertError);
            errorCount++;
          } else {
            console.log(`Created record for file ${file.name}:`, insertData);
            successCount++;
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          errorCount++;
        }
      }
      
      // Refresh the data after sync
      await fetchData();
      
      alert(`Sync completed:\n- ${successCount} records created\n- ${errorCount} errors\n\nThe dashboard has been refreshed.`);
    } catch (error) {
      console.error('Error synchronizing storage to database:', error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
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
            onClick={handleSyncStorageToDatabase}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            Sync Storage Files
          </button>
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