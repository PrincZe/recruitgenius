"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function SignInWithGoogle() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  return (
    <button
      onClick={() => {
        setIsLoading(true);
        // Simulate Google sign-in
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      }}
      disabled={isLoading}
      className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <div className="w-5 h-5 mr-2 relative">
            <Image
              src="/google-logo.png"
              alt="Google logo"
              fill
              sizes="20px"
              style={{ objectFit: 'contain' }}
            />
          </div>
          Sign in with Google
        </>
      )}
    </button>
  );
}
