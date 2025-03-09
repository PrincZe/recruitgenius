'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import Link from 'next/link';
import { Loader2, Upload, FileText, Filter, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';
import ResumeUploader from '@/components/resume/ResumeUploader';
import { analyzeResume, getEvaluationsForJob } from '@/lib/services/resumeService';

export default function ScreeningPage() {
  const [loading, setLoading] = useState(true);
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [uploadingResumes, setUploadingResumes] = useState(false);
  const [analyzingResumes, setAnalyzingResumes] = useState(false);
  const [resumeEvaluations, setResumeEvaluations] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

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
      setLoading(true);
      const evaluations = await getEvaluationsForJob(jobId);
      setResumeEvaluations(evaluations);
      
      // If we have evaluations, show results tab
      if (evaluations.length > 0) {
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (resumeIds: string[]) => {
    if (!selectedJobId || resumeIds.length === 0) return;

    setAnalyzingResumes(true);
    
    try {
      // Analyze each resume
      for (const resumeId of resumeIds) {
        await analyzeResume(resumeId, selectedJobId);
      }
      
      // Refresh evaluations
      await fetchEvaluations(selectedJobId);
      
      // Show results tab
      setShowResults(true);
    } catch (error) {
      console.error('Error analyzing resumes:', error);
      alert('There was an error analyzing the resumes. Please try again.');
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

  return (
    <div className="px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Resume Screening</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200">
            Back to Dashboard
          </Link>
          <button 
            onClick={fetchJobPostings}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Select Job Posting</h2>
            
            {jobPostings.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No job postings found.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Job postings will appear here once added.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobPostings.map((job) => (
                  <div 
                    key={job.id}
                    className={`p-4 border rounded-md cursor-pointer transition ${
                      selectedJobId === job.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.department || 'No department'}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {job.skills && job.skills.slice(0, 3).map((skill: string, i: number) => (
                        <span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                      {job.skills && job.skills.length > 3 && (
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          +{job.skills.length - 3} more
                        </span>
                      )}
                    </div>
                    {selectedJobId === job.id && resumeEvaluations.length > 0 && (
                      <div className="mt-2 text-sm text-blue-600">
                        {resumeEvaluations.length} resume(s) analyzed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedJobId && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Upload Resumes</h2>
              
              <ResumeUploader 
                jobPostingId={selectedJobId}
                onUploadComplete={handleUploadComplete}
              />
              
              {analyzingResumes && (
                <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Analyzing resumes against job requirements...</span>
                </div>
              )}
              
              {showResults && (
                <div className="mt-6 flex justify-between items-center">
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{resumeEvaluations.length} resume(s) analyzed</span>
                  </div>
                  <button
                    onClick={handleViewResults}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    View Results
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedJobId && jobPostings.length > 0 && showResults && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
              
              {resumeEvaluations.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No evaluation results yet.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload and analyze resumes to see results here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resume
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Overall Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ownership
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Org Impact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Independence
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Strategic
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Skills
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resumeEvaluations.map((evaluation) => (
                        <tr key={evaluation.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {evaluation.resume?.file_name || 'Unknown resume'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {evaluation.overall_score.toFixed(1)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              L{evaluation.ownership_level} ({evaluation.ownership_score.toFixed(1)})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              L{evaluation.organization_impact_level} ({evaluation.organization_impact_score.toFixed(1)})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              L{evaluation.independence_level} ({evaluation.independence_score.toFixed(1)})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              L{evaluation.strategic_alignment_level} ({evaluation.strategic_alignment_score.toFixed(1)})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              L{evaluation.skills_level} ({evaluation.skills_score.toFixed(1)})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a 
                              href={evaluation.resume?.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleViewResults}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Go to Candidate Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 