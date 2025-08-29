
import { useParams, useNavigate } from "react-router-dom";
import InstagramStoryModal from "@/components/InstagramStoryModal";
import { useStories } from '../hooks/useFirebaseData';
import { useState, useEffect } from "react";
import { logger } from '../utils/logger';

const StoryViewerPage = () => {
  const { userIndex, storyIndex } = useParams();
  const navigate = useNavigate();
  const { stories: firebaseStories, loading } = useStories();
  const [storiesArray, setStoriesArray] = useState<any[]>([]);

  // Convert Firebase stories object to array format
  useEffect(() => {
    const storiesArr = Object.entries(firebaseStories).map(([userId, userStories]) => ({
      user: userStories[0]?.user || { name: 'Unknown', avatar: '/placeholder.svg' },
      stories: userStories.map(story => ({
        id: parseInt(story.id),
        image: story.mediaURL,
        timestamp: story.timestamp,
        createdAt: story.createdAt || Date.now()
      }))
    }));
    setStoriesArray(storiesArr);
  }, [firebaseStories]);

  // Ensure indices are valid numbers
  const userIdx = Number(userIndex);
  const initialIdx = Number(storyIndex);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (
    isNaN(userIdx) ||
    userIdx < 0 ||
    userIdx >= storiesArray.length ||
    isNaN(initialIdx) || 
    initialIdx < 0 || 
    initialIdx >= storiesArray[userIdx]?.stories?.length
  ) {
    // Invalid indices, go back to home
    logger.warn('Invalid story indices, redirecting to home');
    navigate("/");
    return null;
  }

  // Track currently displayed index in story queue for this user
  const [openStoryIdx, setOpenStoryIdx] = useState(initialIdx);

  const handleClose = () => {
    navigate(-1); // Go back on close
  };

  return (
    <InstagramStoryModal
      isOpen={true}
      onClose={handleClose}
      user={storiesArray[userIdx].user}
      stories={storiesArray[userIdx].stories}
      initialIndex={openStoryIdx}
      onIndexChange={setOpenStoryIdx}
    />
  );
};

export default StoryViewerPage;
