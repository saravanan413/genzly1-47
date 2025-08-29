
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post } from '../services/firestoreService';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LikedPosts = () => {
  const { currentUser } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (!currentUser) return;

      try {
        const likesQuery = query(
          collection(db, 'likes'),
          where('userId', '==', currentUser.uid)
        );
        
        const likesSnapshot = await getDocs(likesQuery);
        const postIds = likesSnapshot.docs.map(doc => doc.data().postId);
        
        if (postIds.length > 0) {
          // Fetch posts based on liked post IDs
          const postsQuery = query(
            collection(db, 'posts'),
            where('__name__', 'in', postIds)
          );
          
          const postsSnapshot = await getDocs(postsQuery);
          const posts = postsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];
          
          setLikedPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching liked posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Liked Posts</h1>
      </div>
      
      <div className="p-4">
        {likedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No liked posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {likedPosts.map((post) => (
              <div key={post.id} className="aspect-square bg-gray-100">
                <img
                  src={post.mediaURL}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedPosts;
