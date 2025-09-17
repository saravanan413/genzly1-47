import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export const uploadReelVideo = async (file: File, userId: string, reelId: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${reelId}.${fileExtension}`;
    const storageRef = ref(storage, `reels/${userId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading reel video:', error);
    throw error;
  }
};

export const createReel = async (
  userId: string,
  videoURL: string,
  caption: string,
  music?: string
): Promise<string> => {
  try {
    const reelsRef = collection(db, 'reels');
    const docRef = await addDoc(reelsRef, {
      userId,
      mediaURL: videoURL, // Using mediaURL for consistency with posts
      videoURL, // Keep videoURL for backward compatibility
      caption,
      music: music || 'Original Audio',
      mediaType: 'video',
      timestamp: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
      shares: 0
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating reel:', error);
    throw error;
  }
};

export const createReelSkeleton = async (userId: string, caption: string, music?: string): Promise<string> => {
  try {
    const reelsRef = collection(db, 'reels');
    const docRef = await addDoc(reelsRef, {
      userId,
      mediaURL: '', // Will be updated after upload
      videoURL: '', // Will be updated after upload
      caption,
      music: music || 'Original Audio',
      mediaType: 'video',
      timestamp: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
      shares: 0
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating reel skeleton:', error);
    throw error;
  }
};

export const updateReelWithMedia = async (reelId: string, videoURL: string): Promise<void> => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const reelRef = doc(db, 'reels', reelId);
    await updateDoc(reelRef, { 
      mediaURL: videoURL,
      videoURL: videoURL 
    });
  } catch (error) {
    console.error('Error updating reel with media:', error);
    throw error;
  }
};