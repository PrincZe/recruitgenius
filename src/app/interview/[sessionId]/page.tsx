import { Suspense } from 'react';
import InterviewQuestionsClient from './InterviewQuestionsClient';

// This function is required for static site generation with dynamic routes
export function generateStaticParams() {
  // For static export, we'll pre-render the demo session page
  return [
    { sessionId: 'demo-session' }
  ];
}

export default function InterviewQuestionsPage({ params }: { params: { sessionId: string } }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <InterviewQuestionsClient params={params} />
    </Suspense>
  );
} 