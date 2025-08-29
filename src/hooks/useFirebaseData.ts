
import { useState, useEffect } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  getFeedPosts,
  getUserPosts,
  getReels,
  getActiveStories,
  getUserProfile,
  getFollowStats,
  Post,
  Reel,
  Story,
  UserProfile
} from '../services/firestoreService';

export const useFeedPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  const loadPosts = async (refresh = false) => {
    setLoading(true);
    try {
      const { posts: newPosts, lastDoc: newLastDoc } = await getFeedPosts(
        refresh ? undefined : lastDoc
      );
      
      if (refresh) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setLastDoc(newLastDoc);
      setHasMore(newPosts.length > 0);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts(true);
  }, []);

  const refreshPosts = () => loadPosts(true);
  const loadMorePosts = () => {
    if (!loading && hasMore) {
      loadPosts();
    }
  };

  return {
    posts,
    loading,
    hasMore,
    refreshPosts,
    loadMorePosts
  };
};

export const useUserPosts = (userId: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadUserPosts = async () => {
      setLoading(true);
      try {
        const userPosts = await getUserPosts(userId);
        setPosts(userPosts);
      } catch (error) {
        console.error('Error loading user posts:', error);
      }
      setLoading(false);
    };

    loadUserPosts();
  }, [userId]);

  return { posts, loading };
};

export const useReels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  const loadReels = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const { reels: newReels, lastDoc: newLastDoc } = await getReels(lastDoc);
      setReels(prev => [...prev, ...newReels]);
      setLastDoc(newLastDoc);
      setHasMore(newReels.length > 0);
    } catch (error) {
      console.error('Error loading reels:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReels();
  }, []);

  return {
    reels,
    loading,
    hasMore,
    loadMoreReels: loadReels
  };
};

export const useStories = () => {
  const [stories, setStories] = useState<{ [userId: string]: Story[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      setLoading(true);
      try {
        const activeStories = await getActiveStories();
        setStories(activeStories);
      } catch (error) {
        console.error('Error loading stories:', error);
      }
      setLoading(false);
    };

    loadStories();
    
    // Refresh stories every 5 minutes
    const interval = setInterval(loadStories, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { stories, loading };
};

export const useUserProfile = (userId: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const userProfile = await getUserProfile(userId);
        if (userProfile) {
          const followStats = await getFollowStats(userId);
          setProfile({ ...userProfile, ...followStats });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
      setLoading(false);
    };

    loadProfile();
  }, [userId]);

  return { profile, loading };
};
