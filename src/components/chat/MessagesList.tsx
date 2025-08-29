
import React, { useEffect, useRef } from 'react';
import MessageItem, { Message } from './MessageItem';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatEmptyState from './ChatEmptyState';
import ChatLoadingState from './ChatLoadingState';
import DateSeparator from './DateSeparator';
import { DisplayMessage, FirebaseTimestamp } from '../../types/chat';

interface MessagesListProps {
  messages: DisplayMessage[];
  typingUsers: string[];
  loading: boolean;
  onSharedContent?: (content: {
    type: 'post' | 'reel' | 'image' | 'video';
    url?: string;
    image?: string;
  }) => void;
}

const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  typingUsers,
  loading,
  onSharedContent
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBottomInstant = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const isFirstLoad = messages.length === 1 || !containerRef.current?.scrollTop;
      if (isFirstLoad) {
        setTimeout(scrollToBottomInstant, 50);
      } else {
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [messages]);

  // Also scroll when loading finishes
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(scrollToBottomInstant, 100);
    }
  }, [loading]);

  const shouldShowDateSeparator = (currentMessage: DisplayMessage, previousMessage?: DisplayMessage): boolean => {
    if (!previousMessage || !currentMessage.timestamp || !previousMessage.timestamp) return false;
    
    try {
      let currentDate: Date;
      let previousDate: Date;

      // Handle different timestamp types
      if (typeof currentMessage.timestamp === 'number') {
        currentDate = new Date(currentMessage.timestamp);
      } else if (currentMessage.timestamp && typeof currentMessage.timestamp === 'object' && 'toDate' in currentMessage.timestamp) {
        currentDate = (currentMessage.timestamp as FirebaseTimestamp).toDate();
      } else {
        return false;
      }

      if (typeof previousMessage.timestamp === 'number') {
        previousDate = new Date(previousMessage.timestamp);
      } else if (previousMessage.timestamp && typeof previousMessage.timestamp === 'object' && 'toDate' in previousMessage.timestamp) {
        previousDate = (previousMessage.timestamp as FirebaseTimestamp).toDate();
      } else {
        return false;
      }
      
      const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const previousDay = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate());
      
      return currentDay.getTime() !== previousDay.getTime();
    } catch (error) {
      return false;
    }
  };

  // Convert DisplayMessage to Message for MessageItem
  const convertToMessage = (displayMessage: DisplayMessage): Message => {
    let timestamp: Date;
    
    if (typeof displayMessage.timestamp === 'number') {
      timestamp = new Date(displayMessage.timestamp);
    } else if (displayMessage.timestamp && typeof displayMessage.timestamp === 'object' && 'toDate' in displayMessage.timestamp) {
      timestamp = (displayMessage.timestamp as FirebaseTimestamp).toDate();
    } else {
      timestamp = new Date();
    }

    return {
      id: displayMessage.id,
      text: displayMessage.text,
      senderId: displayMessage.isOwn ? 'current-user' : 'other-user', // Add required senderId
      timestamp,
      type: (displayMessage.type as any) || 'text',
      seen: displayMessage.seen,
      reactions: {}
    };
  };

  if (loading) {
    return <ChatLoadingState />;
  }

  if (messages.length === 0) {
    return <ChatEmptyState />;
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 space-y-4"
    >
      {messages.map((message, index) => {
        const previousMessage = index > 0 ? messages[index - 1] : undefined;
        const showDateSeparator = index === 0 || shouldShowDateSeparator(message, previousMessage);
        const convertedMessage = convertToMessage(message);
        
        return (
          <React.Fragment key={message.id}>
            {showDateSeparator && <DateSeparator timestamp={message.timestamp} />}
            <MessageItem
              message={convertedMessage}
              isOwnMessage={message.isOwn}
              currentUserId="current-user"
              onSharedContent={onSharedContent}
            />
          </React.Fragment>
        );
      })}
      
      <ChatTypingIndicator typingUsers={typingUsers} />
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesList;
