
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

export const uploadChatMedia = async (file: File, chatId: string, messageId: string): Promise<string> => {
  try {
    console.log('📤 Uploading chat media:', { chatId, messageId, fileSize: file.size, fileType: file.type });
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${messageId}.${fileExtension}`;
    const storageRef = ref(storage, `chats/${chatId}/media/${fileName}`);
    
    console.log('🔗 Storage path:', `chats/${chatId}/media/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Chat media upload successful:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading chat media:', error);
    // Add specific error details for debugging
    if (error.code === 'storage/unauthorized') {
      console.error('🔒 Storage unauthorized - check Firebase Storage rules for path:', `chats/${chatId}/media/`);
    }
    throw error;
  }
};

export const uploadPostMedia = async (file: File, userId: string, postId?: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = postId ? `${postId}.${fileExtension}` : `${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `posts/${userId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
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
    const storageRef = ref(storage, `users/${userId}/${fileName}`);
    
    console.log('🔗 Storage path:', `users/${userId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Profile picture upload successful:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);
    if (error.code === 'storage/unauthorized') {
      console.error('🔒 Storage unauthorized - check Firebase Storage rules for path:', `users/${userId}/`);
    }
    throw error;
  }
};

export const uploadStoryMedia = async (file: File, userId: string, storyId?: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = storyId ? `${storyId}.${fileExtension}` : `${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `stories/${userId}/${fileName}`);
    
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
      userId,
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
    const storageRef = ref(storage, `reels/${userId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading reel media:', error);
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
