'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CandidateRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the interview page
    router.push('/interview');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
        <p className="mt-4 text-lg font-medium text-gray-700">Redirecting to interview...</p>
      </div>
    </div>
  );
} 