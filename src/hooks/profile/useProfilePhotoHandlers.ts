
import { useState, ChangeEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../../config/firebase';

export const useProfilePhotoHandlers = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [cropImageData, setCropImageData] = useState<string | null>(null);

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
    if (!currentUser?.uid) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to upload a profile picture",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Starting profile picture upload for user:', currentUser.uid);
    setUploading(true);
    
    const uploadTimeout = setTimeout(() => {
      setUploading(false);
      toast({
        title: "Upload timeout",
        description: "Upload is taking too long. Please try again with a smaller image.",
        variant: "destructive"
      });
    }, 30000); // 30 second timeout
    
    try {
      console.log('Converting cropped image to blob...');
      
      // Convert base64 to blob with simplified approach
      const response = await fetch(croppedImage);
      if (!response.ok) {
        throw new Error('Failed to process cropped image');
      }
      
      const blob = await response.blob();
      console.log('Original blob created, size:', blob.size, 'type:', blob.type);
      
      // Simple compression - only if blob is larger than 2MB
      let finalBlob = blob;
      if (blob.size > 2 * 1024 * 1024) {
        console.log('Compressing image...');
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.src = croppedImage;
          });
          
          // Resize to max 400x400 for profile pictures to reduce size
          const maxSize = 400;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            finalBlob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              }, 'image/jpeg', 0.8);
            });
            
            console.log('Compressed blob size:', finalBlob.size);
          }
        } catch (compressionError) {
          console.warn('Image compression failed, using original:', compressionError);
          // Continue with original blob if compression fails
        }
      }
      
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `${currentUser.uid}_profile_${timestamp}.jpg`;
      
      console.log('Creating storage reference...');
      const storageRef = ref(storage, `profilePictures/${fileName}`);
      
      console.log('Starting upload to Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, finalBlob, {
        contentType: 'image/jpeg',
        customMetadata: {
          userId: currentUser.uid,
          uploadedAt: new Date().toISOString()
        }
      });
      
      console.log('Upload completed, getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      console.log('Updating user document in Firestore...');
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        avatar: downloadURL,
        updatedAt: new Date()
      });
      
      console.log('Profile update completed successfully');
      
      // Clear timeout since upload succeeded
      clearTimeout(uploadTimeout);
      
      // Update UI state
      onImageUpdate(downloadURL);
      setShowCrop(false);
      setCropImageData(null);
      
      toast({
        title: "Success!",
        description: "Profile picture updated successfully"
      });
      
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      
      // Clear timeout
      clearTimeout(uploadTimeout);
      
      let errorMessage = "Failed to upload profile picture. Please try again.";
      
      if (error?.code === 'storage/unauthorized') {
        errorMessage = "Permission denied. Please try logging out and back in.";
      } else if (error?.code === 'storage/quota-exceeded') {
        errorMessage = "Storage quota exceeded. Please contact support.";
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error?.message?.includes('timeout')) {
        errorMessage = "Upload timed out. Please try again with a smaller image.";
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
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
    showCrop,
    cropImageData,
    handleFileChange,
    handleCropDone,
    handleCropCancel,
    handleRemovePhoto
  };
};
