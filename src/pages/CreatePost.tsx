import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { shareMediaToChats } from '../services/chat/shareService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '../utils/logger';
import { useUploadQueue } from '../hooks/useUploadQueue';
import CameraInterface from '../components/camera/CameraInterface';
import MediaPreview from '../components/camera/MediaPreview';
import ShareToFollowers from '../components/camera/ShareToFollowers';
import GalleryPicker from '../components/camera/GalleryPicker';
import UploadProgressIndicator from '../components/upload/UploadProgressIndicator';

type ViewMode = 'camera' | 'gallery' | 'preview' | 'share';

const CreatePost = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('camera');
  const [selectedMedia, setSelectedMedia] = useState<{type: 'image' | 'video', data: string, file: File} | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { tasks, addUpload, retryUpload, cancelUpload } = useUploadQueue();

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

  const handleUpdateMedia = (updatedMedia: {type: 'image' | 'video', data: string, file: File}) => {
    setSelectedMedia(updatedMedia);
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

  // Remove the old compression function as it's now handled by the upload queue

  const handlePost = async (caption: string) => {
    if (!selectedMedia || !currentUser) return;
    
    setLoading(true);
    
    try {
      // Check if it's a video - treat videos as reels
      if (selectedMedia.type === 'video') {
        const { createReelSkeleton, uploadReelVideo, updateReelWithMedia } = await import('../services/reelService');
        
        // Create reel skeleton first
        const reelId = await createReelSkeleton(currentUser.uid, caption);
        
        // Upload video to correct path
        const videoURL = await uploadReelVideo(selectedMedia.file, currentUser.uid, reelId);
        
        // Update reel with video URL
        await updateReelWithMedia(reelId, videoURL);
        
        toast({
          title: "Reel uploaded!",
          description: "Your reel has been posted successfully."
        });
      } else {
        // Handle images as regular posts
        await addUpload(currentUser.uid, selectedMedia.file, caption, selectedMedia.type);
        
        toast({
          title: "Post uploading!",
          description: "Your post is uploading in the background."
        });
      }
      
      // Navigate back to home immediately
      navigate('/');
    } catch (error) {
      logger.error('Error posting content:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
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
          onUpdateMedia={handleUpdateMedia}
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
      return (
        <>
          <UploadProgressIndicator
            tasks={tasks}
            onRetry={retryUpload}
            onCancel={cancelUpload}
          />
          {null}
        </>
      );
  }
};

export default CreatePost;
