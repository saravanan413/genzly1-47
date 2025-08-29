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
import { SecurityService } from '../services/securityService';
import firebaseApp from '../config/firebase';
import { logger } from '../utils/logger';

interface EnhancedAuthContextProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  googleLogin: () => Promise<{ success: boolean; error?: string }>;
}

const EnhancedAuthContext = createContext<EnhancedAuthContextProps>({
  currentUser: null,
  userProfile: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  signInWithGoogle: async () => ({ success: false }),
  googleLogin: async () => ({ success: false }),
});

export const EnhancedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(firebaseApp);
  const googleProvider = new GoogleAuthProvider();

  // Configure Google provider with security settings
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      logger.debug('Enhanced auth state changed', { userEmail: user?.email || 'No user' });
      setCurrentUser(user);
      
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          
          // Log successful authentication
          logger.debug('User profile loaded securely', { userId: user.uid });
        } catch (error: any) {
          logger.error('Error loading user profile', error);
          setUserProfile(null);
          
          // Log potential security issue if profile can't be loaded
          if (error.code === 'permission-denied') {
            SecurityService.logSuspiciousActivity(user.uid, 'profile_load_denied');
          }
        }
      } else {
        setUserProfile(null);
        // Clear any cached sensitive data
        try {
          const { clearCachedChatList } = await import('../services/chat/chatListService');
          clearCachedChatList();
          localStorage.removeItem('rate_limit_message');
          localStorage.removeItem('rate_limit_follow');
          localStorage.removeItem('rate_limit_like');
        } catch (error) {
          logger.error('Error clearing secure cache on logout', error);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Basic input validation
      if (!email.trim() || !password.trim()) {
        return { success: false, error: 'Email and password required' };
      }

      await signInWithEmailAndPassword(auth, email, password);
      logger.debug('Secure login successful', { email });
      return { success: true };
    } catch (error: any) {
      logger.error('Login failed', error);
      
      // Log failed login attempts for security monitoring
      SecurityService.logSuspiciousActivity('unknown', 'login_failed', { email });
      
      // Return generic error to prevent information disclosure
      return { success: false, error: 'Invalid credentials' };
    }
  };

  const register = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Input validation
      if (!email.trim() || !password.trim()) {
        return { success: false, error: 'Email and password required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserDocument(user);
      
      logger.debug('Secure registration successful', { email });
      return { success: true };
    } catch (error: any) {
      logger.error('Registration failed', error);
      SecurityService.logSuspiciousActivity('unknown', 'registration_failed', { email });
      
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'Email already registered' };
      }
      
      return { success: false, error: 'Registration failed' };
    }
  };

  const signup = async (email: string, password: string, username: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Input validation
      if (!email.trim() || !password.trim() || !username.trim() || !displayName.trim()) {
        return { success: false, error: 'All fields are required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserDocument(user, username, displayName);
      
      logger.debug('Secure signup successful', { email, username });
      return { success: true };
    } catch (error: any) {
      logger.error('Signup failed', error);
      SecurityService.logSuspiciousActivity('unknown', 'signup_failed', { email, username });
      
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'Email already registered' };
      }
      
      return { success: false, error: 'Signup failed' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear chat cache before logging out
      const { clearCachedChatList } = await import('../services/chat/chatListService');
      clearCachedChatList();
      
      // Clear rate limits
      localStorage.removeItem('rate_limit_message');
      localStorage.removeItem('rate_limit_follow');
      localStorage.removeItem('rate_limit_like');
      
      await authServiceLogout();
      logger.debug('Secure logout successful');
    } catch (error) {
      logger.error('Logout failed', error);
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      logger.debug('Attempting secure Google sign-in with popup...');
      
      // First try popup
      try {
        const result = await signInWithPopup(auth, googleProvider);
        logger.debug('Google popup sign-in successful', { userEmail: result.user.email });
        await createUserDocument(result.user);
        return { success: true };
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
          return { success: true }; // Redirect will handle the rest
        }
        
        // Handle account-exists-with-different-credential
        if (error.code === 'auth/account-exists-with-different-credential') {
          return { success: false, error: 'An account with this email already exists. Please sign in with your email and password instead.' };
        }
        
        SecurityService.logSuspiciousActivity('unknown', 'google_signin_failed', { errorCode: error.code });
        return { success: false, error: 'Google sign-in failed' };
      }
    } catch (error: any) {
      logger.error('Google sign-in failed', error);
      SecurityService.logSuspiciousActivity('unknown', 'google_signin_failed', { error: error.message });
      
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
      
      return { success: false, error: errorMessage };
    }
  };

  const googleLogin = async (): Promise<{ success: boolean; error?: string }> => {
    return signInWithGoogle();
  };

  const createUserDocument = async (user: User, username?: string, displayName?: string): Promise<void> => {
    if (!user.uid) return;
    
    logger.debug('Creating secure user document', { userEmail: user.email });
    
    const fallbackName = displayName || user.displayName || user.email?.split('@')[0] || 'User';
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=eee&color=555&size=200`;
    
    const profileData: Partial<UserProfile> = {
      id: user.uid,
      email: user.email || '',
      username: username || user.email?.split('@')[0] || `user${Date.now()}`,
      displayName: fallbackName,
      avatar: user.photoURL || fallbackAvatar,
      bio: '',
      externalLink: '',
      followers: 0,
      following: 0,
      postsCount: 0,
      isPrivate: false, // Default to public
    };
    
    try {
      // Firestore rules will validate this write operation
      const success = await createOrUpdateUserProfile(user.uid, profileData);
      if (success) {
        logger.debug('Secure user document created successfully');
      } else {
        logger.error('Failed to create secure user document');
      }
    } catch (error: any) {
      logger.error('Error creating secure user document', error);
      if (error.code === 'permission-denied') {
        SecurityService.logSuspiciousActivity(user.uid, 'user_creation_denied');
      }
    }
  };

  const value: EnhancedAuthContextProps = {
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
    <EnhancedAuthContext.Provider value={value}>
      {!loading && children}
    </EnhancedAuthContext.Provider>
  );
};

export const useEnhancedAuth = () => {
  return useContext(EnhancedAuthContext);
};
