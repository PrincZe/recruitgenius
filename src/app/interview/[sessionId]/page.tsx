import InterviewQuestionsClient from './InterviewQuestionsClient';

// This function is required for static site generation with dynamic routes
export function generateStaticParams() {
  // For static export, we'll pre-render the demo session page
  return [
    { sessionId: 'demo-session' }
  ];
}

export default function InterviewQuestionsPage({ params }: { params: { sessionId: string } }) {
  return <InterviewQuestionsClient params={params} />;
} 