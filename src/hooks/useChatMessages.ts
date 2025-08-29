
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToChatMessages, markMessagesAsSeen } from '../services/chat/messageService';
import { ChatMessage, DisplayMessage, FirebaseTimestamp } from '../types/chat';
import { logger } from '../utils/logger';

export const useChatMessages = (chatId: string, targetUserId: string) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId || !currentUser || !targetUserId) {
      setLoading(false);
      return;
    }

    logger.debug('Setting up message subscription for chatId:', chatId);
    setLoading(true);

    const unsubscribe = subscribeToChatMessages(chatId, (newMessages: ChatMessage[]) => {
      logger.debug('Received messages:', newMessages.length);
      
      setMessages(newMessages);
      setLoading(false);
      
      // Auto-mark messages as seen after a short delay
      if (newMessages.length > 0) {
        const unseenMessages = newMessages.filter(msg => 
          msg.receiverId === currentUser.uid && !msg.seen
        );
        
        if (unseenMessages.length > 0) {
          setTimeout(() => {
            markMessagesAsSeen(chatId, currentUser.uid);
          }, 1500);
        }
      }
    });

    return () => {
      logger.debug('Cleaning up message subscription');
      unsubscribe();
    };
  }, [chatId, currentUser, targetUserId]);

  // Format messages for display with timestamps
  const displayMessages: DisplayMessage[] = messages.map(msg => {
    // Handle timestamp conversion safely
    let timeString = 'now';
    if (msg.timestamp) {
      if (typeof msg.timestamp === 'number') {
        timeString = new Date(msg.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (msg.timestamp && typeof msg.timestamp === 'object' && 'toDate' in msg.timestamp) {
        timeString = new Date((msg.timestamp as FirebaseTimestamp).toDate()).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    }

    return {
      id: msg.id,
      text: msg.text,
      time: timeString,
      isOwn: msg.senderId === currentUser?.uid,
      content: msg.mediaURL ? { url: msg.mediaURL, type: msg.type } : undefined,
      type: msg.type,
      status: msg.status,
      seen: msg.seen,
      delivered: true,
      timestamp: msg.timestamp
    };
  });

  return {
    displayMessages,
    loading
  };
};
