
import React from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import UserProfileContent from '../components/profile/UserProfileContent';
import UserProfileModals from '../components/profile/UserProfileModals';
import HighlightsBar from '../components/profile/HighlightsBar';
import { useUserProfile, useUserPosts } from '../hooks/useFirebaseData';
import { useUserProfileData } from '../hooks/useUserProfileData';
import { useUserProfileState } from '../hooks/useUserProfileState';
import { useUserProfileHandlers } from '../hooks/useUserProfileHandlers';
import { logger } from '../utils/logger';

const UserProfile = () => {
  const { userId } = useParams();
  
  logger.debug('UserProfile component loaded for userId:', userId);
  
  // Use real Firebase data - make sure userId is provided
  const { profile: user, loading: profileLoading } = useUserProfile(userId || '');
  const { posts: userPosts, loading: postsLoading } = useUserPosts(userId || '');
  const { 
    isFollowing, 
    hasFollowRequest, 
    isBlocked, 
    followCounts, 
    loading, 
    isOwnProfile, 
    handleFollowClick 
  } = useUserProfileData(userId);
  
  // State management
  const {
    selectedPost,
    setSelectedPost,
    selectedPostForComments,
    setSelectedPostForComments,
    showShareSheet,
    setShowShareSheet,
    followersModal,
    setFollowersModal
  } = useUserProfileState();

  // Event handlers
  const {
    handleMessageClick,
    handleImageClick,
    handleCommentClick,
    handleCloseModal,
    handleConnectionsClick,
    handleShareClick
  } = useUserProfileHandlers({
    userId,
    userPosts,
    setSelectedPost,
    setSelectedPostForComments,
    setShowShareSheet,
    setFollowersModal
  });

  // Show loading state
  if (profileLoading) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  // Show error if no userId provided
  if (!userId) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <h1 className="text-xl font-bold mb-4">Invalid Profile URL</h1>
          <p className="text-muted-foreground mb-4">No user ID provided in the URL.</p>
          <Link to="/explore" className="text-blue-500 hover:underline">
            Back to Explore
          </Link>
        </div>
      </Layout>
    );
  }

  // Show error if user not found
  if (!user && !profileLoading) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <h1 className="text-xl font-bold mb-4">User not found</h1>
          <p className="text-muted-foreground mb-4">This user doesn't exist or their profile is not available.</p>
          <Link to="/explore" className="text-blue-500 hover:underline">
            Back to Explore
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-3 md:p-4">
        <UserProfileContent
          user={user!}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          hasFollowRequest={hasFollowRequest}
          isBlocked={isBlocked}
          loading={loading}
          followCounts={followCounts}
          userPosts={userPosts}
          postsLoading={postsLoading}
          onFollowClick={handleFollowClick}
          onMessageClick={handleMessageClick}
          onShareClick={handleShareClick}
          onConnectionsClick={handleConnectionsClick}
          onImageClick={handleImageClick}
          onCommentClick={handleCommentClick}
        />
        
        {/* Add Highlights Bar */}
        <HighlightsBar
          userId={userId}
          isOwnProfile={isOwnProfile}
        />
      </div>

      <UserProfileModals
        selectedPost={selectedPost}
        selectedPostForComments={selectedPostForComments}
        showShareSheet={showShareSheet}
        followersModal={followersModal}
        user={user!}
        userId={userId}
        onCloseModal={handleCloseModal}
        onCloseComments={() => setSelectedPostForComments(null)}
        onCloseShareSheet={() => setShowShareSheet(false)}
        onCloseFollowersModal={() => setFollowersModal(null)}
        onOpenComments={handleCommentClick}
        onOpenShare={() => setShowShareSheet(true)}
      />
    </Layout>
  );
};

export default UserProfile;
