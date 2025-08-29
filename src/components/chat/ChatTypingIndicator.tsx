
import React from 'react';

interface ChatTypingIndicatorProps {
  typingUsers: string[];
}

const ChatTypingIndicator: React.FC<ChatTypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex justify-start">
      <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl mr-2 border">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default ChatTypingIndicator;
