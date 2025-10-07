import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createCompletePostWithVersions } from '../services/mediaService';
import { shareMediaToChats } from '../services/chat/shareService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '../utils/logger';
import { optimizeImage, optimizeVideo } from '../utils/mediaOptimization';
import CameraInterface from '../components/camera/CameraInterface';
import MediaPreview from '../components/camera/MediaPreview';
import ShareToFollowers from '../components/camera/ShareToFollowers';
import GalleryPicker from '../components/camera/GalleryPicker';
import MediaEditor from '../components/camera/MediaEditor';
import InstagramUploadProgress from '../components/ui/InstagramUploadProgress';

type ViewMode = 'camera' | 'gallery' | 'edit' | 'preview' | 'share';

const CreatePost = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('camera');
  const [selectedMedia, setSelectedMedia] = useState<{type: 'image' | 'video', data: string, file: File} | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [uploadStages, setUploadStages] = useState({
    optimizing: 0,
    uploadingOriginal: 0,
    uploadingFeed: 0,
    uploadingThumb: 0,
    savingMetadata: 0
  });
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
    setViewMode('edit');
  };

  const handleBackToCamera = () => {
    setViewMode('camera');
    setSelectedMedia(null);
  };

  const handleShareToFollowers = () => {
    setViewMode('share');
  };

  const handleEditComplete = (editedMedia: {
    type: 'image' | 'video', 
    data: string, 
    file: File,
    settings: {
      allowComments: boolean;
      hideLikeCount: boolean;
    }
  }) => {
    setSelectedMedia(editedMedia);
    setViewMode('preview');
  };

  const handleBackToEdit = () => {
    setViewMode('edit');
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


  const handlePost = async (caption: string) => {
    if (!selectedMedia || !currentUser) return;
    
    setLoading(true);
    setShowProgress(true);
    
    // Reset stages
    setUploadStages({
      optimizing: 0,
      uploadingOriginal: 0,
      uploadingFeed: 0,
      uploadingThumb: 0,
      savingMetadata: 0
    });
    
    try {
      // Optimize media first
      logger.info('📸 Optimizing media before upload...');
      setUploadStages(prev => ({ ...prev, optimizing: 10 }));
      
      let optimized;
      if (selectedMedia.type === 'image') {
        optimized = await optimizeImage(selectedMedia.file);
      } else {
        optimized = await optimizeVideo(selectedMedia.file);
      }
      
      setUploadStages(prev => ({ ...prev, optimizing: 100 }));
      logger.info('✅ Media optimization complete');
      
      // Progress callback for uploads
      const onProgress = (stage: string, progress: number) => {
        setUploadStages(prev => ({
          ...prev,
          [stage]: progress
        }));
      };
      
      if (selectedMedia.type === 'image') {
        // Upload with all optimized versions
        await createCompletePostWithVersions(
          currentUser.uid, 
          caption, 
          optimized,
          selectedMedia.type,
          (selectedMedia as any).settings || { allowComments: true, hideLikeCount: false },
          onProgress
        );
        
        toast({
          title: "Success!",
          description: "Post shared successfully!"
        });
      } else {
        // For videos, create complete reel
        const { createCompleteReel } = await import('../services/reelService');
        
        await createCompleteReel(
          currentUser.uid, 
          caption, 
          selectedMedia.file,
          (selectedMedia as any).settings || { allowComments: true, hideLikeCount: false }
        );
        
        toast({
          title: "Success!",
          description: "Reel shared successfully!"
        });
      }
      
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      setShowProgress(false);
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
  const renderContent = () => {
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
      
      case 'edit':
        return selectedMedia ? (
          <MediaEditor
            media={selectedMedia}
            onBack={handleBackToCamera}
            onEditComplete={handleEditComplete}
          />
        ) : null;
      
      case 'preview':
        return selectedMedia ? (
          <MediaPreview
            media={selectedMedia}
            onBack={handleBackToEdit}
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

  return (
    <>
      {renderContent()}
      
      {/* Instagram-style Upload Progress */}
      {showProgress && selectedMedia && (
        <InstagramUploadProgress
          open={showProgress}
          mediaType={selectedMedia.type}
          stages={uploadStages}
          onOpenChange={setShowProgress}
        />
      )}
    </>
  );
};

export default CreatePost;
