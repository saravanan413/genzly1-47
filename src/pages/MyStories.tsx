
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Play, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';

interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  text?: string;
  backgroundColor?: string;
  createdAt: any;
  expiresAt: any;
  viewers: string[];
  viewCount: number;
}

const MyStories = () => {
  const { currentUser } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Listen to user's stories in real-time
    const storiesQuery = query(
      collection(db, 'stories'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      storiesQuery,
      (snapshot) => {
        console.log('Stories snapshot received, docs:', snapshot.size);
        
        const userStories = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Story[];
        
        setStories(userStories);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching stories:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const storyTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now.getTime() - storyTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to delete this story?')) {
      return;
    }

    setDeleting(storyId);
    try {
      await deleteDoc(doc(db, 'stories', storyId));

      toast({
        title: "Story deleted",
        description: "Your story has been deleted"
      });
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
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
            <h1 className="text-lg font-semibold">My Stories</h1>
          </div>
          <div className="p-4 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-32"></div>
                </div>
              </div>
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
          <h1 className="text-lg font-semibold">My Stories</h1>
        </div>

        <div className="p-4">
          {stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Play className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No stories yet</h2>
              <p className="text-muted-foreground">You haven't added any stories yet.</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/add-story')}
              >
                Add Story
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <div key={story.id} className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted">
                    {story.mediaUrl ? (
                      <img
                        src={story.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: story.backgroundColor || '#000' }}
                      >
                        {story.text?.charAt(0) || 'T'}
                      </div>
                    )}
                    {story.mediaType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" fill="white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{formatTimeAgo(story.createdAt)}</span>
                      {story.text && (
                        <span className="text-sm text-muted-foreground">• Text story</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                      <Eye className="w-4 h-4" />
                      <span>{story.viewCount || 0} views</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStory(story.id)}
                    disabled={deleting === story.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyStories;
