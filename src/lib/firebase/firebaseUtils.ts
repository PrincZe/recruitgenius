import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  CollectionReference,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Check if Firebase is initialized
const isFirebaseInitialized = () => {
  if (!auth || !db || !storage) {
    console.error("Firebase services are not initialized. Check your environment variables.");
    return false;
  }
  return true;
};

// Auth functions
export const logoutUser = () => {
  if (!auth) {
    console.error("Auth service is not initialized");
    return Promise.reject(new Error("Auth service is not initialized"));
  }
  return signOut(auth);
};

export const signInWithGoogle = async () => {
  if (!auth) {
    console.error("Auth service is not initialized");
    throw new Error("Auth service is not initialized");
  }
  
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) => {
  if (!db) {
    console.error("Firestore is not initialized");
    return Promise.reject(new Error("Firestore is not initialized"));
  }
  return addDoc(collection(db, collectionName), data);
};

export const getDocuments = async (collectionName: string) => {
  if (!db) {
    console.error("Firestore is not initialized");
    throw new Error("Firestore is not initialized");
  }
  
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) => {
  if (!db) {
    console.error("Firestore is not initialized");
    return Promise.reject(new Error("Firestore is not initialized"));
  }
  return updateDoc(doc(db, collectionName, id), data);
};

export const deleteDocument = (collectionName: string, id: string) => {
  if (!db) {
    console.error("Firestore is not initialized");
    return Promise.reject(new Error("Firestore is not initialized"));
  }
  return deleteDoc(doc(db, collectionName, id));
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  if (!storage) {
    console.error("Storage service is not initialized");
    throw new Error("Storage service is not initialized");
  }
  
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
