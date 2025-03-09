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
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Interview Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalCandidates}</p>
            <p className="text-sm text-gray-500">Total Candidates</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{completedInterviews}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">{pendingInterviews}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
        </div>
      </div>

      {/* Confidence Level Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Confidence Level Distribution</h2>
        
        {/* High */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">High (80-100%)</span>
            <span className="text-sm font-medium text-gray-700">{confidenceLevels.high}</span>
          </div>
          <div className="bg-gray-200 h-2.5 rounded-full">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${highPercent}%` }}
            ></div>
          </div>
        </div>
        
        {/* Medium */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Medium (60-79%)</span>
            <span className="text-sm font-medium text-gray-700">{confidenceLevels.medium}</span>
          </div>
          <div className="bg-gray-200 h-2.5 rounded-full">
            <div 
              className="bg-yellow-500 h-2.5 rounded-full" 
              style={{ width: `${mediumPercent}%` }}
            ></div>
          </div>
        </div>
        
        {/* Low */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Low (&lt;60%)</span>
            <span className="text-sm font-medium text-gray-700">{confidenceLevels.low}</span>
          </div>
          <div className="bg-gray-200 h-2.5 rounded-full">
            <div 
              className="bg-red-500 h-2.5 rounded-full" 
              style={{ width: `${lowPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Weekly Submissions Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Weekly Submissions</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklySubmissions}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 