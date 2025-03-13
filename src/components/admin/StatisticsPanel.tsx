'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface StatisticsPanelProps {
  totalCandidates: number;
  completedInterviews: number;
  pendingInterviews: number;
  confidenceLevels: {
    high: number;
    medium: number;
    low: number;
  };
  weeklySubmissions: Array<{
    day: string;
    count: number;
  }>;
}

export default function StatisticsPanel({
  totalCandidates,
  completedInterviews,
  pendingInterviews,
  confidenceLevels,
  weeklySubmissions,
}: StatisticsPanelProps) {
  // Calculate percentages for confidence levels
  const totalConfidence = confidenceLevels.high + confidenceLevels.medium + confidenceLevels.low;
  const highPercent = totalConfidence > 0 ? (confidenceLevels.high / totalConfidence) * 100 : 0;
  const mediumPercent = totalConfidence > 0 ? (confidenceLevels.medium / totalConfidence) * 100 : 0;
  const lowPercent = totalConfidence > 0 ? (confidenceLevels.low / totalConfidence) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Interview Status Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
          <span className="bg-blue-50 p-1.5 rounded-full mr-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </span>
          Interview Status
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-2xl font-bold text-gray-800">{totalCandidates}</p>
            <p className="text-sm text-gray-500">Total Candidates</p>
          </div>
          <div className="p-3 rounded-lg bg-green-50">
            <p className="text-2xl font-bold text-green-600">{completedInterviews}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50">
            <p className="text-2xl font-bold text-amber-500">{pendingInterviews}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
        </div>
      </div>

      {/* Confidence Level Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
          <span className="bg-blue-50 p-1.5 rounded-full mr-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
            </svg>
          </span>
          Confidence Level Distribution
        </h2>
        
        {/* High */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium flex items-center text-gray-700">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              High (80-100%)
            </span>
            <span className="text-sm font-medium text-gray-700">{confidenceLevels.high}</span>
          </div>
          <div className="bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${highPercent}%` }}
            ></div>
          </div>
        </div>
        
        {/* Medium */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium flex items-center text-gray-700">
              <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
              Medium (60-79%)
            </span>
            <span className="text-sm font-medium text-gray-700">{confidenceLevels.medium}</span>
          </div>
          <div className="bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${mediumPercent}%` }}
            ></div>
          </div>
        </div>
        
        {/* Low */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium flex items-center text-gray-700">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Low (&lt;60%)
            </span>
            <span className="text-sm font-medium text-gray-700">{confidenceLevels.low}</span>
          </div>
          <div className="bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${lowPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Weekly Submissions Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
          <span className="bg-blue-50 p-1.5 rounded-full mr-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </span>
          Weekly Submissions
        </h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklySubmissions}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 