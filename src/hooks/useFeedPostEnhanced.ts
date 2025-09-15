import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post } from '../services/firestoreService';
import { batchGetUserProfiles } from '../services/userService';

export const useFeedPostEnhanced = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const postsQuery = query(
      postsRef,
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      async (snapshot) => {
        try {
          const postsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];

          // Check if posts already have user data, if not, batch fetch user profiles
          const postsNeedingUserData = postsData.filter(post => !post.user);
          if (postsNeedingUserData.length > 0) {
            const userIds = [...new Set(postsNeedingUserData.map(post => post.userId))];
            const userProfiles = await batchGetUserProfiles(userIds);
            
            // Merge user data into posts
            postsData.forEach(post => {
              if (!post.user) {
                const userProfile = userProfiles.get(post.userId);
                post.user = {
                  username: userProfile?.username || 'unknown',
                  displayName: userProfile?.displayName || 'Unknown User',
                  avatar: userProfile?.avatar || '/placeholder.svg'
                };
              }
            });
          }

          setPosts(postsData);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching posts:', err);
          setError('Failed to load posts');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error in posts listener:', err);
        setError('Failed to load posts');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { posts, loading, error };
};