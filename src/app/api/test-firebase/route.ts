import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    // Check if Firestore is initialized
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        message: "Firebase connection failed",
        error: "Firestore not initialized"
      }, { status: 500 });
    }
    
    // Try to get the collections
    const collections = ['questions', 'candidates', 'recordings', 'sessions'];
    const results: Record<string, { exists: boolean; count: number }> = {};
    
    for (const collectionName of collections) {
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        results[collectionName] = {
          exists: true,
          count: querySnapshot.size
        };
      } catch (err) {
        console.error(`Error accessing collection ${collectionName}:`, err);
        results[collectionName] = {
          exists: false,
          count: 0
        };
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Firebase connection successful",
      collections: results
    });
  } catch (error: any) {
    console.error("Firebase connection error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Firebase connection failed",
      error: error.message
    }, { status: 500 });
  }
} 