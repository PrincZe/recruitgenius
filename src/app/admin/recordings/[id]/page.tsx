import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Recording, Question, Candidate } from '@/lib/models/types';
import RecordingDetailClient from './RecordingDetailClient';

// This function is required for static site generation with dynamic routes
export function generateStaticParams() {
  // For static export, we'll pre-render the demo recording page
  return [
    { id: 'demo-recording' }
  ];
}

export default function RecordingDetailPage({ params }: { params: { id: string } }) {
  return <RecordingDetailClient params={params} />;
} 