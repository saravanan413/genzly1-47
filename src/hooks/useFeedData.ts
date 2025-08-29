
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, startAfter, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types/index';
import { createLikeNotification, createCommentNotification } from '../services/unifiedNotificationService';

interface UseFeedDataProps {
  pageSize?: number;
  userId?: string;
  category?: string;
}

// Define the Firestore document data structure
interface FirestorePostData {
  userId: string;
  username: string;
  userAvatar?: string;
  mediaURL: string;
  mediaType: 'image' | 'video';
  caption: string;
  timestamp: any;
  likes: string[];
  likeCount: number;
  comments: any[];
  commentCount: number;
  location?: string;
  category?: string;
  displayName?: string;
}

export const useFeedData = ({ pageSize = 10, userId, category }: UseFeedDataProps = {}) => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        let q;
        if (userId) {
          // Fetch posts for a specific user
          q = query(
            collection(db, 'posts'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(pageSize)
          );
        } else if (category) {
          // Fetch posts for a specific category
           q = query(
            collection(db, 'posts'),
            where('category', '==', category),
            orderBy('timestamp', 'desc'),
            limit(pageSize)
          );
        }
        else {
          // Fetch all posts
          q = query(
            collection(db, 'posts'),
            orderBy('timestamp', 'desc'),
            limit(pageSize)
          );
        }

        const snapshot = await getDocs(q);

        if (isMounted) {
          const newPosts = snapshot.docs.map(doc => {
            const data = doc.data() as FirestorePostData;
            return {
              id: doc.id,
              userId: data.userId || '',
              username: data.username || '',
              userAvatar: data.userAvatar,
              mediaURL: data.mediaURL || '',
              mediaType: data.mediaType || 'image',
              caption: data.caption || '',
              timestamp: data.timestamp,
              likes: data.likes || [],
              likeCount: data.likeCount || 0,
              comments: data.comments || [],
              commentCount: data.commentCount || 0,
              location: data.location,
              category: data.category,
              user: {
                username: data.username || 'unknown',
                displayName: data.displayName || 'Unknown User',
                avatar: data.userAvatar
              }
            } as Post;
          });
          setPosts(newPosts);
          setHasMore(newPosts.length === pageSize);
          setLastVisible(snapshot.docs[newPosts.length - 1] || null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [pageSize, userId, category]);

  const fetchMoreData = async () => {
    if (!hasMore || loading || !lastVisible) return;

    setLoading(true);
    setError(null);

    try {
      let q;
       if (userId) {
          // Fetch posts for a specific user
          q = query(
            collection(db, 'posts'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            startAfter(lastVisible),
            limit(pageSize)
          );
        } else if (category) {
          // Fetch posts for a specific category
           q = query(
            collection(db, 'posts'),
            where('category', '==', category),
            orderBy('timestamp', 'desc'),
            startAfter(lastVisible),
            limit(pageSize)
          );
        }
        else {
          // Fetch all posts
          q = query(
            collection(db, 'posts'),
            orderBy('timestamp', 'desc'),
            startAfter(lastVisible),
            limit(pageSize)
          );
        }

      const snapshot = await getDocs(q);

      const newPosts = snapshot.docs.map(doc => {
        const data = doc.data() as FirestorePostData;
        return {
          id: doc.id,
          userId: data.userId || '',
          username: data.username || '',
          userAvatar: data.userAvatar,
          mediaURL: data.mediaURL || '',
          mediaType: data.mediaType || 'image',
          caption: data.caption || '',
          timestamp: data.timestamp,
          likes: data.likes || [],
          likeCount: data.likeCount || 0,
          comments: data.comments || [],
          commentCount: data.commentCount || 0,
          location: data.location,
          category: data.category,
          user: {
            username: data.username || 'unknown',
            displayName: data.displayName || 'Unknown User',
            avatar: data.userAvatar
          }
        } as Post;
      });
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      setHasMore(newPosts.length === pageSize);
      setLastVisible(snapshot.docs[newPosts.length - 1] || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setLastVisible(null);
    
    try {
      let q;
      if (userId) {
        q = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(pageSize)
        );
      } else if (category) {
        q = query(
          collection(db, 'posts'),
          where('category', '==', category),
          orderBy('timestamp', 'desc'),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, 'posts'),
          orderBy('timestamp', 'desc'),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map(doc => {
        const data = doc.data() as FirestorePostData;
        return {
          id: doc.id,
          userId: data.userId || '',
          username: data.username || '',
          userAvatar: data.userAvatar,
          mediaURL: data.mediaURL || '',
          mediaType: data.mediaType || 'image',
          caption: data.caption || '',
          timestamp: data.timestamp,
          likes: data.likes || [],
          likeCount: data.likeCount || 0,
          comments: data.comments || [],
          commentCount: data.commentCount || 0,
          location: data.location,
          category: data.category,
          user: {
            username: data.username || 'unknown',
            displayName: data.displayName || 'Unknown User',
            avatar: data.userAvatar
          }
        } as Post;
      });
      setPosts(newPosts);
      setHasMore(newPosts.length === pageSize);
      setLastVisible(snapshot.docs[newPosts.length - 1] || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (postId: string) => {
    // Implement like logic
    console.log('Liking post:', postId);
  };

  const handleFollow = async (userId: string) => {
    // Implement follow logic
    console.log('Following user:', userId);
  };

  const handleDoubleClick = async (postId: string) => {
    // Implement double click logic (like)
    console.log('Double clicked post:', postId);
  };

  const createLikeNotificationForPost = async (postOwnerId: string, postId: string) => {
    if (currentUser?.uid) {
      await createLikeNotification(postOwnerId, currentUser.uid, postId);
    }
  };

  const createCommentNotificationForPost = async (postOwnerId: string, postId: string, commentText?: string) => {
    if (currentUser?.uid) {
      await createCommentNotification(postOwnerId, currentUser.uid, postId, commentText);
    }
  };

  return {
    posts,
    loading,
    hasMore,
    error: error || '',
    refreshing,
    fetchMoreData,
    loadMorePosts: fetchMoreData,
    handleRefresh,
    handleLike,
    handleFollow,
    handleDoubleClick,
    createLikeNotification: createLikeNotificationForPost,
    createCommentNotification: createCommentNotificationForPost,
  };
};
