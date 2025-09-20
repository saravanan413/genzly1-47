import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export const uploadReelVideo = async (file: File, reelId: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${reelId}.${fileExtension}`;
    const storageRef = ref(storage, `reels/${reelId}/${fileName}`);
    
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

export const generateFirestoreId = (collectionName: string): string => {
  return doc(collection(db, collectionName)).id;
};

export const createCompleteReel = async (
  userId: string,
  caption: string,
  file: File,
  settings: { allowComments: boolean; hideLikeCount: boolean } = { allowComments: true, hideLikeCount: false },
  music?: string
): Promise<string> => {
  try {
    // Pre-generate reel ID
    const reelId = generateFirestoreId('reels');
    
    // Upload video first using the pre-generated ID
    const videoURL = await uploadReelVideo(file, reelId);
    
    // Create complete reel document with mediaURL already populated
    const reelsRef = collection(db, 'reels');
    const docRef = await addDoc(reelsRef, {
      userId,
      mediaURL: videoURL,
      videoURL: videoURL,
      caption,
      music: music || 'Original Audio',
      mediaType: 'video',
      timestamp: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
      shares: 0,
      allowComments: settings.allowComments,
      hideLikeCount: settings.hideLikeCount
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating complete reel:', error);
    throw error;
  }
};