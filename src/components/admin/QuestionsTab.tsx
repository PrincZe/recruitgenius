'use client';

import Link from 'next/link';
import { Question } from '@/lib/models/types';

export function QuestionsTab({ 
  questions, 
  setQuestions 
}: { 
  questions: Question[],
  setQuestions: (questions: Question[]) => void
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Interview Questions</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {questions.map((question) => (
          <div key={question.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{question.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {question.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                      {question.category}
                    </span>
                  )}
                  Added on {new Date(question.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Link 
                href={`/admin/questions/${question.id}`}
                className="text-blue-600 hover:text-blue-900 text-sm flex items-center"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 