
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Archive as ArchiveIcon, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';

interface ArchivedPost {
  id: string;
  mediaURL: string;
  caption: string;
  archivedAt: any;
  originalPostId?: string;
}

const Archive = () => {
  const { currentUser } = useAuth();
  const [archivedPosts, setArchivedPosts] = useState<ArchivedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Listen to archived posts in real-time
    const unsubscribe = onSnapshot(
      collection(db, 'users', currentUser.uid, 'archived'),
      (snapshot) => {
        console.log('Archived posts snapshot received, docs:', snapshot.size);
        
        const archived = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ArchivedPost[];
        
        // Sort by archived date (newest first)
        archived.sort((a, b) => {
          const aTime = a.archivedAt?.toMillis?.() || 0;
          const bTime = b.archivedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        setArchivedPosts(archived);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching archived posts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleRestore = async (postId: string) => {
    if (!currentUser) return;

    setProcessing(postId);
    try {
      const batch = writeBatch(db);
      const post = archivedPosts.find(p => p.id === postId);
      
      if (post) {
        // Add back to posts collection
        const postRef = doc(collection(db, 'posts'));
        batch.set(postRef, {
          userId: currentUser.uid,
          mediaURL: post.mediaURL,
          caption: post.caption,
          likes: 0,
          comments: 0,
          timestamp: post.archivedAt, // Use original timestamp or current
          username: currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
        });

        // Remove from archived
        const archivedRef = doc(db, 'users', currentUser.uid, 'archived', postId);
        batch.delete(archivedRef);

        await batch.commit();

        toast({
          title: "Post restored",
          description: "Post has been restored to your profile"
        });
      }
    } catch (error) {
      console.error('Error restoring post:', error);
      toast({
        title: "Error",
        description: "Failed to restore post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to permanently delete this post?')) {
      return;
    }

    setProcessing(postId);
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'archived', postId));

      toast({
        title: "Post deleted",
        description: "Post has been permanently deleted"
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
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
            <h1 className="text-lg font-semibold">Archive</h1>
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
          <h1 className="text-lg font-semibold">Archive</h1>
        </div>

        <div className="p-4">
          {archivedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ArchiveIcon className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No archived posts</h2>
              <p className="text-muted-foreground">Posts you archive will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {archivedPosts.map((post) => (
                <div key={post.id} className="aspect-square relative group">
                  <img
                    src={post.mediaURL}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestore(post.id)}
                      disabled={processing === post.id}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      disabled={processing === post.id}
                    >
                      <Trash2 className="w-4 h-4" />
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

export default Archive;
