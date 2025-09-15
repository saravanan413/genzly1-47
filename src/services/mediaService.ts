
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { compressImageIfNeeded } from '../utils/imageCompression';

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

// Validate file size
const validateFileSize = (file: File): void => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image file too large. Maximum size is 10MB.');
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new Error('Video file too large. Maximum size is 50MB.');
  }
  if (!isImage && !isVideo) {
    throw new Error('Invalid file type. Only images and videos are allowed.');
  }
};

export const uploadChatMedia = async (file: File, chatId: string, messageId: string): Promise<string> => {
  try {
    console.log('📤 Uploading chat media:', { chatId, messageId, fileSize: file.size, fileType: file.type });
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${messageId}.${fileExtension}`;
    const storageRef = ref(storage, `chats/${chatId}/${messageId}/${fileName}`);
    
    console.log('🔗 Storage path:', `chats/${chatId}/${messageId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Chat media upload successful:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading chat media:', error);
    // Add specific error details for debugging
    if (error.code === 'storage/unauthorized') {
      console.error('🔒 Storage unauthorized - check Firebase Storage rules for path:', `chats/${chatId}/${messageId}/`);
    }
    throw error;
  }
};

export const uploadPostMedia = async (
  file: File,
  userId: string,
  postId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Validate file size (keep limits unchanged)
    validateFileSize(file);

    // Lightweight client-side compression for images to speed up uploads
    const fileToUpload = file.type.startsWith('image/')
      ? await compressImageIfNeeded(file)
      : file;

    const fileExtension = fileToUpload.name.split('.').pop();
    const fileName = `${postId}.${fileExtension}`;
    const storageRef = ref(storage, `posts/${postId}/${fileName}`);

    return new Promise((resolve, reject) => {
      const metadata = { contentType: fileToUpload.type } as const;
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload, metadata);

      // Keep 2-minute hard timeout, plus stall detection for resiliency
      const STALL_TIMEOUT_MS = 30_000;
      const OVERALL_TIMEOUT_MS = 2 * 60 * 1000;
      let lastTransferred = 0;
      let stallTimer: ReturnType<typeof setTimeout>;
      let overallTimer: ReturnType<typeof setTimeout>;

      const cleanup = () => {
        clearTimeout(stallTimer);
        clearTimeout(overallTimer);
      };

      const resetStallTimer = () => {
        clearTimeout(stallTimer);
        stallTimer = setTimeout(() => {
          uploadTask.cancel();
          reject(new Error('Upload stalled. Please check your connection and try again.'));
        }, STALL_TIMEOUT_MS);
      };

      // Initialize timers
      resetStallTimer();
      overallTimer = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error('Upload timeout. Please try again.'));
      }, OVERALL_TIMEOUT_MS);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);

          if (snapshot.bytesTransferred !== lastTransferred) {
            lastTransferred = snapshot.bytesTransferred;
            resetStallTimer();
          }
        },
        (error) => {
          cleanup();
          console.error('Error uploading post media:', error);

          // Provide specific error messages
          if ((error as any).code === 'storage/unauthorized') {
            reject(new Error('Upload unauthorized. Please check your permissions.'));
          } else if ((error as any).code === 'storage/canceled') {
            reject(new Error('Upload was cancelled.'));
          } else if ((error as any).code === 'storage/quota-exceeded') {
            reject(new Error('Storage quota exceeded. Please try again later.'));
          } else {
            reject(new Error('Upload failed. Please try again.'));
          }
        },
        async () => {
          try {
            cleanup();
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            cleanup();
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading post media:', error);
    throw error;
  }
};

export const createPost = async (
  userId: string,
  caption: string,
  mediaURL: string,
  mediaType: 'image' | 'video'
): Promise<string> => {
  try {
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      userId,
      caption,
      mediaURL, // legacy field for backward compatibility
      mediaUrl: mediaURL, // required by security rules
      mediaType,
      timestamp: serverTimestamp(),
      likes: 0,
      likedBy: []
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const uploadProfilePicture = async (file: File, userId: string): Promise<string> => {
  try {
    console.log('📤 Uploading profile picture:', { userId, fileSize: file.size, fileType: file.type });
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile.${fileExtension}`;
    const storageRef = ref(storage, `profilePictures/${userId}/${fileName}`);
    
    console.log('🔗 Storage path:', `profilePictures/${userId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Profile picture upload successful:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);
    if (error.code === 'storage/unauthorized') {
      console.error('🔒 Storage unauthorized - check Firebase Storage rules for path:', `profilePictures/${userId}/`);
    }
    throw error;
  }
};

export const uploadStoryMedia = async (file: File, userId: string, storyId: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${storyId}.${fileExtension}`;
    const storageRef = ref(storage, `stories/${storyId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading story media:', error);
    throw error;
  }
};

export const createStory = async (
  userId: string,
  mediaURL: string,
  mediaType: 'image' | 'video'
): Promise<string> => {
  try {
    const storiesRef = collection(db, 'stories');
    const docRef = await addDoc(storiesRef, {
      userId: userId, // Use userId for consistency with other collections
      mediaURL,
      mediaType,
      timestamp: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      views: []
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
};

export const uploadReelMedia = async (file: File, userId: string, reelId?: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = reelId ? `${reelId}.${fileExtension}` : `${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `reels/${reelId || Date.now()}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading reel media:', error);
    throw error;
  }
};

// Helper functions for create-first-then-upload pattern
export const createPostSkeleton = async (userId: string, caption: string, mediaType: 'image' | 'video'): Promise<string> => {
  try {
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      userId,
      caption,
      mediaURL: '', // Will be updated after upload
      mediaType,
      timestamp: serverTimestamp(),
      likes: 0,
      likedBy: []
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating post skeleton:', error);
    throw error;
  }
};

export const updatePostWithMedia = async (postId: string, mediaURL: string): Promise<void> => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { mediaURL });
  } catch (error) {
    console.error('Error updating post with media:', error);
    throw error;
  }
};

export const createStorySkeleton = async (userId: string, mediaType: 'image' | 'video'): Promise<string> => {
  try {
    const storiesRef = collection(db, 'stories');
    const docRef = await addDoc(storiesRef, {
      userId: userId, // Use userId for consistency
      mediaURL: '', // Will be updated after upload
      mediaType,
      timestamp: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      views: []
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating story skeleton:', error);
    throw error;
  }
};

export const updateStoryWithMedia = async (storyId: string, mediaURL: string): Promise<void> => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const storyRef = doc(db, 'stories', storyId);
    await updateDoc(storyRef, { mediaURL });
  } catch (error) {
    console.error('Error updating story with media:', error);
    throw error;
  }
};

export const deleteMedia = async (url: string): Promise<void> => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};
