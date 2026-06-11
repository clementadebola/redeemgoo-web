import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDlivlPmam81bJPpFzgn771Ofw8iQq8yjw",
  authDomain: "eggsy-df134.firebaseapp.com",
  projectId: "eggsy-df134",
  storageBucket: "eggsy-df134.appspot.com",
  messagingSenderId: "350355807592",
  appId: "1:350355807592:web:93517c887dbff140f30add"
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);


export default app;
