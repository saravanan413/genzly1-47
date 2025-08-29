
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUserChatList } from '../services/chat/chatListService';
import { logger } from '../utils/logger';

export const useUnreadMessages = () => {
  const { currentUser } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser?.uid) {
      setTotalUnreadCount(0);
      setUnreadChats(new Set());
      return;
    }

    logger.debug('Setting up unread messages tracking', { userId: currentUser.uid });

    const unsubscribe = subscribeToUserChatList(currentUser.uid, (chats, fromCache) => {
      let totalUnread = 0;
      const chatsWithUnread = new Set<string>();

      chats.forEach(chat => {
        // Count as unread if the last message was not sent by current user and not seen
        if (chat.lastMessage && 
            !chat.seen && 
            chat.receiverId !== currentUser.uid) {
          totalUnread += 1;
          chatsWithUnread.add(chat.chatId);
        }
      });

      logger.debug('Unread messages count updated', { 
        totalUnread, 
        unreadChats: Array.from(chatsWithUnread),
        fromCache 
      });

      setTotalUnreadCount(totalUnread);
      setUnreadChats(chatsWithUnread);
    });

    return () => {
      logger.debug('Cleaning up unread messages tracking');
      unsubscribe();
    };
  }, [currentUser?.uid]);

  return {
    totalUnreadCount,
    unreadChats,
    hasUnreadMessages: totalUnreadCount > 0
  };
};
