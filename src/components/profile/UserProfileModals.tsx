
import React from 'react';
import PostModal from '../PostModal';
import CommentPage from '../CommentPage';
import DmShareSheet from '../DmShareSheet';
import FollowersFollowingModal from '../FollowersFollowingModal';
import { UserProfile } from '../../services/firestoreService';

interface UserProfileModalsProps {
  selectedPost: { imageUrl: string; postId: number } | null;
  selectedPostForComments: number | null;
  showShareSheet: boolean;
  followersModal: null | "followers" | "following";
  user: UserProfile;
  userId: string | undefined;
  onCloseModal: () => void;
  onCloseComments: () => void;
  onCloseShareSheet: () => void;
  onCloseFollowersModal: () => void;
  onOpenComments: (postId: number) => void;
  onOpenShare: () => void;
}

const UserProfileModals: React.FC<UserProfileModalsProps> = ({
  selectedPost,
  selectedPostForComments,
  showShareSheet,
  followersModal,
  user,
  userId,
  onCloseModal,
  onCloseComments,
  onCloseShareSheet,
  onCloseFollowersModal,
  onOpenComments,
  onOpenShare
}) => {
  return (
    <>
      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          isOpen={!!selectedPost}
          onClose={onCloseModal}
          imageUrl={selectedPost.imageUrl}
          postId={selectedPost.postId}
          user={{
            name: user.username,
            avatar: user.avatar || '/placeholder.svg'
          }}
          onOpenComments={() => onOpenComments(selectedPost.postId)}
          onOpenShare={onOpenShare}
        />
      )}

      {/* Followers/Following Modal */}
      <FollowersFollowingModal
        isOpen={!!followersModal}
        onClose={onCloseFollowersModal}
        type={followersModal || "followers"}
        userId={userId}
      />

      {/* Share Sheet for post/profile */}
      <DmShareSheet
        isOpen={showShareSheet}
        onClose={onCloseShareSheet}
        content={{
          type: "profile",
          meta: {
            userId: user.id,
            username: user.username,
            avatar: user.avatar,
            name: user.displayName || user.username
          }
        }}
      />

      {/* Comment Page */}
      <CommentPage
        isOpen={selectedPostForComments !== null}
        onClose={onCloseComments}
        postId={(selectedPostForComments || '').toString()}
      />
    </>
  );
};

export default UserProfileModals;
