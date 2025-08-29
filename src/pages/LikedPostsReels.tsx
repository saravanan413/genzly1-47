
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Heart, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';

interface LikedItem {
  id: string;
  postId: string;
  mediaURL: string;
  type: 'post' | 'reel';
  likedAt: any;
  username?: string;
  caption?: string;
}

const LikedPostsReels = () => {
  const { currentUser } = useAuth();
  const [likedItems, setLikedItems] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingLike, setRemovingLike] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Listen to liked posts in real-time
    const unsubscribe = onSnapshot(
      collection(db, 'users', currentUser.uid, 'likedPosts'),
      async (snapshot) => {
        console.log('Liked posts snapshot received, docs:', snapshot.size);
        
        if (snapshot.empty) {
          setLikedItems([]);
          setLoading(false);
          return;
        }

        try {
          const likedData: LikedItem[] = [];
          
          // Process each liked item
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            console.log('Processing liked item:', data);
            
            // Try to get the actual post data
            let postData = null;
            try {
              // First try posts collection
              const postDoc = await getDocs(query(collection(db, 'posts'), where('__name__', '==', data.postId || docSnap.id)));
              if (!postDoc.empty) {
                postData = { id: postDoc.docs[0].id, ...postDoc.docs[0].data() };
              } else {
                // Try reels collection
                const reelDoc = await getDocs(query(collection(db, 'reels'), where('__name__', '==', data.postId || docSnap.id)));
                if (!reelDoc.empty) {
                  postData = { id: reelDoc.docs[0].id, ...reelDoc.docs[0].data(), type: 'reel' };
                }
              }
            } catch (error) {
              console.error('Error fetching post data:', error);
            }

            likedData.push({
              id: docSnap.id,
              postId: data.postId || docSnap.id,
              mediaURL: postData?.mediaURL || data.mediaURL || '/placeholder.svg',
              type: data.type || (postData?.type === 'reel' ? 'reel' : 'post'),
              likedAt: data.likedAt || data.timestamp,
              username: postData?.username || data.username,
              caption: postData?.caption || data.caption
            });
          }
          
          // Sort by liked date
          likedData.sort((a, b) => {
            const aTime = a.likedAt?.toMillis?.() || 0;
            const bTime = b.likedAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          
          console.log('Final liked items:', likedData);
          setLikedItems(likedData);
        } catch (error) {
          console.error('Error processing liked items:', error);
          setLikedItems([]);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching liked posts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleRemoveLike = async (itemId: string, postId: string) => {
    if (!currentUser) return;

    setRemovingLike(itemId);
    try {
      // Remove from user's liked posts
      await deleteDoc(doc(db, 'users', currentUser.uid, 'likedPosts', itemId));
      
      // Remove from global likes collection
      const likesQuery = query(
        collection(db, 'likes'),
        where('userId', '==', currentUser.uid),
        where('postId', '==', postId)
      );
      const likesSnapshot = await getDocs(likesQuery);
      
      for (const likeDoc of likesSnapshot.docs) {
        await deleteDoc(likeDoc.ref);
      }

      toast({
        title: "Like removed",
        description: "Post removed from your liked items"
      });
    } catch (error) {
      console.error('Error removing like:', error);
      toast({
        title: "Error",
        description: "Failed to remove like. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRemovingLike(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center">
            <button onClick={() => navigate('/settings')} className="mr-4">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">Liked Posts</h1>
          </div>
          <div className="p-4 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center">
          <button onClick={() => navigate('/settings')} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Liked Posts</h1>
        </div>

        <div className="p-4">
          {likedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No liked posts yet</h2>
              <p className="text-muted-foreground">You haven't liked anything yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {likedItems.map((item) => (
                <div key={item.id} className="aspect-square relative group">
                  <img
                    src={item.mediaURL}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  {item.type === 'reel' && (
                    <div className="absolute top-2 right-2">
                      <Play className="w-4 h-4 text-white" fill="white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveLike(item.id, item.postId)}
                      disabled={removingLike === item.id}
                    >
                      {removingLike === item.id ? 'Removing...' : 'Remove Like'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LikedPostsReels;
