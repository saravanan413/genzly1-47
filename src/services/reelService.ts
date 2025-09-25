import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { networkUploader } from './networkAwareUpload';

export const uploadReelVideo = async (file: File, reelId: string): Promise<string> => {
  try {
    console.log('📤 Starting network-aware reel video upload:', { reelId, fileSize: file.size, fileType: file.type });
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${reelId}.${fileExtension}`;
    const storagePath = `reels/${reelId}/${fileName}`;
    
    console.log('🔗 Storage path:', storagePath);
    
    // Use network-aware uploader with extended timeout for video files
    const result = await networkUploader.uploadFile(file, storagePath, {
      timeout: Math.max(600000, file.size / 1024 / 1024 * 60000) // 1 minute per MB, minimum 10 minutes
    });

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    console.log('✅ Reel video upload successful:', result.url);
    return result.url!;
  } catch (error) {
    console.error('❌ Error uploading reel video:', error);
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
  music?: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('🚀 Starting createCompleteReel with network-aware upload:', { 
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
    
    // Upload video using network-aware uploader
    console.log('📤 Starting network-aware video upload...');
    const result = await networkUploader.uploadFile(file, `reels/${reelId}/${reelId}.${file.name.split('.').pop()}`, {
      onProgress,
      timeout: Math.max(600000, file.size / 1024 / 1024 * 60000) // 1 minute per MB, minimum 10 minutes
    });

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log('✅ Video upload successful:', result.url);
    
    // Create complete reel document with mediaURL already populated
    console.log('📄 Creating Firestore document...');
    const reelsRef = collection(db, 'reels');
    const docRef = await addDoc(reelsRef, {
      userId,
      mediaURL: result.url,
      videoURL: result.url,
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