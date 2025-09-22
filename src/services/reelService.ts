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
    console.log('📤 Starting reel video upload:', { reelId, fileSize: file.size, fileType: file.type });
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${reelId}.${fileExtension}`;
    const storageRef = ref(storage, `reels/${reelId}/${fileName}`);
    
    console.log('🔗 Storage path:', `reels/${reelId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Upload bytes completed');
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Reel video upload successful:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading reel video:', error);
    
    // Log specific error details for storage issues
    if (error?.code) {
      console.error('🔴 Storage error code:', error.code);
      console.error('🔴 Storage error message:', error.message);
      
      if (error.code === 'storage/unauthorized') {
        console.error('🔒 Storage unauthorized - check Firebase Storage rules for path:', `reels/${reelId}/`);
      }
    }
    
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
  console.log('🚀 Starting createCompleteReel:', { 
    userId, 
    caption, 
    fileSize: file.size, 
    fileName: file.name,
    fileType: file.type,
    settings,
    music 
  });
  
  try {
    // Pre-generate reel ID
    const reelId = generateFirestoreId('reels');
    console.log('📝 Generated reel ID:', reelId);
    
    // Upload video first using the pre-generated ID
    console.log('📤 Starting video upload...');
    const videoURL = await uploadReelVideo(file, reelId);
    console.log('✅ Video upload successful:', videoURL);
    
    // Create complete reel document with mediaURL already populated
    console.log('📄 Creating Firestore document...');
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
    
    console.log('🎉 Reel created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error in createCompleteReel:', error);
    
    // Log specific error details
    if (error?.code) {
      console.error('🔴 Firebase error code:', error.code);
      console.error('🔴 Firebase error message:', error.message);
    }
    
    throw error;
  }
};