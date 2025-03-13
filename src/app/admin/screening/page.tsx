'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import Link from 'next/link';
import { Loader2, Upload, FileText, Filter, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';
import ResumeUploader from '@/components/resume/ResumeUploader';
import { analyzeResume, getEvaluationsForJob } from '@/lib/services/resumeService';
import { ensureResumesBucketPolicy } from '@/lib/supabase/createBucketPolicy';

export default function ScreeningPage() {
  const [loading, setLoading] = useState(true);
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [uploadingResumes, setUploadingResumes] = useState(false);
  const [analyzingResumes, setAnalyzingResumes] = useState(false);
  const [resumeEvaluations, setResumeEvaluations] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Initialize bucket and policies when component mounts
  useEffect(() => {
    const initBucketPolicies = async () => {
      try {
        // This will ensure the bucket exists and has the right policies
        const result = await ensureResumesBucketPolicy();
        if ('error' in result && result.error) {
          console.error('Failed to set up bucket policies:', result.error);
        } else if ('manualSetupRequired' in result && result.manualSetupRequired) {
          console.log('Bucket policies successfully configured');
          console.log('Please check the console for manual policy setup instructions');
        } else {
          console.log('Bucket policies successfully configured');
        }
      } catch (error) {
        console.error('Error initializing bucket policies:', error);
      }
    };

    initBucketPolicies();
  }, []);

  // Fetch job postings on component mount
  useEffect(() => {
    fetchJobPostings();
  }, []);

  // Fetch evaluations when selectedJobId changes
  useEffect(() => {
    if (selectedJobId) {
      fetchEvaluations(selectedJobId);
    }
  }, [selectedJobId]);

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setJobPostings(data || []);
    } catch (error) {
      console.error('Error fetching job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async (jobId: string) => {
    try {
      console.log(`Fetching evaluations for job ID: ${jobId}`);
      setLoading(true);
      
      const { data: evaluations, error } = await supabase
        .from('resume_evaluations')
        .select(`
          id,
          resume_id,
          overall_score,
          ownership_score,
          organization_impact_score,
          independence_score,
          strategic_alignment_score,
          skills_score,
          ownership_level,
          organization_impact_level,
          independence_level,
          strategic_alignment_level,
          skills_level,
          selected_for_interview,
          resume:resume_id (
            id,
            file_name,
            file_url
          )
        `)
        .eq('job_posting_id', jobId)
        .order('overall_score', { ascending: false });
      
      if (error) {
        console.error('Error fetching evaluations:', error);
        return;
      }
      
      console.log(`Fetched ${evaluations?.length || 0} evaluations for job ID ${jobId}:`, evaluations);
      
      if (evaluations) {
        setResumeEvaluations(evaluations);
      } else {
        console.log('No evaluations found for this job');
        setResumeEvaluations([]);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (resumeIds: string[]) => {
    if (!selectedJobId || resumeIds.length === 0) {
      console.log('No job or resume IDs provided to handleUploadComplete');
      return;
    }

    console.log(`Starting analysis of ${resumeIds.length} resumes for job ${selectedJobId}`);
    setAnalyzingResumes(true);
    
    try {
      // Analyze each resume with better progress tracking
      let successfulAnalyses = 0;
      for (let i = 0; i < resumeIds.length; i++) {
        const resumeId = resumeIds[i];
        console.log(`Analyzing resume ${i+1}/${resumeIds.length}: ${resumeId} for job ${selectedJobId}`);
        
        try {
          // Ensure we pass both resumeId and jobPostingId
          const result = await analyzeResume(resumeId, selectedJobId);
          
          if (result.success) {
            console.log(`Successfully analyzed resume ${resumeId}`);
            successfulAnalyses++;
          } else {
            console.error(`Failed to analyze resume ${resumeId}:`, result.error);
          }
        } catch (analysisError) {
          console.error(`Error analyzing resume ${resumeId}:`, analysisError);
          // Continue with next resume instead of stopping the whole process
        }
      }
      
      // Refresh evaluations
      console.log(`Analysis complete, ${successfulAnalyses} of ${resumeIds.length} successful. Fetching updated evaluations.`);
      await fetchEvaluations(selectedJobId);
      
      // Show results tab
      setShowResults(true);
      console.log('Resume analysis process complete');
      
      // Alert the user of the results
      if (successfulAnalyses > 0) {
        alert(`Successfully analyzed ${successfulAnalyses} of ${resumeIds.length} resumes.`);
      } else {
        alert('Failed to analyze any resumes. Please check the console for more details.');
      }
    } catch (error) {
      console.error('Error in resume analysis process:', error);
      alert('There was an error analyzing one or more resumes. Some data may be incomplete.');
    } finally {
      setAnalyzingResumes(false);
    }
  };

  const handleViewResults = () => {
    if (resumeEvaluations.length > 0) {
      window.location.href = `/admin/candidates?job=${selectedJobId}`;
    } else {
      alert('No resume evaluations found. Please upload and analyze resumes first.');
    }
  };

  // Function to handle selecting/deselecting candidates for interview
  const handleSelectForInterview = async (candidateId: string, isSelected: boolean) => {
    try {
      const { data, error } = await supabase
        .from('resume_evaluations')
        .update({ selected_for_interview: isSelected })
        .eq('id', candidateId);

      if (error) {
        console.error('Error updating candidate status:', error);
        return;
      }

      // Update local state
      setResumeEvaluations(prevEvaluations => 
        prevEvaluations.map(evaluation => 
          evaluation.id === candidateId
            ? { ...evaluation, selected_for_interview: isSelected }
            : evaluation
        )
      );
    } catch (error) {
      console.error('Error selecting candidate for interview:', error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Resume Screening</h1>
        <p className="text-gray-500">
          Upload candidate resumes and analyze them against job descriptions
        </p>
      </header>

      <Tabs defaultValue="upload" className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="text-sm font-medium py-2.5">
              Upload Resumes
            </TabsTrigger>
            <TabsTrigger value="results" className="text-sm font-medium py-2.5">
              View Results
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upload" className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Select Job Position</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter resumes against a specific job description
              </label>
              
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  <span className="text-gray-500">Loading job postings...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobPostings.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedJobId === job.id 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`mt-0.5 rounded-full flex items-center justify-center p-1 ${
                          selectedJobId === job.id ? 'bg-blue-500' : 'bg-gray-200'
                        }`}>
                          <svg 
                            className={`h-4 w-4 ${selectedJobId === job.id ? 'text-white' : 'text-gray-400'}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d={selectedJobId === job.id 
                                ? "M5 13l4 4L19 7" 
                                : "M12 4v16m8-8H4"
                              } 
                            />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-base font-medium text-gray-900">{job.title}</h3>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {job.description.slice(0, 100)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <h2 className="text-lg font-semibold mb-4 text-gray-900 mt-8">Upload Resumes</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 transition-all duration-200 hover:border-blue-400 bg-gray-50 hover:bg-blue-50">
              <ResumeUploader
                jobPostingId={selectedJobId || ''}
                onUploadComplete={handleUploadComplete}
              />
              {(!selectedJobId || uploadingResumes) && (
                <div className="mt-4 text-center">
                  {!selectedJobId ? (
                    <p className="text-sm text-gray-500">Please select a job position first</p>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                      <p className="text-sm text-gray-600">Processing uploads...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {resumeEvaluations.length > 0 ? (
            <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Evaluation Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-500 mb-1">Total Candidates</div>
                    <div className="text-2xl font-bold text-gray-900">{resumeEvaluations.length}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm font-medium text-gray-500 mb-1">High Scores (80%+)</div>
                    <div className="text-2xl font-bold text-green-600">
                      {resumeEvaluations.filter(e => e.overall_score >= 80).length}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="text-sm font-medium text-gray-500 mb-1">Medium Scores (60-79%)</div>
                    <div className="text-2xl font-bold text-amber-600">
                      {resumeEvaluations.filter(e => e.overall_score >= 60 && e.overall_score < 80).length}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Candidate</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Overall Score</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Resume</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {resumeEvaluations.map((evaluation) => (
                      <tr key={evaluation.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                          <div className="font-medium text-gray-900">
                            {evaluation.resume?.candidate_name || 'Unknown'}
                          </div>
                          <div className="text-gray-500">
                            {evaluation.resume?.candidate_email || 'No email provided'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="flex items-center">
                            <div className="mr-2 flex-shrink-0">
                              <div 
                                className={`h-2.5 w-2.5 rounded-full ${
                                  evaluation.overall_score >= 80 ? 'bg-green-500' : 
                                  evaluation.overall_score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                }`} 
                              />
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div
                                className={`h-2.5 rounded-full ${
                                  evaluation.overall_score >= 80 ? 'bg-green-500' : 
                                  evaluation.overall_score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${evaluation.overall_score}%` }}
                              ></div>
                            </div>
                            <span>{evaluation.overall_score}%</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {evaluation.resume?.file_url ? (
                            <a
                              href={evaluation.resume.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              View Resume
                            </a>
                          ) : (
                            <span className="text-gray-500">Not available</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            evaluation.selected_for_interview 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {evaluation.selected_for_interview ? 'Selected' : 'Pending'}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <a
                            href={`/admin/candidates/${evaluation.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleSelectForInterview(evaluation.id, !evaluation.selected_for_interview)}
                            className={`${
                              evaluation.selected_for_interview 
                                ? 'text-gray-600 hover:text-gray-900' 
                                : 'text-blue-600 hover:text-blue-900'
                            }`}
                          >
                            {evaluation.selected_for_interview ? 'Deselect' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg p-10 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-5 text-lg font-medium text-gray-900">No evaluation results</h3>
              <p className="mt-2 text-sm text-gray-500">
                {showResults 
                  ? "No evaluations found for the selected job posting." 
                  : "Upload resumes and select a job posting to see evaluation results."}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => (Tabs as any).set('upload')}
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resumes
                </button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 