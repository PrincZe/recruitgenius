'use client';

import Link from 'next/link';
import { useUser } from '@/lib/contexts/UserContext';
import { LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isLoading } = useUser();

  if (isLoading || !user) return null;

  const adminLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/screening', label: 'Resume Screening' },
    { href: '/admin/candidates', label: 'Candidates' },
  ];

  return (
    <nav className="bg-white shadow-md border-b sticky top-0 z-50 transition-shadow duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                RecruitGenius
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {user.role === 'admin' ? (
                adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-150"
                  >
                    {link.label}
                  </Link>
                ))
              ) : (
                <Link
                  href="/interview"
                  className="border-transparent text-gray-600 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-150"
                >
                  Interview
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="bg-blue-50 p-1.5 rounded-full mr-2">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-gray-700 mr-4">
                {user.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 