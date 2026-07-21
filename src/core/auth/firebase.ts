import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';
import { logger } from '../../shared/utils/logger';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

/**
 * Authenticates user anonymously in Firebase Auth or with credentials
 */
export const authenticateWithFirebase = async (): Promise<FirebaseUser | null> => {
  try {
    if (auth.currentUser) {
      return auth.currentUser;
    }
    const userCredential = await signInAnonymously(auth);
    logger.info('FirebaseAuth', 'Signed in anonymously to Firebase Auth', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    logger.error('FirebaseAuth', 'Firebase authentication failed', error);
    return null;
  }
};

/**
 * Sign out from Firebase Auth
 */
export const logoutFirebase = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    logger.info('FirebaseAuth', 'User signed out from Firebase Auth');
  } catch (error) {
    logger.error('FirebaseAuth', 'Logout failed', error);
  }
};

export { onAuthStateChanged };
