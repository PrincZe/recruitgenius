'use client';

import Link from 'next/link';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { Recording, Question, Candidate } from '@/lib/models/types';
import { useState } from 'react';

export function RecordingsTab({ 
  recordings, 
  questions, 
  candidates 
}: { 
  recordings: Recording[],
  questions: Question[],
  candidates: Candidate[]
}) {
  const [audioErrors, setAudioErrors] = useState<Record<string, boolean>>({});

  // Helper function to get question text by ID
  const getQuestionText = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    return question ? question.text : 'Unknown question';
  };
  
  // Helper function to get candidate name by ID
  const getCandidateName = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate ? candidate.name : 'Unknown candidate';
  };

  // Helper function to determine audio source display
  const getAudioElement = (recording: Recording) => {
    if (!recording.audioUrl) {
      return <span className="text-red-500">Audio not available</span>;
    }

    // Check if this recording already had an error
    if (audioErrors[recording.id]) {
      return <span className="text-red-500 flex items-center"><AlertCircle className="w-4 h-4 mr-1" /> Audio unavailable</span>;
    }

    return (
      <audio 
        src={recording.audioUrl} 
        controls 
        className="w-48"
        onError={(e) => {
          console.error('Audio playback error:', e);
          // Mark this recording as having an error
          setAudioErrors(prev => ({...prev, [recording.id]: true}));
        }}
      />
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Candidate Recordings</h2>
      </div>
      
      {recordings.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No recordings available yet.</p>
          <p className="text-sm text-gray-400 mt-2">Candidates will appear here after they complete interviews.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recording</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recordings.map((recording) => (
                <tr key={recording.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getCandidateName(recording.candidateId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {getQuestionText(recording.questionId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {getAudioElement(recording)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(recording.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link 
                      href={`/admin/recordings/${recording.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Details <ChevronRight className="inline w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 