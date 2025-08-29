
import React, { useState } from 'react';
import { Heart, Smile, Flame, Zap } from 'lucide-react';

interface StoryReactionsProps {
  onReaction?: (emoji: string) => void;
  reactions?: { [emoji: string]: number };
}

const StoryReactions: React.FC<StoryReactionsProps> = ({
  onReaction,
  reactions = {}
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  const reactionEmojis = [
    { emoji: '❤️', icon: Heart, color: 'text-red-500' },
    { emoji: '😂', icon: Smile, color: 'text-yellow-500' },
    { emoji: '🔥', icon: Flame, color: 'text-orange-500' },
    { emoji: '⚡', icon: Zap, color: 'text-blue-500' },
  ];

  const handleReaction = (emoji: string) => {
    setSelectedReaction(emoji);
    onReaction?.(emoji);
    setShowReactions(false);
    
    // Reset after animation
    setTimeout(() => setSelectedReaction(null), 2000);
  };

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <div className="absolute bottom-20 right-4">
      {/* Reaction button */}
      <button
        onClick={() => setShowReactions(!showReactions)}
        className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
      >
        <Heart size={20} />
      </button>
      
      {/* Reaction picker */}
      {showReactions && (
        <div className="absolute bottom-16 right-0 bg-black/40 backdrop-blur-sm rounded-2xl p-2 flex flex-col space-y-2">
          {reactionEmojis.map(({ emoji, icon: Icon, color }) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
            >
              <Icon className={`${color}`} size={18} />
            </button>
          ))}
        </div>
      )}
      
      {/* Selected reaction animation */}
      {selectedReaction && (
        <div className="absolute bottom-16 right-2 text-2xl animate-bounce pointer-events-none">
          {selectedReaction}
        </div>
      )}
      
      {/* Reaction count */}
      {totalReactions > 0 && (
        <div className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
          {totalReactions}
        </div>
      )}
    </div>
  );
};

export default StoryReactions;
