import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  username: string;
  photoURL?: string;
  savedPlaces?: string[];
  createdAt?: string;
  tripsCount?: number;
  rating?: string | number;
  // ✅ NEW: Location tracking state properties
  locationEnabled?: boolean;
  locationPrompted?: boolean;
}

interface AuthState {
  setUser: (user: User | null) => void;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => () => void;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  fetchProfile: (uid: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  setUser: (user) => set({ user }),

  initialize: () => {
    // ✅ SSR GUARD: Do absolutely nothing if evaluated on the server side
    if (typeof window === "undefined" || !auth) return () => {};

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await get().fetchProfile(user.uid);
      }
      set({ user, isInitialized: true });
    });
    return unsubscribe;
  },

  fetchProfile: async (uid: string) => {
    if (typeof window === "undefined" || !db) return;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ profile: docSnap.data() as UserProfile });
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e);
    }
  },

  signUp: async (email, password, fullName, username) => {
    if (!auth || !db) throw new Error("Firebase services are uninitialized.");
    set({ isLoading: true, error: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });

      const profile: UserProfile = {
        uid: cred.user.uid,
        displayName: fullName,
        email,
        username: username.toLowerCase(),
        savedPlaces: [],
        createdAt: new Date().toISOString(),
        // ✅ NEW: Initialize these as false for brand new users
        locationEnabled: false,
        locationPrompted: false,
      };

      await setDoc(doc(db, 'users', cred.user.uid), profile);
      set({ user: cred.user, profile, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  signIn: async (email, password) => {
    if (!auth) throw new Error("Firebase Auth is uninitialized.");
    set({ isLoading: true, error: null });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await get().fetchProfile(cred.user.uid);
      set({ user: cred.user, isLoading: false });
    } catch (e: any) {
      const msg =
        e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : e.message;
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    if (!auth) return;
    set({ isLoading: true });
    await signOut(auth);
    set({ user: null, profile: null, isLoading: false });
  },

  clearError: () => set({ error: null }),
}));

// ❌ FIXED: Removed the direct primitive re-exports that were breaking the client hydration tree!