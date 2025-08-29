
import { useNavigate } from 'react-router-dom';
import { Post } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { ensureChatExists } from '../services/chat/chatService';

interface UseUserProfileHandlersProps {
  userId: string | undefined;
  userPosts: Post[];
  setSelectedPost: (post: { imageUrl: string; postId: number } | null) => void;
  setSelectedPostForComments: (postId: number | null) => void;
  setShowShareSheet: (show: boolean) => void;
  setFollowersModal: (modal: null | "followers" | "following") => void;
}

export const useUserProfileHandlers = ({
  userId,
  userPosts,
  setSelectedPost,
  setSelectedPostForComments,
  setShowShareSheet,
  setFollowersModal
}: UseUserProfileHandlersProps) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleMessageClick = async () => {
    if (userId && currentUser) {
      console.log('Starting chat with user:', userId);
      try {
        await ensureChatExists(currentUser.uid, userId);
        console.log('Chat ensured, navigating to chat with:', userId);
        navigate(`/chat/${userId}`);
      } catch (error) {
        console.error('Error starting chat:', error);
        // Navigate anyway - chat will be created when first message is sent
        navigate(`/chat/${userId}`);
      }
    }
  };

  const handleImageClick = (index: number) => {
    if (userPosts[index]) {
      setSelectedPost({
        imageUrl: userPosts[index].mediaURL,
        postId: parseInt(userPosts[index].id)
      });
    }
  };

  const handleCommentClick = (postId: number) => {
    setSelectedPostForComments(postId);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  const handleConnectionsClick = (tab: "followers" | "following") => {
    setFollowersModal(tab);
  };

  const handleShareClick = () => {
    setShowShareSheet(true);
  };

  return {
    handleMessageClick,
    handleImageClick,
    handleCommentClick,
    handleCloseModal,
    handleConnectionsClick,
    handleShareClick
  };
};
