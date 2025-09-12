
import { useState, useEffect } from 'react';
import { getReels } from '../services/firestoreService';
import { likeReel, unlikeReel, checkIfLiked } from '../services/postReactionsService';
import { useAuth } from '../contexts/AuthContext';
import { Reel } from '../types';

// Define the Firestore document data structure for reels
interface FirestoreReelData {
  username: string;
  userAvatar?: string;
  videoURL: string;
  thumbnailURL?: string;
  caption: string;
  likeCount: number;
  commentCount: number;
  shares?: number;
  music?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
  timestamp: any;
}

export const useReelsData = (pageSize = 10) => {
  const { currentUser } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [pageSize]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { reels: firestoreReels, lastDoc } = await getReels(undefined, pageSize);
      
      // Transform Firestore data to match Reel interface
      const transformedReels = firestoreReels.map(reel => ({
        id: parseInt(reel.id) || Math.floor(Math.random() * 1000000),
        user: {
          name: reel.user.username || 'unknown',
          avatar: reel.user.avatar || '/placeholder.svg',
          isFollowing: false // TODO: Implement follow status check
        },
        videoUrl: reel.videoURL || reel.mediaURL || '',
        videoThumbnail: reel.thumbnailURL || '',
        caption: reel.caption || '',
        likes: reel.likes || 0,
        comments: reel.comments || 0,
        shares: reel.shares || 0,
        music: reel.music || 'Original Audio',
        isLiked: false, // Will be updated by checkIfLiked
        isSaved: false, // TODO: Implement saved status
        // Additional properties for compatibility
        userId: reel.userId,
        username: reel.user.username,
        userAvatar: reel.user.avatar,
        videoURL: reel.videoURL || reel.mediaURL,
        timestamp: reel.timestamp,
        likeCount: reel.likes || 0,
        commentCount: reel.comments || 0,
        isFollowing: false
      })) as Reel[];
      
      // Check liked status for each reel if user is logged in
      if (currentUser) {
        for (const reel of transformedReels) {
          if (reel.userId) {
            const isLiked = await checkIfLiked(`reels/${reel.userId}`, currentUser.uid);
            reel.isLiked = isLiked;
          }
        }
      }
      
      setReels(transformedReels);
      setHasMore(transformedReels.length === pageSize);
      setLastVisible(lastDoc);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreReels = async () => {
    if (!hasMore || loading || !lastVisible) return;

    setLoading(true);
    try {
      const { reels: firestoreReels, lastDoc } = await getReels(lastVisible, pageSize);
      
      const transformedReels = firestoreReels.map(reel => ({
        id: parseInt(reel.id) || Math.floor(Math.random() * 1000000),
        user: {
          name: reel.user.username || 'unknown',
          avatar: reel.user.avatar || '/placeholder.svg',
          isFollowing: false
        },
        videoUrl: reel.videoURL || reel.mediaURL || '',
        videoThumbnail: reel.thumbnailURL || '',
        caption: reel.caption || '',
        likes: reel.likes || 0,
        comments: reel.comments || 0,
        shares: reel.shares || 0,
        music: reel.music || 'Original Audio',
        isLiked: false,
        isSaved: false,
        userId: reel.userId,
        username: reel.user.username,
        userAvatar: reel.user.avatar,
        videoURL: reel.videoURL || reel.mediaURL,
        timestamp: reel.timestamp,
        likeCount: reel.likes || 0,
        commentCount: reel.comments || 0,
        isFollowing: false
      })) as Reel[];
      
      if (currentUser) {
        for (const reel of transformedReels) {
          if (reel.userId) {
            const isLiked = await checkIfLiked(`reels/${reel.userId}`, currentUser.uid);
            reel.isLiked = isLiked;
          }
        }
      }
      
      setReels(prevReels => [...prevReels, ...transformedReels]);
      setHasMore(transformedReels.length === pageSize);
      setLastVisible(lastDoc);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId: string) => {
    if (!currentUser) return;

    try {
      const reel = reels.find(r => r.id.toString() === reelId);
      if (!reel) return;

      if (reel.isLiked) {
        await unlikeReel(reel.userId || reel.id.toString(), currentUser.uid);
      } else {
        await likeReel(reel.userId || reel.id.toString(), currentUser.uid);
      }

      // Update local state
      setReels(prev => prev.map(r => 
        r.id.toString() === reelId 
          ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes - 1 : r.likes + 1 }
          : r
      ));
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleSave = async (reelId: string) => {
    console.log('Saving reel:', reelId);
    // Add save logic here
  };

  const handleFollow = async (username: string) => {
    console.log('Following user:', username);
    // Add follow logic here
  };

  return {
    reels,
    loading,
    hasMore,
    error,
    loadMoreReels,
    handleLike,
    handleSave,
    handleFollow
  };
};
