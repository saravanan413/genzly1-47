import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User,
  AuthError
} from 'firebase/auth';
import { createOrUpdateUserProfile, getUserProfile, UserProfile } from '../services/firestoreService';
import { logout as authServiceLogout } from '../services/authService';
import firebaseApp from '../config/firebase';
import { logger } from '../utils/logger';

interface AuthContextProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  googleLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  userProfile: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  signup: async () => {},
  logout: async () => {},
  signInWithGoogle: async () => {},
  googleLogin: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(firebaseApp);
  const googleProvider = new GoogleAuthProvider();

  // Configure Google provider with proper scopes and parameters
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      logger.debug('Auth state changed', { userEmail: user?.email || 'No user' });
      setCurrentUser(user);
      
      if (user) {
        // Load user profile
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          logger.error('Error loading user profile', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        // Clear chat cache when user logs out
        try {
          const { clearCachedChatList } = await import('../services/chat/chatListService');
          clearCachedChatList();
        } catch (error) {
          logger.error('Error clearing chat cache on logout', error);
        }
      }
      
      setLoading(false);
    });

    // Check for redirect result on app load
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          logger.debug('Google redirect sign-in successful', { userEmail: result.user.email });
          await createUserDocument(result.user);
        }
      } catch (error) {
        logger.error('Google redirect error', error);
        // Handle redirect errors silently as they might be from previous sessions
      }
    };

    checkRedirectResult();
    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserDocument(user);
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, username: string, displayName: string): Promise<void> => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserDocument(user, username, displayName);
    } catch (error) {
      logger.error('Signup failed', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear chat cache before logging out
      const { clearCachedChatList } = await import('../services/chat/chatListService');
      clearCachedChatList();
      
      await authServiceLogout();
    } catch (error) {
      logger.error('Logout failed', error);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      logger.debug('Attempting Google sign-in with popup...');
      
      // First try popup
      try {
        const result = await signInWithPopup(auth, googleProvider);
        logger.debug('Google popup sign-in successful', { userEmail: result.user.email });
        await createUserDocument(result.user);
        return;
      } catch (popupError) {
        const error = popupError as AuthError;
        logger.debug('Popup failed, trying redirect...', { errorCode: error.code });
        
        // If popup is blocked or fails, try redirect
        if (
          error.code === 'auth/popup-blocked' ||
          error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request'
        ) {
          logger.debug('Using redirect method...');
          await signInWithRedirect(auth, googleProvider);
          return; // Redirect will handle the rest
        }
        
        // Handle account-exists-with-different-credential
        if (error.code === 'auth/account-exists-with-different-credential') {
          throw new Error('An account with this email already exists. Please sign in with your email and password instead.');
        }
        
        throw popupError;
      }
    } catch (error) {
      logger.error('Google sign-in failed', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in was cancelled. Please try again.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account with this email already exists. Please sign in with your email and password.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google sign-in is not enabled. Please contact support.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        default:
          errorMessage = authError.message || 'Google sign-in failed. Please try again.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const googleLogin = async (): Promise<void> => {
    return signInWithGoogle();
  };

  const createUserDocument = async (user: User, username?: string, displayName?: string): Promise<void> => {
    if (!user.uid) return;
    
    logger.debug('Creating/updating user document', { userEmail: user.email });
    
    // Generate fallback avatar URL
    const fallbackName = displayName || user.displayName || user.email?.split('@')[0] || 'User';
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=eee&color=555&size=200`;
    
    // Create user document with required structure
    const profileData: Partial<UserProfile> = {
      id: user.uid,
      email: user.email || '',
      username: username || user.email?.split('@')[0] || `user${Date.now()}`,
      displayName: displayName || user.displayName || user.email?.split('@')[0] || 'User',
      avatar: user.photoURL || fallbackAvatar,
      bio: '',
      externalLink: '',
      followers: 0,
      following: 0,
      postsCount: 0
    };
    
    try {
      const success = await createOrUpdateUserProfile(user.uid, profileData);
      if (success) {
        logger.debug('User document created/updated successfully');
      } else {
        logger.error('Failed to create/update user document');
      }
    } catch (error) {
      logger.error('Error creating/updating user document', error);
    }
  };

  const value: AuthContextProps = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    signup,
    logout,
    signInWithGoogle,
    googleLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
