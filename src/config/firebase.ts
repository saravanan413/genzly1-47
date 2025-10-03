
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZK3qtN0QDIp58ydNU9EZKnEQElOq0YtY",
  authDomain: "genzly.firebaseapp.com",
  projectId: "genzly",
  storageBucket: "genzly.appspot.com",
  messagingSenderId: "258142953440",
  appId: "1:258142953440:web:adb42fbb7a297ecfb21585",
  measurementId: "G-LXY0MPSTLT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check for security (prevents unauthorized access)
if (typeof window !== 'undefined') {
  // Allow all Lovable domains and localhost
  const allowedHosts = [
    'genzly.firebaseapp.com',
    'localhost',
    '127.0.0.1',
    '.lovable.app',
    '.lovableproject.com'
  ];
  
  const currentHost = window.location.hostname;
  const isAllowedHost = allowedHosts.some(host => 
    host.startsWith('.') ? currentHost.endsWith(host.slice(1)) : currentHost === host
  );
  
  if (isAllowedHost) {
    try {
      // Enable App Check debug mode on allowed dev/staging hosts
      // This avoids silent Storage rejections when App Check enforcement is enabled
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

      // Optional: provide a reCAPTCHA v3 site key via <meta name="recaptcha-site-key" content="..." />
      const siteKey = (document.querySelector('meta[name="recaptcha-site-key"]') as HTMLMetaElement)?.content;
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey || 'unused'),
          isTokenAutoRefreshEnabled: true,
        });
        console.log('Firebase App Check initialized (debug mode)');
      } catch (err) {
        console.warn('App Check init skipped (no valid site key). Proceeding without App Check in debug mode.', err);
      }
    } catch (error) {
      console.warn('App Check initialization failed:', error);
    }
  }
}

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Security helper - validates user access according to Firestore rules
export const validateUserAccess = (userId: string, targetUserId: string): boolean => {
  return userId === targetUserId;
};

// Enhanced message content sanitizer to prevent XSS
export const sanitizeMessage = (content: string): string => {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/data:(?!image\/)/gi, '') // Allow only image data URLs
    .trim();
};

// Validate file uploads according to security rules
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
  const allowedAudioTypes = ['audio/mp3', 'audio/aac', 'audio/wav'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  if (file.size > maxFileSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }

  const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedAudioTypes];
  if (!allAllowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  return { valid: true };
};

// Rate limiting helper using localStorage (client-side)
export const checkRateLimit = (actionType: string, maxActions: number, timeWindow: number): boolean => {
  const now = Date.now();
  const storageKey = `rate_limit_${actionType}`;
  const stored = localStorage.getItem(storageKey);
  
  let actions: number[] = stored ? JSON.parse(stored) : [];
  
  // Remove expired actions
  actions = actions.filter(timestamp => now - timestamp < timeWindow);
  
  if (actions.length >= maxActions) {
    return false; // Rate limit exceeded
  }
  
  actions.push(now);
  localStorage.setItem(storageKey, JSON.stringify(actions));
  return true;
};

// Security error response formatter
export const formatSecurityError = (action: string): { success: false; error: string } => {
  return {
    success: false,
    error: 'Unauthorized or invalid request'
  };
};

export default app;
