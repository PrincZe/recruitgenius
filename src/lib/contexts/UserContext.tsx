'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'admin';
  loggedIn: boolean;
}

interface UserContextType {
  user: User | null;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // Handle redirects based on auth state
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ['/', '/login'];
      const isPublicPath = publicPaths.includes(pathname);
      
      if (!user && !isPublicPath) {
        window.location.href = '/';
      }
    }
  }, [user, isLoading, pathname]);

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <UserContext.Provider value={{ user, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 