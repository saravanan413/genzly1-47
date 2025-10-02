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
    options: UploadOptions = {}
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
      const requestedTimeout = options.timeout ?? DEFAULT_TIMEOUT;
      const sizeBasedTimeout = isSlowConnection ? (fileSizeMB * 60000) : (fileSizeMB * 20000);
      const adaptiveTimeout = Math.max(requestedTimeout, sizeBasedTimeout, MIN_TIMEOUT);

      console.log(`🚀 Starting network-aware upload:`, {
        uploadId,
        fileSizeMB: fileSizeMB.toFixed(2),
        storagePath,
        adaptiveTimeout: Math.round(adaptiveTimeout / 1000) + 's',
        isSlowConnection,
        connectionType: connection?.effectiveType || 'unknown'
      });

      // Create storage reference
      const storageRef = ref(storage, storagePath);

      // Set up timeout race
      const uploadPromise = this.performUpload(storageRef, file, options, controller.signal);
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
    signal: AbortSignal
  ): Promise<string> {
    // Check if upload was cancelled before starting
    if (signal.aborted) {
      throw new Error('Upload cancelled');
    }

    // Use Firebase resumable uploads for reliability and real progress
    console.log('📤 Uploading file to Firebase Storage (resumable)...');

    const metadata = {
      contentType: (file as any).type || 'application/octet-stream',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalSize: file.size.toString(),
        userAgent: navigator.userAgent
      }
    } as const;

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    // Wire abort -> cancel upload task
    const onAbort = () => {
      try { uploadTask.cancel(); } catch {}
    };
    signal.addEventListener('abort', onAbort, { once: true });

    const downloadURL: string = await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          if (options.onProgress && snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            options.onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
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
    
    if (!isOnline) {
      return 'No internet connection. Please check your network and try again.';
    }

    if (error?.code === 'storage/unauthorized') {
      return 'Permission denied. Please try logging out and back in.';
    }
    
    if (error?.code === 'storage/quota-exceeded') {
      return 'Storage quota exceeded. Please contact support.';
    }
    
    if (error?.code === 'storage/unknown') {
      if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
        return 'Upload failed due to slow connection. Please try again or use a faster network.';
      }
      return 'Upload failed due to network issues. Please try again.';
    }
    
    if (error?.message?.includes('timeout')) {
      return connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g' ?
        'Upload timeout due to slow connection. Please try again with a smaller file or faster network.' :
        'Upload timeout. Please check your connection and try again.';
    }
    
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return 'Network error occurred. Please check your connection and try again.';
    }

    // Generic error with network context
    const networkContext = connection?.effectiveType ? 
      ` (Connection: ${connection.effectiveType})` : '';
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