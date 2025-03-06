'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Question, Candidate, Recording } from '@/lib/models/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Loader2, ChevronRight, User, FileQuestion, Mic, Plus, X } from 'lucide-react';
import { CandidatesTab } from '@/components/admin/CandidatesTab';
import { QuestionsTab } from '@/components/admin/QuestionsTab';
import { RecordingsTab } from '@/components/admin/RecordingsTab';
import { v4 as uuidv4 } from 'uuid';
import { 
  getQuestions, 
  getCandidates, 
  getRecordings, 
  addQuestion, 
  addCandidate,
  getRecordingsWithDetails
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
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateRecordings, setCandidateRecordings] = useState<Recording[]>([]);

  // Initialize data and fetch from Supabase
  useEffect(() => {
    fetchData();
    
    // Set up an interval to refresh data if autoRefreshEnabled is true
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (autoRefreshEnabled) {
      refreshInterval = setInterval(() => {
        console.log('Auto-refreshing data...');
        fetchData(true); // Pass true to preserve filters
      }, 30000);
    }
    
    // Clean up the interval when the component unmounts or when autoRefreshEnabled changes
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefreshEnabled]); // Re-run effect when autoRefreshEnabled changes

  const fetchData = async (preserveFilters = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Save the current selectedCandidateId if preserveFilters is true
      const currentSelectedCandidateId = preserveFilters ? selectedCandidateId : null;
      
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
      
      // Get recordings from Supabase with transcript and sentiment data
      const fetchedRecordings = await getRecordingsWithDetails();
      setRecordings(fetchedRecordings);
      
      // After all data is fetched, restore the selectedCandidateId if preserveFilters is true
      if (preserveFilters && currentSelectedCandidateId) {
        setSelectedCandidateId(currentSelectedCandidateId);
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

  // Handler for changing selected candidate filter
  const handleCandidateFilterChange = (candidateId: string | null) => {
    setSelectedCandidateId(candidateId);
    
    // If a candidate is selected, automatically show their details
    if (candidateId) {
      handleViewCandidate(candidateId);
    }
  };

  // Handler for viewing candidate details
  const handleViewCandidate = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      const filteredRecordings = recordings.filter(r => r.candidateId === candidateId);
      setCandidateRecordings(filteredRecordings);
      setShowCandidateModal(true);
      
      // Also update the filter to match this candidate
      setSelectedCandidateId(candidateId);
    }
  };
  
  // Handler for closing the candidate modal
  const handleCloseModal = () => {
    setShowCandidateModal(false);
    // Optionally reset the filter when closing the modal
    // setSelectedCandidateId(null);
  };

  // Add a new helper function to render sentiment indicators
  const renderSentimentIndicator = (sentimentScore?: number, sentimentType?: string) => {
    if (sentimentScore === undefined || !sentimentType) return null;
    
    let icon = '😐';
    let color = 'text-gray-500';
    
    switch (sentimentType.toLowerCase()) {
      case 'positive':
        icon = '😊';
        color = 'text-green-500';
        break;
      case 'negative':
        icon = '😟';
        color = 'text-red-500';
        break;
      case 'neutral':
        icon = '😐';
        color = 'text-gray-500';
        break;
    }
    
    return (
      <span className={`font-medium ${color} text-lg`} title={`Sentiment: ${sentimentType} (${sentimentScore.toFixed(2)})`}>
        {icon}
      </span>
    );
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
          <div className="flex items-center space-x-2">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={autoRefreshEnabled}
                  onChange={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                />
                <div className={`block w-10 h-6 rounded-full ${autoRefreshEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${autoRefreshEnabled ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Auto Refresh {autoRefreshEnabled ? 'On' : 'Off'}
              </span>
            </label>
          </div>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            onClick={() => handleRefresh()}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Refresh Data'}
          </button>
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            onClick={handleDebug}
          >
            Debug
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            onClick={handleSyncStorageToDatabase}
          >
            Sync Storage Files
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
          <CandidatesTab 
            candidates={candidates} 
            onViewCandidate={handleViewCandidate}
          />
        </TabsContent>
        
        <TabsContent value="recordings">
          <RecordingsTab 
            recordings={recordings} 
            questions={questions}
            candidates={candidates}
            selectedCandidateId={selectedCandidateId}
            onCandidateFilterChange={handleCandidateFilterChange}
            onViewCandidate={handleViewCandidate}
          />
        </TabsContent>
      </Tabs>
      
      {/* Candidate Details Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedCandidate.name || 'Unnamed Candidate'}</h2>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Candidate Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{selectedCandidate.email || 'No email provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created On</p>
                    <p>{new Date(selectedCandidate.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Recordings ({candidateRecordings.length})</h3>
                {candidateRecordings.length === 0 ? (
                  <p className="text-gray-500">No recordings available for this candidate.</p>
                ) : (
                  <div className="border rounded-lg divide-y">
                    {candidateRecordings.map(recording => {
                      const question = questions.find(q => q.id === recording.questionId);
                      return (
                        <div key={recording.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-medium">
                              {question?.text || 'Unknown Question'}
                              {recording.sentimentScore !== undefined && recording.sentimentType && (
                                <span className="ml-2">
                                  {renderSentimentIndicator(recording.sentimentScore, recording.sentimentType)}
                                </span>
                              )}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {new Date(recording.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="my-2">
                            <audio src={recording.audioUrl} controls className="w-full" />
                          </div>
                          {recording.transcript && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 font-medium">Transcript:</p>
                              <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{recording.transcript}</p>
                            </div>
                          )}
                          
                          {recording.summary && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 font-medium">Summary:</p>
                              <p className="text-sm mt-1 bg-yellow-50 p-2 rounded border border-yellow-200">{recording.summary}</p>
                            </div>
                          )}
                          
                          {recording.topics && recording.topics.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 font-medium">Key Topics:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {recording.topics.map((topic, index) => (
                                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                    {topic.topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 text-right">
                            <Link 
                              href={`/admin/recordings/${recording.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 