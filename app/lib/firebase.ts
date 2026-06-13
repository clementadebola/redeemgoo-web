import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Ensure we are inside a client browser context before spinning up the engine
const app = typeof window !== 'undefined'
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

// ✅ SAFELY EXTRACTED: Provide placeholder stubs for SSR compilation that instantly swap to real engines in the browser
export const auth = app ? getAuth(app) : (null as any);
export const db = app ? getFirestore(app) : (null as any);

export default app;