
import React from 'react';

const ChatLoadingState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading messages...</p>
      </div>
    </div>
  );
};

export default ChatLoadingState;
