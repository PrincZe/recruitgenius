'use client';

import React, { useState } from 'react';
import { ChevronDown, FileText, Edit, Eye, Mic, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Loader2, User } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const candidatesPerPage = 5;
  
  // Calculate pagination
  const indexOfLastCandidate = currentPage * candidatesPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
  const currentCandidates = candidates.slice(indexOfFirstCandidate, indexOfLastCandidate);
  const totalPages = Math.ceil(candidates.length / candidatesPerPage);
  
  // Page change handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };
  
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
    const normalizedScore = typeof score === 'number' && !isNaN(score) ? 
      Math.min(Math.max(score, 0), 100) : 0;
      
    if (normalizedScore >= 80) return 'bg-green-100 text-green-800';
    if (normalizedScore >= 60) return 'bg-blue-100 text-blue-800';
    if (normalizedScore >= 40) return 'bg-yellow-100 text-yellow-800';
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

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                    onChange={onSelectAll}
                  />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  Resume File
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  Resume Submitted Date
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  Overall Score
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remarks
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentCandidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500 text-sm">
                  No candidates found
                </td>
              </tr>
            ) : (
              currentCandidates.map((candidate) => (
                <tr 
                  key={candidate.id} 
                  className="hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={() => onSelectCandidate(candidate.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {candidate.resume?.file_name || 'No file'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                          className={`h-2.5 rounded-full ${getConfidenceColor(candidate.overall_score)}`}
                          style={{ width: `${candidate.overall_score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {candidate.overall_score ? `${candidate.overall_score}%` : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={candidate.status || 'new'}
                      onChange={(e) => onStatusChange(candidate.id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      <input
                        type="text"
                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add remarks..."
                        value={remarks[candidate.id] || candidate.remarks || ''}
                        onChange={(e) => {
                          setRemarks({
                            ...remarks,
                            [candidate.id]: e.target.value
                          });
                        }}
                        onBlur={() => {
                          if (onSaveRemarks && remarks[candidate.id] !== undefined) {
                            setSavingRemarks({...savingRemarks, [candidate.id]: true});
                            onSaveRemarks(candidate.id, remarks[candidate.id]);
                            setTimeout(() => {
                              setSavingRemarks({...savingRemarks, [candidate.id]: false});
                            }, 1000);
                          }
                        }}
                      />
                      {savingRemarks[candidate.id] && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {candidate.resume?.file_url && (
                        <a
                          href={candidate.resume.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                        >
                          <FileText className="h-5 w-5" />
                        </a>
                      )}
                      <button
                        onClick={() => onSelectCandidate(candidate.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => window.location.href = `/admin/candidates/${candidate.id}`}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstCandidate + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastCandidate, candidates.length)}
                </span>{" "}
                of <span className="font-medium">{candidates.length}</span> candidates
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              
              <div className="hidden md:flex">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === i + 1
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Button */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <button
          onClick={onGenerateInterviewLinks}
          disabled={selectedCandidates.length === 0 || isGeneratingLinks}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            selectedCandidates.length === 0 || isGeneratingLinks
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isGeneratingLinks ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Generating Interview Links...
            </>
          ) : (
            "Generate Interview Links"
          )}
        </button>
      </div>
    </div>
  );
} 