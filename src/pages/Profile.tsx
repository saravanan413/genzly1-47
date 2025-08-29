
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PostModal from '../components/PostModal';
import DmShareSheet from '../components/DmShareSheet';
import FollowersFollowingModal from '../components/FollowersFollowingModal';
import CommentPage from '../components/CommentPage';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import PostsGrid from '../components/profile/PostsGrid';
import SavedPostsEmpty from '../components/profile/SavedPostsEmpty';
import HighlightsBar from '../components/profile/HighlightsBar';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile, useUserPosts } from '../hooks/useFirebaseData';
import { subscribeToFollowersCount, subscribeToFollowingCount } from '../services/follow';

const Profile = () => {
  const { currentUser } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(currentUser?.uid || '');
  const { posts: userPosts, loading: postsLoading } = useUserPosts(currentUser?.uid || '');
  
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [shareData, setShareData] = useState<{ isOpen: boolean; postId?: number }>(
    { isOpen: false }
  );
  const [followersModal, setFollowersModal] = useState<null | "followers" | "following">(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

  // Subscribe to follow counts
  useEffect(() => {
    if (currentUser) {
      const unsubscribeFollowers = subscribeToFollowersCount(currentUser.uid, (count) => {
        setFollowCounts(prev => ({ ...prev, followers: count }));
      });
      
      const unsubscribeFollowing = subscribeToFollowingCount(currentUser.uid, (count) => {
        setFollowCounts(prev => ({ ...prev, following: count }));
      });
      
      return () => {
        unsubscribeFollowers();
        unsubscribeFollowing();
      };
    }
  }, [currentUser]);

  const handleImageClick = (index: number) => setSelectedPostIndex(index);
  const handleCloseModal = () => setSelectedPostIndex(null);
  const handleCommentClick = (postId: number) => setSelectedPostForComments(postId);
  const handleShareClick = (postId: number) => setShareData({ isOpen: true, postId });
  const handleModalNavigate = (direction: 'prev' | 'next') => {
    if (selectedPostIndex === null) return;
    if (direction === 'prev' && selectedPostIndex > 0) {
      setSelectedPostIndex(selectedPostIndex - 1);
    }
    if (direction === 'next' && selectedPostIndex < userPosts.length - 1) {
      setSelectedPostIndex(selectedPostIndex + 1);
    }
  };

  // Transform Firebase posts to expected format
  const transformedPosts = userPosts.map(post => ({
    type: post.mediaType,
    url: post.mediaURL,
  }));

  // Create profile with real follow counts
  const profileWithCounts = profile ? { ...profile, ...followCounts } : null;

  if (profileLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background w-full">
        <div className="p-3 md:p-4">
          <div className="container mx-auto max-w-4xl">
            <ProfileHeader
              userPosts={transformedPosts}
              onFollowersClick={() => setFollowersModal("followers")}
              onFollowingClick={() => setFollowersModal("following")}
              profile={profileWithCounts}
            />
            
            {/* Add Highlights Bar */}
            <HighlightsBar
              userId={currentUser?.uid || ''}
              isOwnProfile={true}
            />
            
            <ProfileTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            
            {activeTab === 'posts' ? (
              postsLoading ? (
                <div className="grid grid-cols-3 gap-0.5 md:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : transformedPosts.length > 0 ? (
                <PostsGrid
                  posts={transformedPosts}
                  onImageClick={handleImageClick}
                  onShareClick={handleShareClick}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">📷</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                  <p className="text-gray-500 text-center">When you share posts, they'll appear here.</p>
                </div>
              )
            ) : (
              <SavedPostsEmpty />
            )}
          </div>
        </div>

        {selectedPostIndex !== null && transformedPosts.length > 0 && (
          <PostModal
            isOpen={selectedPostIndex !== null}
            onClose={handleCloseModal}
            posts={transformedPosts.map((post, i) => ({
              id: i + 1,
              url: post.url,
              type: post.type,
              user: { 
                name: profile?.username || 'user', 
                avatar: profile?.avatar || '/placeholder.svg' 
              }
            }))}
            currentPostIndex={selectedPostIndex}
            onNavigatePost={handleModalNavigate}
            postId={selectedPostIndex + 1}
            imageUrl={transformedPosts[selectedPostIndex].url}
            user={{
              name: profile?.username || 'user',
              avatar: profile?.avatar || '/placeholder.svg'
            }}
            onOpenComments={() => handleCommentClick(selectedPostIndex + 1)}
            onOpenShare={() => handleShareClick(selectedPostIndex + 1)}
          />
        )}

        <DmShareSheet
          isOpen={shareData.isOpen}
          onClose={() => setShareData({ isOpen: false })}
          content={{
            type: "post",
            postId: shareData.postId,
            meta: {
              image: shareData.postId && transformedPosts[shareData.postId - 1] ? transformedPosts[shareData.postId - 1].url : undefined,
              owner: {
                username: profile?.username || 'user',
                name: profile?.displayName || 'User',
                avatar: profile?.avatar || '/placeholder.svg'
              }
            }
          }}
        />

        <FollowersFollowingModal
          isOpen={!!followersModal}
          onClose={() => setFollowersModal(null)}
          type={followersModal || "followers"}
        />

        <CommentPage
          isOpen={selectedPostForComments !== null}
          onClose={() => setSelectedPostForComments(null)}
          postId={(selectedPostForComments || '').toString()}
        />
      </div>
    </Layout>
  );
};

export default Profile;
