
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { networkUploader } from './networkAwareUpload';

export const uploadChatMedia = async (file: File, chatId: string, messageId: string): Promise<string> => {
  try {
    console.log('📤 Uploading chat media:', { chatId, messageId, fileSize: file.size, fileType: file.type });
    
    // Generate unique filename: Date.now() + '-' + originalName
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storagePath = `chats/${chatId}/${messageId}/${uniqueFileName}`;
    
    console.log('🔗 Storage path:', storagePath);
    
    const result = await networkUploader.uploadFile(
      file, 
      storagePath, 
      {
        timeout: file.size > 10 * 1024 * 1024 ? 300000 : 120000
      },
      { contentType: file.type }
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    console.log('✅ Chat media upload successful:', result.url);
    return result.url!;
  } catch (error) {
    console.error('❌ Error uploading chat media:', error);
    if (error.code === 'storage/unauthorized') {
      console.error('🔒 Storage unauthorized - check Firebase Storage rules for path:', `chats/${chatId}/${messageId}/`);
    }
    throw error;
  }
};

export const uploadPostMedia = async (file: File, postId: string): Promise<string> => {
  try {
    console.log('📤 Starting network-aware post media upload:', { postId, fileSize: file.size, fileType: file.type });
    
    // Generate unique filename: Date.now() + '-' + originalName
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storagePath = `posts/${postId}/${uniqueFileName}`;
    
    console.log('🔗 Storage path:', storagePath);
    
    const result = await networkUploader.uploadFile(
      file, 
      storagePath, 
      {
        timeout: file.size > 10 * 1024 * 1024 ? 300000 : 120000
      },
      { contentType: file.type }
    );

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log('✅ Post media upload successful:', result.url);
    return result.url!;
  } catch (error) {
    console.error('❌ Error uploading post media:', error);
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
    
    // Always use profile.jpg to overwrite previous profile picture
    const storagePath = `profilePictures/${userId}/profile.jpg`;
    
    console.log('🔗 Storage path:', storagePath);
    
    const result = await networkUploader.uploadFile(
      file, 
      storagePath, 
      {
        timeout: file.size > 10 * 1024 * 1024 ? 300000 : 120000
      },
      { contentType: file.type }
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    console.log('✅ Profile picture upload successful:', result.url);
    return result.url!;
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
    console.log('📤 Uploading story media:', { storyId, fileSize: file.size, fileType: file.type });
    
    // Generate unique filename: Date.now() + '-' + originalName
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storagePath = `stories/${storyId}/${uniqueFileName}`;
    
    console.log('🔗 Storage path:', storagePath);
    
    const result = await networkUploader.uploadFile(
      file, 
      storagePath, 
      {
        timeout: file.size > 10 * 1024 * 1024 ? 300000 : 120000
      },
      { contentType: file.type }
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    console.log('✅ Story media upload successful:', result.url);
    return result.url!;
  } catch (error) {
    console.error('❌ Error uploading story media:', error);
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
    console.log('📤 Starting network-aware reel media upload:', { reelId, fileSize: file.size, fileType: file.type });
    
    // Generate unique filename: Date.now() + '-' + originalName
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storagePath = `reels/${reelId}/${uniqueFileName}`;
    
    console.log('🔗 Storage path:', storagePath);
    
    const result = await networkUploader.uploadFile(
      file, 
      storagePath, 
      {
        timeout: Math.max(300000, file.size / 1024 / 1024 * 30000)
      },
      { contentType: file.type }
    );

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log('✅ Reel media upload successful:', result.url);
    return result.url!;
  } catch (error) {
    console.error('❌ Error uploading reel media:', error);
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
  settings: { allowComments: boolean; hideLikeCount: boolean } = { allowComments: true, hideLikeCount: false },
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('🚀 Starting createCompletePost with network-aware upload:', { 
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
    
    // Generate unique filename
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storagePath = `posts/${postId}/${uniqueFileName}`;
    
    // Upload media first using network-aware uploader
    console.log('📤 Starting network-aware media upload...');
    const result = await networkUploader.uploadFile(
      file, 
      storagePath, 
      {
        onProgress,
        timeout: file.size > 10 * 1024 * 1024 ? 300000 : 120000
      },
      { contentType: file.type }
    );

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log('✅ Media upload successful:', result.url);
    
    // Create complete post document with mediaURL already populated
    console.log('📄 Creating Firestore document...');
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      userId,
      caption,
      mediaURL: result.url,
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
