'use client';

import React, { useState } from 'react';
import { ChevronDown, FileText, Edit, Eye, Mic, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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
                Resume Submitted Date
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
              currentCandidates.map((candidate) => (
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
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3 flex items-center justify-center">
                        {(candidate.resume?.file_name?.charAt(0) || 'C').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">
                          {candidate.resume?.file_name?.replace('.pdf', '') || 'Unknown Candidate'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Uploaded: {formatDate(candidate.created_at)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(candidate.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreClass(candidate.overall_score)}`}>
                      {typeof candidate.overall_score === 'number' && !isNaN(candidate.overall_score) ? 
                        `${Math.min(Math.max(Math.round(candidate.overall_score), 0), 100)}%` : 
                        'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {candidate.analysis_json?.matchedSkills?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {candidate.analysis_json.matchedSkills.slice(0, 3).map((skill: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {skill}
                            </span>
                          ))}
                          {candidate.analysis_json.matchedSkills.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{candidate.analysis_json.matchedSkills.length - 3}
                            </span>
                          )}
                        </div>
                      ) : candidate.analysis_json?.skillsMatched?.length > 0 ? (
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
                      ) : candidate.analysis_json?.analysis?.matchedSkills?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {candidate.analysis_json.analysis.matchedSkills.slice(0, 3).map((skill: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {skill}
                            </span>
                          ))}
                          {candidate.analysis_json.analysis.matchedSkills.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{candidate.analysis_json.analysis.matchedSkills.length - 3}
                            </span>
                          )}
                        </div>
                      ) : candidate.analysis_json?.recommendedSkills?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {candidate.analysis_json.recommendedSkills.slice(0, 3).map((skill: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {skill}
                            </span>
                          ))}
                          {candidate.analysis_json.recommendedSkills.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{candidate.analysis_json.recommendedSkills.length - 3}
                            </span>
                          )}
                        </div>
                      ) : candidate.keywords && candidate.keywords.length > 0 ? (
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
                    <p className="text-sm text-gray-900 max-w-xs truncate">
                      {typeof candidate.analysis_json?.analysis === 'string' ? 
                        candidate.analysis_json.analysis : 
                       typeof candidate.analysis_json?.summary === 'string' ? 
                        candidate.analysis_json.summary : 
                       candidate.analysis_json?.analysis?.summary ? 
                        candidate.analysis_json.analysis.summary :
                       'No summary available'}
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
      
      {/* Pagination controls */}
      {candidates.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstCandidate + 1}</span> to <span className="font-medium">
                  {Math.min(indexOfLastCandidate, candidates.length)}
                </span> of <span className="font-medium">{candidates.length}</span> candidates
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show first, last, current and adjacent pages
                  let pageNum;
                  if (totalPages <= 5) {
                    // Show all pages if 5 or fewer
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    // At the beginning
                    if (i < 4) {
                      pageNum = i + 1;
                    } else {
                      pageNum = totalPages;
                    }
                  } else if (currentPage >= totalPages - 2) {
                    // At the end
                    if (i === 0) {
                      pageNum = 1;
                    } else {
                      pageNum = totalPages - 4 + i;
                    }
                  } else {
                    // In the middle
                    if (i === 0) {
                      pageNum = 1;
                    } else if (i === 4) {
                      pageNum = totalPages;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                  }
                  
                  // If we're not showing consecutive pages, add an ellipsis
                  if (i === 0 && pageNum !== 1) {
                    return (
                      <React.Fragment key={`page-${pageNum}`}>
                        <button
                          onClick={() => goToPage(1)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === 1 ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          1
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      </React.Fragment>
                    );
                  }
                  
                  if (i === 4 && pageNum !== totalPages) {
                    return (
                      <React.Fragment key={`page-${pageNum}`}>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                        <button
                          onClick={() => goToPage(totalPages)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === totalPages ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </React.Fragment>
                    );
                  }
                  
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => goToPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === pageNum ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 