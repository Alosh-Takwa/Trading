/**
 * Google Workspace / Firebase Authentication Service
 * Implements persistent connection via IndexedDB session caching,
 * in-memory active access token management, and explicit user-gesture popups only.
 * No unauthorized background popup attempts.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// In-memory user session
let cachedUser: User | null = null;
let isSigningIn = false;

// IndexedDB configuration for persistent auth session across page reloads
const AUTH_IDB_NAME = 'sinotrack_auth_db';
const AUTH_IDB_STORE = 'app_session';
const AUTH_IDB_KEY = 'user_session';

interface StoredAuthSession {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}

function openAuthDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(AUTH_IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(AUTH_IDB_STORE)) {
        db.createObjectStore(AUTH_IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveStoredSession(session: StoredAuthSession): Promise<void> {
  try {
    const db = await openAuthDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(AUTH_IDB_STORE, 'readwrite');
      const store = tx.objectStore(AUTH_IDB_STORE);
      const req = store.put(session, AUTH_IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save auth session to IndexedDB:', err);
  }
}

async function loadStoredSession(): Promise<StoredAuthSession | null> {
  try {
    const db = await openAuthDB();
    return await new Promise<StoredAuthSession | null>((resolve) => {
      const tx = db.transaction(AUTH_IDB_STORE, 'readonly');
      const store = tx.objectStore(AUTH_IDB_STORE);
      const req = store.get(AUTH_IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function clearStoredSession(): Promise<void> {
  try {
    const db = await openAuthDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(AUTH_IDB_STORE, 'readwrite');
      const store = tx.objectStore(AUTH_IDB_STORE);
      const req = store.delete(AUTH_IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

export const invalidateToken = async (): Promise<void> => {
  cachedUser = null;
  await clearStoredSession();
};

/**
 * Initializes Firebase authentication listener on app load
 */
export const initAuth = (
  onAuthSuccess?: (user: User) => void,
  onAuthFailure?: () => void
) => {
  // Listen to Firebase auth state changes
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      cachedUser = user;
      saveStoredSession({
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid,
      });
      if (onAuthSuccess) {
        onAuthSuccess(user);
      }
    } else {
      cachedUser = null;
      await clearStoredSession();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Triggers interactive Google sign in popup strictly from a user click
 */
export const googleSignIn = async (): Promise<{ user: User }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    saveStoredSession({
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
    });
    cachedUser = result.user;
    return { user: result.user };
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Disconnects Google session
 */
export const logoutGoogle = async (): Promise<void> => {
  await invalidateToken();
  await signOut(auth);
};
