
import React from 'react';
import { MessageCircle } from 'lucide-react';

interface ChatEmptyStateProps {
  searchQuery?: string;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ searchQuery }) => {
  if (searchQuery && searchQuery.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <MessageCircle size={48} className="text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No chats found</h3>
        <p className="text-sm text-muted-foreground">
          No conversations match "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
      <MessageCircle size={48} className="text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
      <p className="text-sm text-muted-foreground">
        Start a conversation to see your chats here
      </p>
    </div>
  );
};

export default ChatEmptyState;
