import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check for client context safely
const isClient = typeof window !== 'undefined';

const app = isClient
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

// ✅ SAFELY ENCAPSULATED: Export wrapper execution stubs that return instances only when window initializes
export const getClientAuth = (): Auth => {
  if (!app) throw new Error("Firebase Auth accessed on server side prematurely.");
  return getAuth(app);
};

export const getClientDb = (): Firestore => {
  if (!app) throw new Error("Firebase Firestore accessed on server side prematurely.");
  return getFirestore(app);
};

// Fallbacks for direct primitive references to maintain backward compatibility safely
export const auth = isClient && app ? getAuth(app) : (null as any);
export const db = isClient && app ? getFirestore(app) : (null as any);

export default app;