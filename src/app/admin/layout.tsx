'use client';

import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      window.location.href = '/interview';
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center mb-2">
          <div className="flex-1">
            <div className="text-sm text-gray-500 flex items-center">
              <span className="hover:text-blue-600 transition-colors duration-150">
                <Link href="/admin">Admin</Link>
              </span>
              {/* Breadcrumb would be added here dynamically based on the current route */}
            </div>
          </div>
        </div>
        <div className="transition-all duration-300">
          {children}
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            RecruitGenius &copy; {new Date().getFullYear()} - Making hiring smarter
          </p>
        </div>
      </footer>
    </div>
  );
} 