
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToFollowStatus,
  subscribeToFollowersCount,
  subscribeToFollowingCount,
  subscribeToFollowRequestStatus,
  followUser,
  unfollowUser
} from '../services/follow';
import { subscribeToBlockedStatus } from '../services/privacy/privacyService';

export const useUserProfileData = (userId: string | undefined) => {
  const { currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasFollowRequest, setHasFollowRequest] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = userId === currentUser?.uid;

  // Subscribe to follow status with real-time updates
  useEffect(() => {
    if (currentUser && userId && !isOwnProfile) {
      console.log('Setting up follow status subscription for:', currentUser.uid, 'and', userId);
      setInitialLoading(true);
      
      const unsubscribe = subscribeToFollowStatus(currentUser.uid, userId, (status) => {
        console.log('Follow status updated:', status);
        setIsFollowing(status);
        setInitialLoading(false);
        setError(null);
      });
      
      return unsubscribe;
    } else {
      setInitialLoading(false);
    }
  }, [currentUser, userId, isOwnProfile]);

  // Subscribe to follow request status with real-time updates
  useEffect(() => {
    if (currentUser && userId && !isOwnProfile) {
      console.log('Setting up follow request status subscription for:', currentUser.uid, 'and', userId);
      
      const unsubscribe = subscribeToFollowRequestStatus(currentUser.uid, userId, (hasRequest) => {
        console.log('Follow request status updated:', hasRequest);
        setHasFollowRequest(hasRequest);
      });
      
      return unsubscribe;
    }
  }, [currentUser, userId, isOwnProfile]);

  // Subscribe to blocked status with real-time updates
  useEffect(() => {
    if (currentUser && userId && !isOwnProfile) {
      console.log('Setting up blocked status subscription for:', currentUser.uid, 'and', userId);
      
      const unsubscribe = subscribeToBlockedStatus(currentUser.uid, userId, (blocked) => {
        console.log('Blocked status updated:', blocked);
        setIsBlocked(blocked);
      });
      
      return unsubscribe;
    }
  }, [currentUser, userId, isOwnProfile]);

  // Subscribe to followers count with real-time updates
  useEffect(() => {
    if (userId) {
      console.log('Setting up followers count subscription for:', userId);
      const unsubscribe = subscribeToFollowersCount(userId, (count) => {
        console.log('Followers count updated:', count);
        setFollowCounts(prev => ({ ...prev, followers: count }));
      });
      return unsubscribe;
    }
  }, [userId]);

  // Subscribe to following count with real-time updates
  useEffect(() => {
    if (userId) {
      console.log('Setting up following count subscription for:', userId);
      const unsubscribe = subscribeToFollowingCount(userId, (count) => {
        console.log('Following count updated:', count);
        setFollowCounts(prev => ({ ...prev, following: count }));
      });
      return unsubscribe;
    }
  }, [userId]);

  const handleFollowClick = async () => {
    if (!currentUser || !userId || loading || isOwnProfile || initialLoading) {
      console.log('Cannot follow - validation failed:', { 
        currentUser: !!currentUser, 
        userId, 
        loading, 
        isOwnProfile, 
        initialLoading 
      });
      return;
    }

    console.log('Follow button clicked. Current status:', { isFollowing, hasFollowRequest });
    setLoading(true);
    setError(null);
    
    try {
      let success = false;
      
      if (isFollowing || hasFollowRequest) {
        console.log('Attempting to unfollow user or cancel request...');
        success = await unfollowUser(currentUser.uid, userId);
        if (success) {
          console.log('Successfully unfollowed user or cancelled request');
        } else {
          console.error('Failed to unfollow user');
          setError('Failed to unfollow user. Please try again.');
        }
      } else {
        console.log('Attempting to follow user...');
        success = await followUser(currentUser.uid, userId);
        if (success) {
          console.log('Successfully followed user or sent request');
        } else {
          console.error('Failed to follow user');
          setError('Failed to follow user. Please try again.');
        }
      }

      // Clear error on success
      if (success) {
        setError(null);
      }
    } catch (error: any) {
      console.error('Error updating follow status:', error);
      setError('An unexpected error occurred. Please try again.');
      
      // Log specific error details
      if (error?.code === 'permission-denied') {
        console.error('Permission denied - user may not have proper access');
        setError('Permission denied. Please check your account permissions.');
      } else if (error?.code === 'not-found') {
        console.error('User not found');
        setError('User not found. They may have been deleted.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    isFollowing,
    hasFollowRequest,
    isBlocked,
    followCounts,
    loading: loading || initialLoading,
    isOwnProfile,
    error,
    handleFollowClick
  };
};
