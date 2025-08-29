import React, { useState } from 'react';
import { Heart, Smile, ThumbsUp } from 'lucide-react';

interface MessageReactionsProps {
  messageId: string | number;
  reactions?: { [emoji: string]: number };
  onReact?: (messageId: string | number, emoji: string) => void;
  showReactionBar?: boolean;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions = {},
  onReact,
  showReactionBar = false
}) => {
  const [showReactions, setShowReactions] = useState(false);

  const reactionEmojis = ['❤️', '😂', '😮', '😢', '😡', '👍'];
  const quickReactions = [
    { emoji: '❤️', icon: Heart },
    { emoji: '😂', icon: Smile },
    { emoji: '👍', icon: ThumbsUp }
  ];

  const handleReaction = (emoji: string) => {
    onReact?.(messageId, emoji);
    setShowReactions(false);
  };

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <div className="relative">
      {/* Reaction button */}
      {showReactionBar && (
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          React
        </button>
      )}
      
      {/* Existing reactions */}
      {totalReactions > 0 && (
        <div className="flex items-center space-x-1 mt-1">
          {Object.entries(reactions).map(([emoji, count]) => (
            count > 0 && (
              <div
                key={emoji}
                className="bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 text-xs flex items-center space-x-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => handleReaction(emoji)}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </div>
            )
          ))}
        </div>
      )}
      
      {/* Reaction picker */}
      {showReactions && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border p-2 flex space-x-2 z-10">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;
