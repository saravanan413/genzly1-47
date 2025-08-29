
import React from 'react';

interface Mention {
  username: string;
  x: number; // percentage from left
  y: number; // percentage from top
}

interface StoryMentionsProps {
  mentions: Mention[];
  onMentionClick?: (username: string) => void;
}

const StoryMentions: React.FC<StoryMentionsProps> = ({
  mentions,
  onMentionClick
}) => {
  return (
    <>
      {mentions.map((mention, index) => (
        <button
          key={index}
          onClick={() => onMentionClick?.(mention.username)}
          className="absolute bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-black/50 transition-colors"
          style={{
            left: `${mention.x}%`,
            top: `${mention.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          @{mention.username}
        </button>
      ))}
    </>
  );
};

export default StoryMentions;
