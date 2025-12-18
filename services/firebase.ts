
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isOfflineMode = false;

const firebaseConfigStr = process.env.FIREBASE_CONFIG;

try {
  if (firebaseConfigStr && firebaseConfigStr !== '') {
    const config = JSON.parse(firebaseConfigStr);
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn("Firebase configuration not found. Entering offline/demo mode.");
    isOfflineMode = true;
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  isOfflineMode = true;
}

export { auth, db, isOfflineMode };
