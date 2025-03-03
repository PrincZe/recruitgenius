'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function TestFirebasePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Record<string, number>>({});

  useEffect(() => {
    async function testFirebase() {
      try {
        if (!db) {
          throw new Error('Firestore instance is not initialized');
        }

        const collectionNames = ['questions', 'candidates', 'recordings', 'sessions'];
        const results: Record<string, number> = {};

        for (const collectionName of collectionNames) {
          try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            results[collectionName] = querySnapshot.size;
          } catch (err) {
            console.error(`Error accessing collection ${collectionName}:`, err);
            results[collectionName] = -1; // Error indicator
          }
        }

        setCollections(results);
        setStatus('success');
      } catch (err: any) {
        console.error('Firebase test error:', err);
        setError(err.message || 'Unknown error');
        setStatus('error');
      }
    }

    testFirebase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Firebase Connection Test</h1>
        
        {status === 'loading' && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Testing connection...</span>
          </div>
        )}
        
        {status === 'error' && (
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <h2 className="text-lg font-medium text-red-800 mb-2">Connection Error</h2>
            <p className="text-red-700">{error}</p>
            <div className="mt-4 p-3 bg-gray-100 rounded-md overflow-auto">
              <p className="text-sm font-mono">
                Check your .env.local file and make sure all Firebase environment variables are set correctly.
              </p>
            </div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <h2 className="text-lg font-medium text-green-800 mb-2">Connection Successful!</h2>
            <p className="text-green-700 mb-4">Your Firebase connection is working correctly.</p>
            
            <h3 className="font-medium text-gray-700 mb-2">Collections:</h3>
            <ul className="space-y-2">
              {Object.entries(collections).map(([name, count]) => (
                <li key={name} className="flex justify-between p-2 bg-white rounded border border-gray-200">
                  <span className="font-medium">{name}</span>
                  <span className={count >= 0 ? "text-green-600" : "text-red-600"}>
                    {count >= 0 ? `${count} documents` : "Error accessing"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-6">
          <a 
            href="/"
            className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
} 