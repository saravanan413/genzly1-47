
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Plus } from 'lucide-react';
import InstagramStoryModal from '@/components/InstagramStoryModal';
import { useStories } from '../hooks/useFirebaseData';
import { useYourStories } from '../hooks/useYourStories';
import { useAuth } from '../contexts/AuthContext';

const StoriesBar: React.FC = () => {
  const [ownStoryOpen, setOwnStoryOpen] = React.useState(false);
  const [ownStoryIndex, setOwnStoryIndex] = React.useState(0);
  const [watchedStories, setWatchedStories] = useState<Set<number>>(new Set());

  const { currentUser } = useAuth();
  const { stories: firebaseStories, loading } = useStories();
  const { yourStories } = useYourStories();
  const navigate = useNavigate();

  // Avatar click for others
  const openStories = (userId: string, storyIndex = 0) => {
    navigate(`/story/${userId}/${storyIndex}`, {
      state: { cameFrom: "storiesBar" },
    });
  };

  // Avatar click for own story
  const openOwnStories = () => {
    if (yourStories.length > 0) {
      setOwnStoryOpen(true);
      setOwnStoryIndex(0);
    } else {
      navigate('/add-story');
    }
  };

  const handleAddStory = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    navigate('/add-story');
  };

  const handleMarkWatched = (storyId: number) => {
    setWatchedStories(prev => new Set(prev).add(storyId));
  };

  // Transform your stories to the expected format
  const transformedYourStories = yourStories.map(story => ({
    id: story.id,
    image: story.image || generateTextStoryImage(story),
    timestamp: story.timestamp,
    createdAt: story.createdAt
  }));

  const generateTextStoryImage = (story: any) => {
    if (story.type === 'text' && story.textContent) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = story.backgroundColor || '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = story.textColor || '#ffffff';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(story.textContent, canvas.width / 2, canvas.height / 2);
      }
      return canvas.toDataURL();
    }
    return story.image || 'https://via.placeholder.com/400x600/111111/FFFFFF?text=Story';
  };

  if (loading) {
    return (
      <div className="bg-card border-b border-gray-100 dark:border-gray-800 p-4 mb-4 w-full">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border-b border-gray-100 dark:border-gray-800 p-4 mb-4 w-full flex space-x-4 overflow-x-auto scrollbar-hide">
        {/* Add/Show Your Story */}
        <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group animate-fade-in relative">
          <div
            className="relative w-16 h-16 rounded-full group-hover:scale-105 transition-transform duration-200 flex items-center justify-center cursor-pointer"
            onClick={openOwnStories}
          >
            <div className={`w-full h-full rounded-full bg-white flex items-center justify-center border-2 relative overflow-hidden ${
              yourStories.length > 0 ? 'p-0.5 bg-gradient-to-r from-purple-400 to-pink-400' : 'border-gray-300'
            }`}>
              {yourStories.length > 0 ? (
                <>
                  <img
                    src={transformedYourStories[0].image}
                    alt="Your Story"
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                  <div className="absolute bottom-0 right-0 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full border-2 border-white font-bold">
                    {yourStories.length}
                  </div>
                </>
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <Plus className="text-primary" size={28} />
                </div>
              )}
            </div>
            <button
              className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:bg-primary/90 transition-colors z-10"
              onClick={handleAddStory}
              title="Add to your story"
              tabIndex={0}
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-xs text-primary font-semibold mt-1 max-w-[60px] truncate">
            {yourStories.length > 0 ? 'Your Story' : 'Add Story'}
          </span>
        </div>
        
        {/* Firebase Stories */}
        {Object.entries(firebaseStories).map(([userId, userStories]) => {
          if (!userStories.length || userId === currentUser?.uid) return null;
          
          const user = userStories[0].user;
          const hasUnseenStories = userStories.some(story => !watchedStories.has(parseInt(story.id)));
          
          return (
            <div
              key={userId}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group animate-fade-in relative"
              onClick={() => openStories(userId, 0)}
            >
              <div
                className={`relative w-16 h-16 rounded-full group-hover:scale-105 transition-transform duration-200 ${
                  hasUnseenStories
                    ? "p-0.5 bg-gradient-to-r from-purple-400 to-pink-400"
                    : "border-2 border-gray-300"
                }`}
              >
                <img
                  src={user.avatar || '/placeholder.svg'}
                  alt={user.username}
                  className={`w-full h-full rounded-full object-cover ${hasUnseenStories ? 'border-2 border-white' : ''}`}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[60px] truncate mt-1">
                {user.username}
              </span>
            </div>
          );
        })}

        {/* Empty state if no stories */}
        {Object.keys(firebaseStories).length === 0 && (
          <div className="flex items-center justify-center w-full py-4">
            <p className="text-gray-500 text-sm">No stories available</p>
          </div>
        )}
      </div>
      
      {/* Modal: show YOUR story if any */}
      {ownStoryOpen && yourStories.length > 0 && (
        <InstagramStoryModal
          isOpen={ownStoryOpen}
          onClose={() => setOwnStoryOpen(false)}
          user={{ name: 'Your Story', avatar: currentUser?.photoURL || '/placeholder.svg' }}
          stories={transformedYourStories}
          initialIndex={ownStoryIndex}
          onIndexChange={setOwnStoryIndex}
          onWatchedStory={handleMarkWatched}
          getViewCount={() => 0}
        />
      )}
    </>
  );
};

export default StoriesBar;
