import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfig from '../../../firebase-applet-config.json';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);

  // Initialize Firestore with custom firestoreDatabaseId if configured
  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    db = getFirestore(app);
  }

  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase initialization in fallback mode:', error);
  // Create minimal fallback objects for test/offline environments
  app = (getApps().length ? getApp() : null) as unknown as FirebaseApp;
  auth = {} as unknown as Auth;
  db = {} as unknown as Firestore;
  storage = {} as unknown as FirebaseStorage;
}

export { app, auth, db, storage, GoogleAuthProvider };

// Health check connection test on application startup as required by the Firebase Integration Skill
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db || typeof db.type !== 'string' && !('app' in db)) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, working in local mode.');
    }
    return false;
  }
}
