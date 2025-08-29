
import { useState } from 'react';

export const useUserProfileState = () => {
  const [selectedPost, setSelectedPost] = useState<{ imageUrl: string; postId: number } | null>(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState<number | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [followersModal, setFollowersModal] = useState<null | "followers" | "following">(null);

  return {
    selectedPost,
    setSelectedPost,
    selectedPostForComments,
    setSelectedPostForComments,
    showShareSheet,
    setShowShareSheet,
    followersModal,
    setFollowersModal
  };
};
