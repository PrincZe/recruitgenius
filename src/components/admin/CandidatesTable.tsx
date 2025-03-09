'use client';

import React, { useState } from 'react';
import { ChevronDown, FileText, Edit, Eye, Mic, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Candidate {
  id: string;
  candidate?: {
    id: string;
    name: string;
    email: string;
  };
  resume?: {
    file_url: string;
    file_name: string;
    candidate_name?: string;
    candidate_email?: string;
  };
  overall_score: number;
  selected_for_interview: boolean;
  status?: string;
  analysis_json?: any;
  interview_date?: string;
  keywords?: string[];
  remarks?: string;
  created_at: string;
}

interface CandidatesTableProps {
  candidates: Candidate[];
  selectedCandidates: string[];
  onSelectCandidate: (id: string) => void;
  onSelectAll: () => void;
  onStatusChange: (id: string, status: string) => void;
  onSaveRemarks?: (id: string, remarks: string) => void;
  onGenerateInterviewLinks: () => void;
  isGeneratingLinks: boolean;
}

export default function CandidatesTable({
  candidates,
  selectedCandidates,
  onSelectCandidate,
  onSelectAll,
  onStatusChange,
  onSaveRemarks,
  onGenerateInterviewLinks,
  isGeneratingLinks
}: CandidatesTableProps) {
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [savingRemarks, setSavingRemarks] = useState<Record<string, boolean>>({});
  
  const handleRemarksChange = (id: string, value: string) => {
    setRemarks(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getScoreClass = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-teal-100 text-teal-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSentimentClass = (sentiment?: string) => {
    if (!sentiment) return '';
    switch (sentiment.toLowerCase()) {
      case 'very positive':
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800';
      case 'negative':
      case 'very negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const saveRemarks = async (id: string, value: string) => {
    if (value === candidates.find(c => c.id === id)?.remarks) return;
    
    setSavingRemarks(prev => ({ ...prev, [id]: true }));
    
    try {
      const response = await fetch('/api/resume-evaluations/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, remarks: value }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save remarks');
      }
      
      if (onSaveRemarks) {
        onSaveRemarks(id, value);
      }
    } catch (error) {
      console.error('Error saving remarks:', error);
    } finally {
      setSavingRemarks(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold">Candidate Rankings</h2>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center hover:bg-gray-200"
          >
            <span>Filter</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>
          <button
            onClick={onGenerateInterviewLinks}
            disabled={selectedCandidates.length === 0 || isGeneratingLinks}
            className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isGeneratingLinks ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                <span>Send to Voice Interview</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-500 border-gray-300 rounded"
                  checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                  onChange={onSelectAll}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Candidate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interview Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skills Assessment
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                AI Summary
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                  No candidates found. Upload resumes to get started.
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <tr 
                  key={candidate.id} 
                  className={selectedCandidates.includes(candidate.id) ? 'bg-blue-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-500 border-gray-300 rounded"
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={() => onSelectCandidate(candidate.id)}
                      disabled={candidate.selected_for_interview}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-200 rounded-full">
                        <span className="text-gray-600 font-medium">
                          {(candidate.resume?.candidate_name ? 
                            candidate.resume.candidate_name.charAt(0) : 
                            candidate.candidate?.name ? 
                              candidate.candidate.name.charAt(0) : 
                              '?'
                          ).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.resume?.candidate_name || candidate.candidate?.name || 'Unknown Candidate'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {candidate.resume?.candidate_email || candidate.candidate?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(candidate.interview_date || candidate.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreClass(candidate.overall_score * 20)}`}>
                      {(candidate.overall_score * 20).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {candidate.analysis_json?.skillsMatched ? (
                        <div className="flex flex-wrap gap-1">
                          {candidate.analysis_json.skillsMatched.slice(0, 3).map((skill: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {skill}
                            </span>
                          ))}
                          {candidate.analysis_json.skillsMatched.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{candidate.analysis_json.skillsMatched.length - 3}
                            </span>
                          )}
                        </div>
                      ) : candidate.keywords ? (
                        <div className="flex flex-wrap gap-1">
                          {candidate.keywords.slice(0, 3).map((keyword, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {keyword}
                            </span>
                          ))}
                          {candidate.keywords.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{candidate.keywords.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No skills data</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 max-w-md overflow-hidden">
                      {candidate.analysis_json?.analysis || candidate.analysis_json?.summary || 'No summary available'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      value={candidate.status || 'pending'}
                      onChange={(e) => onStatusChange(candidate.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="shortlisted">Shortlist</option>
                      <option value="hold">Hold</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link 
                        href={`/admin/candidates/${candidate.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      {candidate.resume?.file_url && (
                        <a 
                          href={candidate.resume.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FileText className="h-5 w-5" />
                        </a>
                      )}
                      {candidate.selected_for_interview && (
                        <span className="text-green-600">
                          <CheckCircle className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 w-full max-w-xs"
                      placeholder="Add notes..."
                      value={remarks[candidate.id] || candidate.remarks || ''}
                      onChange={(e) => handleRemarksChange(candidate.id, e.target.value)}
                      onBlur={() => {
                        if (remarks[candidate.id] !== candidate.remarks) {
                          saveRemarks(candidate.id, remarks[candidate.id] || '');
                        }
                      }}
                      disabled={savingRemarks[candidate.id]}
                    />
                    {savingRemarks[candidate.id] && (
                      <span className="ml-2 text-xs text-gray-500">Saving...</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 