import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import ChatLoadingState from './ChatLoadingState';
import ChatEmptyState from './ChatEmptyState';

export interface ChatPreview {
  chatId: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  lastMessage: {
    text: string;
    timestamp: number;
    senderId: string;
    seen: boolean;
  } | null;
  unreadCount: number;
}

interface ChatListProps {
  chatPreviews: ChatPreview[];
  loading: boolean;
  searchQuery: string;
  currentUserId: string;
  onChatClick: (receiverId: string) => void;
  onDoubleTap: (receiverId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chatPreviews,
  loading,
  searchQuery,
  currentUserId,
  onChatClick,
  onDoubleTap
}) => {
  const getProfilePictureUrl = (avatar?: string, username?: string): string => {
    if (avatar && avatar.trim() !== '') {
      return avatar;
    }
    return '/lovable-uploads/d349107d-a94b-4c77-9738-6efb4f4d75e5.png';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/lovable-uploads/d349107d-a94b-4c77-9738-6efb4f4d75e5.png';
  };

  // Filter chats based on search query
  const filteredChats = chatPreviews.filter(chat =>
    chat.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <ChatLoadingState />;
  }

  if (filteredChats.length === 0) {
    return <ChatEmptyState searchQuery={searchQuery} />;
  }

  return (
    <div className="space-y-2">
      {filteredChats.map((chat) => {
        const isUnread = chat.lastMessage && !chat.lastMessage.seen && chat.lastMessage.senderId !== currentUserId;
        
        return (
          <div
            key={chat.chatId}
            className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl cursor-pointer transition-colors"
            onClick={() => onChatClick(chat.otherUser.id)}
            onDoubleClick={() => onDoubleTap(chat.otherUser.id)}
          >
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              <img
                src={getProfilePictureUrl(chat.otherUser.avatar, chat.otherUser.username)}
                alt={chat.otherUser.displayName}
                className="w-14 h-14 rounded-full object-cover"
                onError={handleImageError}
              />
              {isUnread && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-medium">
                    {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                  </span>
                </div>
              )}
            </div>
            
            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-medium truncate ${isUnread ? 'text-foreground' : 'text-foreground'}`}>
                  {chat.otherUser.displayName}
                </h3>
                {chat.lastMessage && (
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                    {formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: false })}
                  </span>
                )}
              </div>
              <p className={`text-sm truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {chat.lastMessage?.text || 'No messages yet'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;
