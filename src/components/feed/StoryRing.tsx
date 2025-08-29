
import React from 'react';

interface StoryRingProps {
  hasStory: boolean;
  hasUnseenStory?: boolean;
  avatar: string;
  username: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const StoryRing: React.FC<StoryRingProps> = ({
  hasStory,
  hasUnseenStory = false,
  avatar,
  username,
  size = 'md',
  onClick
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const ringClass = hasStory 
    ? hasUnseenStory 
      ? 'p-0.5 bg-gradient-to-r from-purple-400 to-pink-400'
      : 'p-0.5 bg-gray-300'
    : 'border-2 border-gray-300';

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${ringClass} cursor-pointer hover:scale-105 transition-transform`}
      onClick={onClick}
    >
      <img
        src={avatar}
        alt={username}
        className={`w-full h-full rounded-full object-cover ${hasStory ? 'border-2 border-white' : ''}`}
      />
    </div>
  );
};

export default StoryRing;
