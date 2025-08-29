import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { uploadPostMedia, createPost } from '../services/mediaService';
import { shareMediaToChats } from '../services/chat/shareService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '../utils/logger';
import CameraInterface from '../components/camera/CameraInterface';
import MediaPreview from '../components/camera/MediaPreview';
import ShareToFollowers from '../components/camera/ShareToFollowers';
import GalleryPicker from '../components/camera/GalleryPicker';

type ViewMode = 'camera' | 'gallery' | 'preview' | 'share';

const CreatePost = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('camera');
  const [selectedMedia, setSelectedMedia] = useState<{type: 'image' | 'video', data: string, file: File} | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleMediaCaptured = (media: {type: 'image' | 'video', data: string, file: File}) => {
    setSelectedMedia(media);
    setViewMode('preview');
  };

  const handleGallerySelect = () => {
    setViewMode('gallery');
  };

  const handleGalleryMediaSelected = (media: {type: 'image' | 'video', data: string, file: File}) => {
    setSelectedMedia(media);
    setViewMode('preview');
  };

  const handleBackToCamera = () => {
    setViewMode('camera');
    setSelectedMedia(null);
  };

  const handleShareToFollowers = () => {
    setViewMode('share');
  };

  const handleBackToPreview = () => {
    setViewMode('preview');
  };

  const handleShareToUsers = async (selectedUsers: string[], caption: string) => {
    if (!selectedMedia || !currentUser) return;
    
    setLoading(true);
    
    try {
      await shareMediaToChats(
        currentUser.uid,
        selectedUsers,
        selectedMedia,
        caption
      );
      
      toast({
        title: "Success!",
        description: `${selectedMedia.type === 'image' ? 'Photo' : 'Video'} shared with ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'}!`
      });
      
      // Navigate back to home
      navigate('/');
    } catch (error) {
      logger.error('Error sharing media:', error);
      toast({
        title: "Error",
        description: "Failed to share media. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1080px)
        const maxSize = 1080;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePost = async (caption: string) => {
    if (!selectedMedia || !currentUser) return;
    
    setLoading(true);
    
    try {
      // Compress media if it's an image
      let fileToUpload = selectedMedia.file;
      if (selectedMedia.type === 'image') {
        fileToUpload = await compressImage(selectedMedia.file);
      }
      
      // Upload media to Firebase Storage
      const mediaURL = await uploadPostMedia(fileToUpload, currentUser.uid);
      
      // Create post in Firestore
      await createPost(
        currentUser.uid,
        caption,
        mediaURL,
        selectedMedia.type
      );
      
      toast({
        title: "Success!",
        description: `${selectedMedia.type === 'image' ? 'Post' : 'Reel'} shared successfully!`
      });
      
      // Navigate back to home
      navigate('/');
    } catch (error) {
      logger.error('Error posting content:', error);
      toast({
        title: "Error",
        description: "Failed to share content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Please log in</h2>
          <p className="text-muted-foreground">You need to be logged in to create posts</p>
        </div>
      </div>
    );
  }

  // Render based on current view mode
  switch (viewMode) {
    case 'camera':
      return (
        <CameraInterface
          onMediaCaptured={handleMediaCaptured}
          onGallerySelect={handleGallerySelect}
        />
      );
    
    case 'gallery':
      return (
        <GalleryPicker
          onMediaSelected={handleGalleryMediaSelected}
          onBack={handleBackToCamera}
        />
      );
    
    case 'preview':
      return selectedMedia ? (
        <MediaPreview
          media={selectedMedia}
          onBack={handleBackToCamera}
          onPost={handlePost}
          onShareToFollowers={handleShareToFollowers}
          loading={loading}
        />
      ) : null;
    
    case 'share':
      return selectedMedia ? (
        <ShareToFollowers
          media={selectedMedia}
          onBack={handleBackToPreview}
          onShare={handleShareToUsers}
          loading={loading}
        />
      ) : null;
    
    default:
      return null;
  }
};

export default CreatePost;
