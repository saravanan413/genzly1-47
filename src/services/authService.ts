
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { logger } from '../utils/logger';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  username: string;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  posts: number;
  createdAt: any;
  lastActive: any;
  isOnline?: boolean;
}

// Create or update user document in Firestore with enhanced error handling
export const createOrUpdateUserDocument = async (user: User, additionalData: Partial<UserProfile> = {}) => {
  if (!user || !user.uid) {
    throw new Error('Invalid user object provided');
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    
    logger.debug(`Checking if user document exists for: ${user.email}`);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      logger.debug(`Creating new user document for: ${user.email}`);
      
      // Create new user document with all required fields
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || additionalData.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || undefined,
        username: additionalData.username || user.email?.split('@')[0] || `user${Date.now()}`,
        bio: additionalData.bio || '',
        avatar: user.photoURL || additionalData.avatar || '',
        followers: 0,
        following: 0,
        posts: 0,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        ...additionalData
      };
      
      await setDoc(userDocRef, userProfile);
      logger.debug(`User document created successfully for: ${user.email}`);
      
      // Return the created profile with current timestamp
      return {
        ...userProfile,
        createdAt: new Date(),
        lastActive: new Date()
      };
    } else {
      logger.debug(`User document exists, updating last active for: ${user.email}`);
      
      // Update existing user's last active time and ensure all required fields exist
      const existingData = userDoc.data() as UserProfile;
      const updateData: any = {
        lastActive: serverTimestamp(),
      };

      // Ensure all required fields exist with defaults
      if (!existingData.bio && existingData.bio !== '') updateData.bio = '';
      if (!existingData.avatar && existingData.avatar !== '') updateData.avatar = user.photoURL || '';
      if (typeof existingData.followers !== 'number') updateData.followers = 0;
      if (typeof existingData.following !== 'number') updateData.following = 0;
      if (typeof existingData.posts !== 'number') updateData.posts = 0;
      if (!existingData.username) updateData.username = user.email?.split('@')[0] || `user${Date.now()}`;
      if (!existingData.displayName) updateData.displayName = user.displayName || user.email?.split('@')[0] || 'User';
      
      // Update profile photo if changed
      if (user.photoURL && user.photoURL !== existingData.photoURL) {
        updateData.photoURL = user.photoURL;
        updateData.avatar = user.photoURL;
      }
      if (user.displayName && user.displayName !== existingData.displayName) {
        updateData.displayName = user.displayName;
      }

      await setDoc(userDocRef, updateData, { merge: true });
      
      return { ...existingData, ...updateData } as UserProfile;
    }
  } catch (error) {
    logger.error(`Error creating/updating user document for ${user.email}:`, error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, username: string, displayName: string) => {
  try {
    logger.debug(`Creating account for: ${email}`);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    logger.debug(`Account created, creating profile for: ${email}`);
    const profile = await createOrUpdateUserDocument(user, { username, displayName });
    
    return { user, profile };
  } catch (error) {
    logger.error('Error signing up:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    logger.debug(`Signing in: ${email}`);
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    logger.debug(`Sign in successful, ensuring profile exists for: ${email}`);
    await createOrUpdateUserDocument(result.user);
    
    return result;
  } catch (error) {
    logger.error('Error signing in:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    logger.debug('Attempting Google sign-in...');
    
    // Clear any cached auth state
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    logger.debug(`Google sign-in successful: ${user.email}`);
    
    // Create or update user profile with all required fields
    const profile = await createOrUpdateUserDocument(user);
    logger.debug(`User profile created/updated: ${profile?.username}`);
    
    return { user, profile };
  } catch (error: any) {
    logger.error('Google sign-in error:', error);
    
    // Provide more specific error messages
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in request was cancelled. Please try again.');
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with this email. Please try signing in with your email and password.');
    } else {
      throw new Error(error.message || 'Google sign-in failed. Please try again.');
    }
  }
};

export const logout = async () => {
  try {
    const currentUser = auth.currentUser;
    
    // Update user status to offline before signing out
    if (currentUser) {
      logger.debug(`Setting user offline status for: ${currentUser.email}`);
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          isOnline: false,
          lastActive: serverTimestamp()
        });
      } catch (firestoreError) {
        logger.error('Error updating user status during logout:', firestoreError);
        // Continue with logout even if Firestore update fails
      }
    }
    
    // Clear any local storage data
    localStorage.removeItem('dataSaverEnabled');
    localStorage.removeItem('theme');
    
    // Sign out from Firebase
    await signOut(auth);
    logger.debug('User signed out successfully');
    
  } catch (error) {
    logger.error('Error signing out:', error);
    throw error;
  }
};

export const updateLastActive = async (userId: string) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    logger.error('Error updating last active:', error);
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    logger.debug(`Getting user profile for: ${userId}`);
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const profile = userDoc.data() as UserProfile;
      logger.debug(`User profile found: ${profile.username}`);
      return profile;
    } else {
      logger.debug(`No user profile found for: ${userId}`);
      return null;
    }
  } catch (error) {
    logger.error('Error getting user profile:', error);
    return null;
  }
};
