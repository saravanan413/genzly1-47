
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

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

export const uploadPostMedia = async (file: File, postId: string): Promise<string> => {
  try {
    console.log('📤 Starting post media upload:', { postId, fileSize: file.size, fileType: file.type });
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${postId}.${fileExtension}`;
    const storageRef = ref(storage, `posts/${postId}/${fileName}`);
    
    console.log('🔗 Storage path:', `posts/${postId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Upload bytes completed');
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Post media upload successful:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading post media:', error);
    
    // Log specific error details for storage issues
    if (error?.code) {
      console.error('🔴 Storage error code:', error.code);
      console.error('🔴 Storage error message:', error.message);
      
      if (error.code === 'storage/unauthorized') {
        console.error('🔒 Storage unauthorized - check Firebase Storage rules for path:', `posts/${postId}/`);
      }
    }
    
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
      mediaURL,
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

export const uploadStoryMedia = async (file: File, storyId: string): Promise<string> => {
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

export const uploadReelMedia = async (file: File, reelId: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${reelId}.${fileExtension}`;
    const storageRef = ref(storage, `reels/${reelId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading reel media:', error);
    throw error;
  }
};

// Upload-first pattern functions
export const generateFirestoreId = (collectionName: string): string => {
  return doc(collection(db, collectionName)).id;
};

export const createCompletePost = async (
  userId: string,
  caption: string,
  file: File,
  mediaType: 'image' | 'video',
  settings: { allowComments: boolean; hideLikeCount: boolean } = { allowComments: true, hideLikeCount: false }
): Promise<string> => {
  console.log('🚀 Starting createCompletePost:', { 
    userId, 
    caption, 
    mediaType, 
    fileSize: file.size, 
    fileName: file.name,
    fileType: file.type,
    settings 
  });
  
  try {
    // Pre-generate post ID
    const postId = generateFirestoreId('posts');
    console.log('📝 Generated post ID:', postId);
    
    // Upload media first using the pre-generated ID
    console.log('📤 Starting media upload...');
    const mediaURL = await uploadPostMedia(file, postId);
    console.log('✅ Media upload successful:', mediaURL);
    
    // Create complete post document with mediaURL already populated
    console.log('📄 Creating Firestore document...');
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      userId,
      caption,
      mediaURL,
      mediaType,
      timestamp: serverTimestamp(),
      likes: 0,
      likedBy: [],
      allowComments: settings.allowComments,
      hideLikeCount: settings.hideLikeCount
    });
    
    console.log('🎉 Post created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error in createCompletePost:', error);
    
    // Log specific error details
    if (error?.code) {
      console.error('🔴 Firebase error code:', error.code);
      console.error('🔴 Firebase error message:', error.message);
    }
    
    // If Firestore creation fails after successful upload, we should clean up
    // But for now, just throw the error
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
