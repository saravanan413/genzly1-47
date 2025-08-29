
import React from 'react';
import UserProfileHeader from './UserProfileHeader';
import UserProfileTabs from './UserProfileTabs';
import UserPostsGrid from './UserPostsGrid';
import { UserProfile, Post } from '../../services/firestoreService';

interface UserProfileContentProps {
  user: UserProfile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  hasFollowRequest?: boolean;
  isBlocked?: boolean;
  loading: boolean;
  followCounts: { followers: number; following: number };
  userPosts: Post[];
  postsLoading: boolean;
  onFollowClick: () => void;
  onMessageClick: () => void;
  onShareClick: () => void;
  onConnectionsClick: (tab: "followers" | "following") => void;
  onImageClick: (index: number) => void;
  onCommentClick: (postId: number) => void;
}

const UserProfileContent: React.FC<UserProfileContentProps> = ({
  user,
  isOwnProfile,
  isFollowing,
  hasFollowRequest = false,
  isBlocked = false,
  loading,
  followCounts,
  userPosts,
  postsLoading,
  onFollowClick,
  onMessageClick,
  onShareClick,
  onConnectionsClick,
  onImageClick,
  onCommentClick
}) => {
  return (
    <div className="container mx-auto max-w-4xl">
      <UserProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        hasFollowRequest={hasFollowRequest}
        isBlocked={isBlocked}
        loading={loading}
        followCounts={followCounts}
        userPostsLength={userPosts.length}
        onFollowClick={onFollowClick}
        onMessageClick={onMessageClick}
        onShareClick={onShareClick}
        onConnectionsClick={onConnectionsClick}
      />
      
      <UserProfileTabs />
      
      <UserPostsGrid
        posts={userPosts}
        loading={postsLoading}
        isOwnProfile={isOwnProfile}
        onImageClick={onImageClick}
        onCommentClick={onCommentClick}
        onShareClick={onShareClick}
      />
    </div>
  );
};

export default UserProfileContent;
