'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, 
  FileText, 
  CheckCircle, 
  XCircle, 
  User,
  ArrowLeft,
  Filter,
  Mic,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { getEvaluationsForJob } from '@/lib/services/resumeService';
import { v4 as uuidv4 } from 'uuid';
import StatisticsPanel from '@/components/admin/StatisticsPanel';
import CandidatesTable from '@/components/admin/CandidatesTable';

export default function CandidatesDashboard() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job');
  
  const [loading, setLoading] = useState(true);
  const [jobPosting, setJobPosting] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [generatingLinks, setGeneratingLinks] = useState(false);
  const [interviewLinks, setInterviewLinks] = useState<{
    candidateId: string;
    candidateName: string;
    sessionId: string;
    interviewLink: string;
  }[]>([]);

  // Statistics state
  const [stats, setStats] = useState({
    totalCandidates: 0,
    completedInterviews: 0,
    pendingInterviews: 0,
    confidenceLevels: {
      high: 0,
      medium: 0,
      low: 0
    },
    weeklySubmissions: [
      { day: 'Mon', count: 0 },
      { day: 'Tue', count: 0 },
      { day: 'Wed', count: 0 },
      { day: 'Thu', count: 0 },
      { day: 'Fri', count: 0 }
    ]
  });

  // At the top of the file, add a state for all job postings
  const [allJobPostings, setAllJobPostings] = useState<any[]>([]);

  // Add a function to fetch all job postings
  const fetchAllJobPostings = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) throw error;
      setAllJobPostings(data || []);
      
      // If no jobId is provided but we have job postings, select the first one
      if (!jobId && data && data.length > 0) {
        const firstJobId = data[0].id;
        window.history.pushState({}, '', `/admin/candidates?job=${firstJobId}`);
        fetchJobDetails(firstJobId);
        fetchEvaluations(firstJobId);
      }
    } catch (error) {
      console.error('Error fetching job postings:', error);
    }
  };

  // Update the useEffect to call fetchAllJobPostings
  useEffect(() => {
    fetchAllJobPostings();
    
    if (jobId) {
      fetchJobDetails(jobId);
      fetchEvaluations(jobId);
    }
  }, [jobId]);

  // Modify fetchJobDetails and fetchEvaluations to accept an optional jobId parameter
  const fetchJobDetails = async (id?: string) => {
    try {
      const jobIdToUse = id || jobId;
      if (!jobIdToUse) return;

      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', jobIdToUse)
        .single();

      if (error) throw error;
      setJobPosting(data);
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const fetchEvaluations = async (id?: string) => {
    try {
      setLoading(true);
      const jobIdToUse = id || jobId;
      if (!jobIdToUse) return;

      const data = await getEvaluationsForJob(jobIdToUse);
      
      // Add candidate data if it's missing
      const evaluationsWithCandidates = await Promise.all(
        data.map(async (evaluation) => {
          if (!evaluation.candidate_id) {
            // Create mock candidate for demo
            const candidateName = getRandomName();
            const { data: candidateData, error } = await supabase
              .from('candidates')
              .insert([
                {
                  name: candidateName,
                  email: `${candidateName.toLowerCase().replace(' ', '.')}@example.com`,
                  has_resume: true,
                  resume_id: evaluation.resume_id
                }
              ])
              .select()
              .single();

            if (error) throw error;

            // Update resume with candidate ID
            await supabase
              .from('resumes')
              .update({ candidate_id: candidateData.id })
              .eq('id', evaluation.resume_id);

            return {
              ...evaluation,
              candidate: candidateData
            };
          }
          return evaluation;
        })
      );

      setEvaluations(evaluationsWithCandidates);
      
      // Calculate statistics
      calculateStatistics(evaluationsWithCandidates);

      // Let's add some detailed debug logging to help diagnose the issue
      console.log('Loading candidates page...');

      // After fetching candidates, add this logging:
      console.log(`Fetched ${evaluationsWithCandidates.length} candidates:`, evaluationsWithCandidates);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (evaluations: any[]) => {
    // Count totals
    const total = evaluations.length;
    const completed = evaluations.filter(e => e.selected_for_interview).length;
    const pending = total - completed;
    
    // Calculate confidence levels using overall_score as a percentage (0-100)
    const high = evaluations.filter(e => e.overall_score >= 80).length;
    const medium = evaluations.filter(e => e.overall_score >= 60 && e.overall_score < 80).length;
    const low = evaluations.filter(e => e.overall_score < 60).length;
    
    // Calculate weekly submissions (mock data for demo)
    // In a real application, this would come from actual submission timestamps
    const weeklyData = [
      { day: 'Mon', count: Math.floor(Math.random() * 20) + 10 },
      { day: 'Tue', count: Math.floor(Math.random() * 20) + 15 },
      { day: 'Wed', count: Math.floor(Math.random() * 20) + 12 },
      { day: 'Thu', count: Math.floor(Math.random() * 20) + 18 },
      { day: 'Fri', count: Math.floor(Math.random() * 20) + 14 }
    ];
    
    setStats({
      totalCandidates: total,
      completedInterviews: completed,
      pendingInterviews: pending,
      confidenceLevels: {
        high, // 80-100%
        medium, // 60-79%
        low // <60%
      },
      weeklySubmissions: weeklyData
    });
  };

  const handleCandidateSelect = (evaluationId: string) => {
    setSelectedCandidates(prev => {
      if (prev.includes(evaluationId)) {
        return prev.filter(id => id !== evaluationId);
      } else {
        return [...prev, evaluationId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === evaluations.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(evaluations.map(e => e.id));
    }
  };

  const handleStatusChange = async (evaluationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('resume_evaluations')
        .update({ status })
        .eq('id', evaluationId);
      
      if (error) throw error;
      
      // Update local state
      setEvaluations(prev => 
        prev.map(evaluation => 
          evaluation.id === evaluationId 
            ? { ...evaluation, status } 
            : evaluation
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSaveRemarks = async (evaluationId: string, remarks: string) => {
    try {
      const { error } = await supabase
        .from('resume_evaluations')
        .update({ remarks })
        .eq('id', evaluationId);
      
      if (error) throw error;
      
      // Update local state
      setEvaluations(prev => 
        prev.map(evaluation => 
          evaluation.id === evaluationId 
            ? { ...evaluation, remarks } 
            : evaluation
        )
      );
    } catch (error) {
      console.error('Error saving remarks:', error);
    }
  };

  const generateInterviewLinks = async () => {
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate');
      return;
    }

    setGeneratingLinks(true);

    try {
      const links = [];

      for (const evaluationId of selectedCandidates) {
        const evaluation = evaluations.find(e => e.id === evaluationId);
        if (!evaluation) continue;

        const candidateId = evaluation.candidate?.id;
        const candidateName = evaluation.candidate?.name || 'Unknown Candidate';
        
        if (!candidateId) continue;

        // Create a new session
        const sessionId = uuidv4();
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert([
            {
              id: sessionId,
              candidate_id: candidateId,
              job_posting_id: jobId,
              questions: ['q1', 'q2', 'q3'], // Default interview questions
              progress: 0,
              is_completed: false
            }
          ])
          .select();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          continue;
        }

        // Generate link
        const interviewLink = `${window.location.origin}/interview/${sessionId}`;
        
        // Update candidate with session ID
        await supabase
          .from('candidates')
          .update({ session_id: sessionId })
          .eq('id', candidateId);

        // Add to links array
        links.push({
          candidateId,
          candidateName,
          sessionId,
          interviewLink
        });

        // Mark evaluation as selected for interview
        await supabase
          .from('resume_evaluations')
          .update({ 
            selected_for_interview: true,
            interview_date: new Date().toISOString()
          })
          .eq('id', evaluationId);
      }

      setInterviewLinks(links);
      
      // Refresh evaluations
      fetchEvaluations();
    } catch (error) {
      console.error('Error generating interview links:', error);
      alert('There was an error generating interview links');
    } finally {
      setGeneratingLinks(false);
    }
  };

  // Helper function to get a random name for demo purposes
  const getRandomName = () => {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sam', 'Jamie'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };

  return (
    <div className="px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/admin/screening" className="mr-4 p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Recruit Genius</h1>
        </div>
        <div className="flex gap-2 items-center">
          {jobPosting && (
            <div className="px-3 py-2 bg-white rounded-md shadow-sm text-gray-700 flex items-center">
              <span className="mr-2">Job:</span>
              <select 
                className="font-medium text-gray-900 border-none focus:ring-0 bg-transparent"
                value={jobPosting.id}
                onChange={(e) => {
                  // Redirect to the selected job
                  window.location.href = `/admin/candidates?job=${e.target.value}`;
                }}
              >
                {allJobPostings.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => fetchEvaluations()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
          >
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {jobPosting && (
        <StatisticsPanel 
          totalCandidates={stats.totalCandidates}
          completedInterviews={stats.completedInterviews}
          pendingInterviews={stats.pendingInterviews}
          confidenceLevels={stats.confidenceLevels}
          weeklySubmissions={stats.weeklySubmissions}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading candidates...</span>
        </div>
      ) : (
        <>
          <CandidatesTable 
            candidates={evaluations}
            selectedCandidates={selectedCandidates}
            onSelectCandidate={handleCandidateSelect}
            onSelectAll={handleSelectAll}
            onStatusChange={handleStatusChange}
            onSaveRemarks={handleSaveRemarks}
            onGenerateInterviewLinks={generateInterviewLinks}
            isGeneratingLinks={generatingLinks}
          />

          {interviewLinks.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
              <h2 className="text-xl font-semibold mb-4">Interview Links Generated</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interview Link
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {interviewLinks.map((link) => (
                      <tr key={link.sessionId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {link.candidateName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-md">
                            {link.interviewLink}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a 
                            href={link.interviewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open Link
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 