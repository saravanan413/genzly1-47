
import { useState, ChangeEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../../config/firebase';

export const useProfilePhotoHandlers = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

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

    console.log('Starting profile picture upload for user:', currentUser.uid);
    setUploading(true);
    setUploadProgress(0);

    const uploadTimeout = setTimeout(() => {
      console.warn('Upload timeout reached');
      toast({
        title: 'Upload timeout',
        description: 'Upload is taking too long. Please try again.',
        variant: 'destructive'
      });
    }, 120000); // 2 minutes

    try {
      const timestamp = Date.now();
      const fileName = `profile_${timestamp}.jpg`;
      const storageRef = ref(storage, `profilePictures/${currentUser.uid}/${fileName}`);

      const task = uploadBytesResumable(storageRef, pendingBlob, {
        contentType: 'image/jpeg',
        customMetadata: {
          userId: currentUser.uid,
          uploadedAt: new Date().toISOString()
        }
      });

      const downloadURL: string = await new Promise((resolve, reject) => {
        task.on(
          'state_changed',
          (snapshot) => {
            const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(prog);
          },
          (err) => reject(err),
          async () => {
            try {
              const url = await getDownloadURL(task.snapshot.ref);
              resolve(url);
            } catch (e) {
              reject(e);
            }
          }
        );
      });

      console.log('Updating user document in Firestore...');
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { avatar: downloadURL, updatedAt: new Date() });

      clearTimeout(uploadTimeout);

      onImageUpdate(downloadURL);
      setPendingBlob(null);

      toast({ title: 'Success!', description: 'Profile picture updated successfully' });
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      let errorMessage = 'Failed to upload profile picture. Please try again.';
      if (error?.code === 'storage/unauthorized') {
        errorMessage = 'Permission denied. Please try logging out and back in.';
      } else if (error?.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please contact support.';
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again with a smaller image.';
      }
      toast({ title: 'Upload failed', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      clearTimeout(uploadTimeout);
      setUploading(false);
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
