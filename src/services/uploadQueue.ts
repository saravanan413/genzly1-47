import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

import { generateThumbnail } from '../utils/thumbnailGenerator';

export interface UploadTask {
  id: string;
  userId: string;
  file: File;
  caption: string;
  mediaType: 'image' | 'video';
  thumbnail: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  postId?: string;
  mediaUrl?: string;
  resumeToken?: string;
}

class UploadQueueService {
  private queue: UploadTask[] = [];
  private activeUploads = new Map<string, any>();
  private listeners = new Set<(tasks: UploadTask[]) => void>();

  subscribe(listener: (tasks: UploadTask[]) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.queue]));
  }

  async addUpload(
    userId: string,
    file: File,
    caption: string,
    mediaType: 'image' | 'video'
  ): Promise<string> {
    const taskId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate thumbnail immediately
    const thumbnail = await generateThumbnail(file, mediaType);
    
    // Create optimistic post in Firestore first
    const postId = await this.createOptimisticPost(userId, caption, thumbnail, mediaType);
    
    const task: UploadTask = {
      id: taskId,
      userId,
      file,
      caption,
      mediaType,
      thumbnail,
      status: 'pending',
      progress: 0,
      postId
    };

    this.queue.push(task);
    this.notifyListeners();
    
    // Start upload immediately
    this.processUpload(task);
    
    return taskId;
  }

  private async createOptimisticPost(
    userId: string,
    caption: string,
    thumbnail: string,
    mediaType: 'image' | 'video'
  ): Promise<string> {
    // Get user profile for denormalization
    const { getUserProfile } = await import('./userService');
    const userProfile = await getUserProfile(userId);
    
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      userId,
      caption,
      mediaUrl: thumbnail, // Start with thumbnail
      mediaURL: thumbnail, // Legacy compatibility
      mediaType,
      timestamp: serverTimestamp(),
      likes: 0,
      likedBy: [],
      uploading: true, // Flag to indicate still uploading
      // Denormalized user data
      user: {
        username: userProfile?.username || 'unknown',
        displayName: userProfile?.displayName || 'Unknown User',
        avatar: userProfile?.avatar || '/placeholder.svg'
      }
    });
    return docRef.id;
  }

  private async processUpload(task: UploadTask) {
    try {
      task.status = 'uploading';
      this.notifyListeners();

      // Upload original file without compression
      const fileToUpload = task.file;

      // Upload to Firebase Storage with resumable upload
      const storageKey = `p_${task.postId}`;
      const mediaUrl = await this.uploadWithResume(
        fileToUpload,
        task.postId!,
        storageKey,
        task
      );

      // Update Firestore post with final media URL
      await this.updatePostWithMedia(task.postId!, mediaUrl);

      task.status = 'completed';
      task.mediaUrl = mediaUrl;
      task.progress = 100;
      
      this.notifyListeners();
      
      // Remove from queue after a short delay
      setTimeout(() => {
        this.removeFromQueue(task.id);
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Upload failed';
      this.notifyListeners();
    }
  }

  private async uploadWithResume(
    file: File,
    postId: string,
    storageKey: string,
    task: UploadTask
  ): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${storageKey}.${fileExtension}`;
    const storageRef = ref(storage, `posts/${postId}/${fileName}`);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Store upload task for potential cancellation/resume
      this.activeUploads.set(task.id, uploadTask);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          task.progress = progress;
          this.notifyListeners();
        },
        (error) => {
          this.activeUploads.delete(task.id);
          reject(error);
        },
        async () => {
          try {
            this.activeUploads.delete(task.id);
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  private async updatePostWithMedia(postId: string, mediaUrl: string) {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      mediaUrl,
      mediaURL: mediaUrl, // Legacy compatibility
      uploading: false // Remove uploading flag
    });
  }

  retryUpload(taskId: string) {
    const task = this.queue.find(t => t.id === taskId);
    if (task && task.status === 'failed') {
      task.status = 'pending';
      task.error = undefined;
      task.progress = 0;
      this.processUpload(task);
    }
  }

  cancelUpload(taskId: string) {
    const uploadTask = this.activeUploads.get(taskId);
    if (uploadTask) {
      uploadTask.cancel();
      this.activeUploads.delete(taskId);
    }
    this.removeFromQueue(taskId);
  }

  private removeFromQueue(taskId: string) {
    const index = this.queue.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.notifyListeners();
    }
  }

  getQueueStatus() {
    return {
      total: this.queue.length,
      uploading: this.queue.filter(t => t.status === 'uploading').length,
      failed: this.queue.filter(t => t.status === 'failed').length,
      completed: this.queue.filter(t => t.status === 'completed').length
    };
  }
}

export const uploadQueue = new UploadQueueService();