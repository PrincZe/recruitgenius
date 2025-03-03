import { NextResponse } from "next/server";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    // Log the environment variables (without sensitive values)
    console.log("Firebase config check:", {
      apiKeyExists: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomainExists: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucketExists: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appIdExists: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
    
    // Initialize Firebase directly in this route for testing
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    // Initialize Firebase without auth
    const app = initializeApp(firebaseConfig, 'test-instance');
    const db = getFirestore(app);
    
    // Try to access Firestore
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    
    return NextResponse.json({ 
      success: true, 
      message: "Firebase Firestore connection successful",
      config: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      }
    });
  } catch (error: any) {
    console.error("Firebase connection error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Firebase connection failed",
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
} 