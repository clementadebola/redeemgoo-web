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
}

interface AuthState {
  setUser: (user: User | null) => void; // Explicitly typed setter
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

  // ✅ FIXED: Implemented the missing action setter method
  setUser: (user) => set({ user }),

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await get().fetchProfile(user.uid);
      }
      set({ user, isInitialized: true });
    });
    return unsubscribe;
  },

  fetchProfile: async (uid: string) => {
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
      };

      await setDoc(doc(db, 'users', cred.user.uid), profile);
      set({ user: cred.user, profile, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  signIn: async (email, password) => {
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
    set({ isLoading: true });
    await signOut(auth);
    set({ user: null, profile: null, isLoading: false });
  },

  clearError: () => set({ error: null }),
}));

export { auth, db };