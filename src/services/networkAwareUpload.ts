import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (url: string) => void;
  onError?: (error: Error) => void;
  timeout?: number;
  retries?: number;
  abortSignal?: AbortSignal;
}

export interface NetworkAwareUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  cancelled?: boolean;
}

export class NetworkAwareUploader {
  private static instance: NetworkAwareUploader;
  private activeUploads = new Map<string, AbortController>();

  static getInstance(): NetworkAwareUploader {
    if (!NetworkAwareUploader.instance) {
      NetworkAwareUploader.instance = new NetworkAwareUploader();
    }
    return NetworkAwareUploader.instance;
  }

  async uploadFile(
    file: Blob,
    storagePath: string,
    options: UploadOptions = {},
    metadata?: { contentType: string }
  ): Promise<NetworkAwareUploadResult> {
    const uploadId = `${storagePath}_${Date.now()}`;
    const controller = new AbortController();
    
    // Store upload for cancellation capability
    this.activeUploads.set(uploadId, controller);

    try {
      // Pre-upload network check
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      // Get connection info for adaptive timeout
      const connection = (navigator as any).connection;
      const isSlowConnection = connection?.effectiveType === 'slow-2g' || 
                              connection?.effectiveType === '2g' ||
                              (connection?.downlink && connection.downlink < 1);
      
      // Adaptive timeout based on file size and connection
      const fileSizeMB = file.size / (1024 * 1024);
      const MIN_TIMEOUT = 30000; // 30s minimum
      const DEFAULT_TIMEOUT = 120000; // 2 minutes default
      const MAX_TIMEOUT = 300000; // 5 minutes maximum cap
      const requestedTimeout = options.timeout ?? DEFAULT_TIMEOUT;
      const sizeBasedTimeout = isSlowConnection ? (fileSizeMB * 60000) : (fileSizeMB * 20000);
      const adaptiveTimeout = Math.min(Math.max(requestedTimeout, sizeBasedTimeout, MIN_TIMEOUT), MAX_TIMEOUT);

      console.log(`🚀 Starting network-aware upload:`, {
        uploadId,
        fileSizeMB: fileSizeMB.toFixed(2),
        storagePath,
        adaptiveTimeout: Math.round(adaptiveTimeout / 1000) + 's',
        isSlowConnection,
        connectionType: connection?.effectiveType || 'unknown'
      });

      // Verify user is authenticated before upload
      const { auth } = await import('../config/firebase');
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated to upload');
      }

      console.log('🔐 Authenticated user uploading:', {
        uid: currentUser.uid,
        email: currentUser.email,
        pathUserId: storagePath.split('/')[1]
      });

      // Verify UID matches path
      const pathUserId = storagePath.split('/')[1];
      if (currentUser.uid !== pathUserId) {
        throw new Error(`UID mismatch: ${currentUser.uid} vs path ${pathUserId}`);
      }

      // Create storage reference
      const storageRef = ref(storage, storagePath);
      
      console.log('📂 Storage Reference:', {
        fullPath: storageRef.fullPath,
        bucket: storageRef.bucket,
        name: storageRef.name
      });

      // Set up timeout race
      const uploadPromise = this.performUpload(storageRef, file, options, controller.signal, metadata);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Upload timeout after ${Math.round(adaptiveTimeout / 1000)}s. Please check your connection and try again.`));
        }, adaptiveTimeout);
      });

      // Race between upload and timeout
      const result = await Promise.race([uploadPromise, timeoutPromise]);
      
      this.activeUploads.delete(uploadId);
      options.onComplete?.(result);
      
      console.log('✅ Upload completed successfully:', result);
      return { success: true, url: result };

    } catch (error: any) {
      this.activeUploads.delete(uploadId);
      
      if (controller.signal.aborted) {
        console.log('🚫 Upload cancelled by user');
        return { success: false, cancelled: true };
      }

      console.error('❌ Upload failed:', error);
      
      // Enhanced error handling with network context
      let errorMessage = this.getNetworkAwareErrorMessage(error);
      
      options.onError?.(new Error(errorMessage));
      return { success: false, error: errorMessage };
    }
  }

  private async performUpload(
    storageRef: any,
    file: Blob,
    options: UploadOptions,
    signal: AbortSignal,
    metadata?: { contentType: string }
  ): Promise<string> {
    // Check if upload was cancelled before starting
    if (signal.aborted) {
      throw new Error('Upload cancelled');
    }

    // Use Firebase resumable uploads for reliability and real progress
    console.log('📤 Uploading file to Firebase Storage (resumable)...');

    const uploadMetadata = {
      contentType: metadata?.contentType || (file as any).type || 'application/octet-stream',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalSize: file.size.toString(),
        userAgent: navigator.userAgent
      }
    } as const;

    const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

    // Wire abort -> cancel upload task
    const onAbort = () => {
      try { uploadTask.cancel(); } catch {}
    };
    signal.addEventListener('abort', onAbort, { once: true });

    // Stalled upload watchdog (detects no progress and cancels)
    let lastBytes = 0;
    let lastTick = Date.now();
    let cancelledByWatchdog = false;
    const connection = (navigator as any).connection;
    const stallThreshold = (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') ? 45000 : 30000; // Increased from 20s to 30s
    const uploadStartTime = Date.now();

    const stallTimer = window.setInterval(() => {
      const bytes = uploadTask.snapshot?.bytesTransferred ?? 0;
      const elapsed = Date.now() - uploadStartTime;
      
      // More lenient in first 60 seconds (connection negotiation time)
      const currentThreshold = elapsed < 60000 ? stallThreshold * 2 : stallThreshold;
      
      if (bytes > lastBytes) {
        lastBytes = bytes;
        lastTick = Date.now();
        return;
      }
      if (Date.now() - lastTick > currentThreshold) {
        console.error('❌ Upload stalled:', {
          bytesTransferred: bytes,
          secondsSinceLastProgress: Math.round((Date.now() - lastTick) / 1000),
          totalElapsed: Math.round(elapsed / 1000)
        });
        cancelledByWatchdog = true;
        try { uploadTask.cancel(); } catch {}
      }
    }, 2000);

    const downloadURL: string = await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          if (options.onProgress && snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            options.onProgress(progress);
          }
          // update watchdog counters
          lastBytes = snapshot.bytesTransferred;
          lastTick = Date.now();
        },
        (error) => {
          window.clearInterval(stallTimer);
          console.error('❌ Upload task error:', {
            code: error?.code,
            message: error?.message,
            serverResponse: error?.serverResponse,
            bytesTransferred: uploadTask.snapshot?.bytesTransferred,
            totalBytes: uploadTask.snapshot?.totalBytes,
            cancelledByWatchdog
          });
          
          if (cancelledByWatchdog && error?.code === 'storage/canceled') {
            return reject(new Error('Upload stalled (no progress). Check: 1) Auth token is valid, 2) Storage rules allow this path, 3) Network connection is stable.'));
          }
          reject(error);
        },
        async () => {
          window.clearInterval(stallTimer);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    });

    signal.removeEventListener('abort', onAbort as any);

    console.log('✅ Download URL retrieved successfully');
    return downloadURL;
  }

  private getNetworkAwareErrorMessage(error: any): string {
    const connection = (navigator as any).connection;
    const isOnline = navigator.onLine;

    // Log raw error details for debugging
    try {
      console.error('Upload error details:', {
        name: error?.name,
        code: error?.code,
        message: error?.message,
        serverResponse: error?.serverResponse,
      });
    } catch {}
    
    if (!isOnline) {
      return 'No internet connection. Please check your network and try again.';
    }

    if (error?.message?.includes('stalled')) {
      return 'Upload stalled due to no progress. This can be caused by blocked requests (App Check or Storage rules).';
    }

    if (error?.code === 'storage/canceled') {
      return 'Upload was canceled.';
    }

    if (error?.code === 'storage/unauthenticated') {
      return 'You need to sign in to upload. Please log in and try again.';
    }

    if (error?.code === 'storage/unauthorized') {
      // Often caused by Storage rules or App Check enforcement
      if (String(error?.serverResponse || '').toLowerCase().includes('app check')) {
        return 'Upload blocked by App Check. Enable App Check for this app or run in debug mode during development.';
      }
      return 'Permission denied by Storage rules. Ensure the user has access to this path.';
    }
    
    if (error?.code === 'storage/quota-exceeded') {
      return 'Storage quota exceeded. Please contact support.';
    }
    
    if (error?.code === 'storage/retry-limit-exceeded') {
      return 'Upload failed after multiple retries. Please try again.';
    }

    if (error?.code === 'storage/unknown') {
      if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
        return 'Upload failed due to very slow connection. Try again on a faster network.';
      }
      return 'Upload failed due to network issues. Please try again.';
    }
    
    if (error?.message?.includes('timeout')) {
      return (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g')
        ? 'Upload timeout due to slow connection. Try again with a smaller file or faster network.'
        : 'Upload timeout. Please check your connection and try again.';
    }
    
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return 'Network error occurred. Please check your connection and try again.';
    }

    const networkContext = connection?.effectiveType ? ` (Connection: ${connection.effectiveType})` : '';
    return `Upload failed${networkContext}. Please try again.`;
  }

  cancelUpload(uploadId: string): void {
    const controller = this.activeUploads.get(uploadId);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(uploadId);
      console.log(`🚫 Upload cancelled: ${uploadId}`);
    }
  }

  cancelAllUploads(): void {
    for (const [uploadId, controller] of this.activeUploads) {
      controller.abort();
      console.log(`🚫 Upload cancelled: ${uploadId}`);
    }
    this.activeUploads.clear();
  }

  getActiveUploadsCount(): number {
    return this.activeUploads.size;
  }
}

// Export singleton instance
export const networkUploader = NetworkAwareUploader.getInstance();