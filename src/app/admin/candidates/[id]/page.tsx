'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Loader2, 
  ArrowLeft, 
  FileText, 
  User, 
  BarChart,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Mic,
  Mail
} from 'lucide-react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Suspense } from 'react';

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  const candidateId = params.id;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingState />}>
        <CandidateDetailClient candidateId={candidateId} />
      </Suspense>
    </div>
  );
}

// Client component that handles data fetching and display
function CandidateDetailClient({ candidateId }: { candidateId: string }) {
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  
  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('resume_evaluations')
          .select(`
            *,
            resume:resume_id (
              id,
              file_name,
              file_url
            ),
            job_posting:job_posting_id (
              id,
              title,
              description
            )
          `)
          .eq('id', candidateId)
          .single();
        
        if (error) {
          console.error('Error fetching candidate:', error);
          return;
        }
        
        // Set the filename for display
        if (data?.resume?.file_name) {
          setFileName(data.resume.file_name.replace('.pdf', ''));
        }
        
        setCandidate(data);
      } catch (error) {
        console.error('Error fetching candidate:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCandidate();
  }, [candidateId]);
  
  if (loading) {
    return <LoadingState />;
  }
  
  if (!candidate) {
    return <div className="p-8 text-center">Candidate not found</div>;
  }
  
  // Extract analysis data
  const analysisJson = candidate.analysis_json || {};
  
  // Render the candidate detail page
  return (
    <div className="p-6 md:p-8 max-w-screen-xl mx-auto">
      <Link href="/admin/candidates" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Candidates
      </Link>
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{fileName || 'Unknown Candidate'}</h1>
          <p className="text-gray-500">
            Resume uploaded {format(new Date(candidate.created_at), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            className={`inline-flex items-center px-4 py-2 rounded-md font-medium text-sm ${
              candidate.selected_for_interview
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={async () => {
              // Handle inviting to interview logic
            }}
          >
            {candidate.selected_for_interview ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Selected for Interview
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Invite to Interview
              </>
            )}
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Overall Score</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold">{candidate.overall_score.toFixed(0)}<span className="text-xl font-normal text-gray-500">/100</span></span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${Math.min(Math.max(candidate.overall_score, 0), 100)}%` }}
            ></div>
          </div>
          <p className="mt-4 text-gray-500 text-sm">
            Evaluated against: <span className="font-medium text-gray-700">{candidate.job_posting?.title || 'Job Position'}</span>
          </p>
        </div>
        
        {/* Dimension Scores Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Dimension Scores</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Ownership <span className="text-xs text-gray-500">L{candidate.ownership_level || 4}</span></span>
                <span>{candidate.ownership_score.toFixed(1)}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(Math.max(candidate.ownership_score * 10, 0), 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span>Organization Impact <span className="text-xs text-gray-500">L{candidate.organization_impact_level || 4}</span></span>
                <span>{candidate.organization_impact_score.toFixed(1)}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(Math.max(candidate.organization_impact_score * 10, 0), 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span>Independence <span className="text-xs text-gray-500">L{candidate.independence_level || 4}</span></span>
                <span>{candidate.independence_score.toFixed(1)}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(Math.max(candidate.independence_score * 10, 0), 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span>Strategic Alignment <span className="text-xs text-gray-500">L{candidate.strategic_alignment_level || 4}</span></span>
                <span>{candidate.strategic_alignment_score.toFixed(1)}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(Math.max(candidate.strategic_alignment_score * 10, 0), 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analysis Details Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Analysis Details</h2>
          
          <div className="space-y-4">
            {/* Summary Section */}
            <div>
              <h3 className="font-medium mb-2">Summary</h3>
              <p className="text-gray-700 text-sm">
                {analysisJson.analysis || 'No summary available'}
              </p>
            </div>
            
            {/* Strengths Section */}
            <div>
              <h3 className="font-medium mb-2">Strengths</h3>
              {analysisJson.strengths && analysisJson.strengths.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {analysisJson.strengths.slice(0, 5).map((strength: string, index: number) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No strengths information available</p>
              )}
            </div>
            
            {/* Development Areas Section */}
            <div>
              <h3 className="font-medium mb-2">Development Areas</h3>
              {analysisJson.developmentAreas && analysisJson.developmentAreas.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {analysisJson.developmentAreas.slice(0, 5).map((area: string, index: number) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No development areas information available</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Resume Preview Card - This is optional and can be implemented if needed */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Resume Preview</h2>
        <div className="border rounded-md p-4 flex items-center justify-center min-h-[200px]">
          {candidate.resume?.file_url ? (
            <a 
              href={candidate.resume.file_url} 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <FileText className="mr-2 h-5 w-5" />
              View Resume
            </a>
          ) : (
            <p className="text-gray-500">No resume file available</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
    </div>
  );
} 