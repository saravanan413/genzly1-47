
import { useState, ChangeEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { networkUploader } from '../../services/networkAwareUpload';
import { useNetworkStatus } from '../useNetworkStatus';

export const useProfilePhotoHandlers = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { networkInfo, estimateUpload } = useNetworkStatus();

  const [uploading, setUploading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [cropImageData, setCropImageData] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Handle profile photo selection with better error handling
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.type, file.size);
    
    // More permissive file type check
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or WebP image file",
        variant: "destructive"
      });
      return;
    }
    
    // Increased file size limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 10MB",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        console.log('File read successfully, setting up crop modal');
        setCropImageData(event.target.result);
        setTimeout(() => {
          setShowCrop(true);
        }, 100);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      toast({
        title: "Error reading file",
        description: "Failed to read the selected image. Please try again.",
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCropDone = async (croppedImage: string, onImageUpdate: (url: string) => void) => {
    // Prepare preview and pending blob; upload happens on Save
    try {
      console.log('Preparing cropped image for preview...');
      const response = await fetch(croppedImage);
      if (!response.ok) throw new Error('Failed to process cropped image');

      const blob = await response.blob();
      console.log('Original blob created, size:', blob.size, 'type:', blob.type);

      let finalBlob = blob;
      if (blob.size > 2 * 1024 * 1024) {
        console.log('Compressing image for preview...');
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.src = croppedImage;
          });
          const maxSize = 400;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            finalBlob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob((b) => {
                if (b) resolve(b);
                else reject(new Error('Failed to compress image'));
              }, 'image/jpeg', 0.85);
            });
            console.log('Compressed blob size:', finalBlob.size);
          }
        } catch (compressionError) {
          console.warn('Image compression failed, using original:', compressionError);
        }
      }

      // Set pending upload blob and show preview immediately
      setPendingBlob(finalBlob);
      const previewUrl = URL.createObjectURL(finalBlob);
      onImageUpdate(previewUrl);
      setShowCrop(false);
      setCropImageData(null);
      toast({ title: 'Ready to save', description: 'Press Save to upload your new profile photo' });
    } catch (error) {
      console.error('Error preparing cropped image:', error);
      toast({
        title: 'Error',
        description: 'Could not process the image. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const commitUpload = async (onImageUpdate: (url: string) => void): Promise<string | null> => {
    if (!pendingBlob) {
      return null; // nothing to upload
    }
    if (!currentUser?.uid) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to upload a profile picture',
        variant: 'destructive'
      });
      return null;
    }

    // Network pre-check
    if (!networkInfo.isOnline) {
      toast({
        title: 'No internet connection',
        description: 'Please check your network and try again.',
        variant: 'destructive'
      });
      return null;
    }

    const fileSizeMB = pendingBlob.size / (1024 * 1024);
    const uploadEstimate = estimateUpload(fileSizeMB);
    
    // Show network warning if applicable
    if (uploadEstimate.warningMessage && !uploadEstimate.recommendProceed) {
      toast({
        title: 'Network Warning',
        description: uploadEstimate.warningMessage,
        variant: 'destructive'
      });
      return null;
    } else if (uploadEstimate.warningMessage) {
      toast({
        title: 'Network Notice',
        description: uploadEstimate.warningMessage,
      });
    }

    console.log('Starting network-aware profile picture upload:', {
      userId: currentUser.uid,
      fileSizeMB: fileSizeMB.toFixed(2),
      estimatedTime: `${Math.ceil(uploadEstimate.estimatedTimeSeconds)}s`,
      connectionType: networkInfo.connectionType
    });

    setUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const fileName = `profile_${timestamp}.jpg`;
      const storagePath = `profilePictures/${currentUser.uid}/${fileName}`;

      // Use network-aware uploader
      const result = await networkUploader.uploadFile(pendingBlob, storagePath, {
        onProgress: (progress) => setUploadProgress(progress),
        timeout: uploadEstimate.estimatedTimeSeconds * 1000 * 2 // 2x estimated time
      });

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('Updating user document in Firestore...');
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { 
        avatar: result.url, 
        updatedAt: new Date() 
      });

      onImageUpdate(result.url!);
      setPendingBlob(null);

      toast({ 
        title: 'Success!', 
        description: 'Profile picture updated successfully' 
      });
      return result.url!;
      
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast({ 
        title: 'Upload failed', 
        description: error.message || 'Failed to upload profile picture. Please try again.',
        variant: 'destructive' 
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  const handleCropCancel = () => {
    console.log('Crop cancelled');
    setShowCrop(false);
    setCropImageData(null);
  };

  const handleRemovePhoto = async (onImageUpdate: (url: string) => void) => {
    if (!currentUser?.uid) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to remove your profile picture",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Removing profile picture for user:', currentUser.uid);
    setUploading(true);
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        avatar: '',
        updatedAt: new Date()
      });
      
      console.log('Avatar field cleared in Firestore');
      onImageUpdate('');
      
      toast({
        title: "Success!",
        description: "Profile picture removed successfully"
      });
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    uploadProgress,
    hasPendingUpload: !!pendingBlob,
    showCrop,
    cropImageData,
    handleFileChange,
    handleCropDone,
    commitUpload,
    handleCropCancel,
    handleRemovePhoto
  };
};
