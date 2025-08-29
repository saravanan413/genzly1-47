import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { logger } from '../../utils/logger';

export interface ChatListItem {
  chatId: string;
  receiverId: string;
  username: string;
  displayName: string;
  avatar?: string;
  lastMessage: string;
  timestamp: number;
  seen: boolean;
}

interface UserData {
  username?: string;
  displayName?: string;
  avatar?: string;
  email?: string;
}

// Cache key for localStorage
const CHAT_LIST_CACHE_KEY = 'genzly_chat_list';

// Cache management functions
export const getCachedChatList = (userId: string): ChatListItem[] => {
  try {
    const cached = localStorage.getItem(`${CHAT_LIST_CACHE_KEY}_${userId}`);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      // Check if cache is less than 1 hour old
      if (Date.now() - parsedCache.timestamp < 3600000) {
        logger.debug('Retrieved cached chat list', { chatCount: parsedCache.data.length });
        return parsedCache.data;
      }
    }
  } catch (error) {
    logger.error('Error retrieving cached chat list', error);
  }
  return [];
};

export const setCachedChatList = (userId: string, chats: ChatListItem[]): void => {
  try {
    const cacheData = {
      data: chats,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CHAT_LIST_CACHE_KEY}_${userId}`, JSON.stringify(cacheData));
    logger.debug('Cached chat list updated', { chatCount: chats.length });
  } catch (error) {
    logger.error('Error caching chat list', error);
  }
};

export const clearCachedChatList = (userId?: string): void => {
  try {
    if (userId) {
      localStorage.removeItem(`${CHAT_LIST_CACHE_KEY}_${userId}`);
    } else {
      // Clear all chat caches
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CHAT_LIST_CACHE_KEY)) {
          localStorage.removeItem(key);
        }
      });
    }
    logger.debug('Chat list cache cleared');
  } catch (error) {
    logger.error('Error clearing chat list cache', error);
  }
};

export const subscribeToUserChatList = (
  currentUserId: string, 
  callback: (chats: ChatListItem[], isFromCache: boolean) => void
) => {
  logger.debug('Setting up persistent chat list subscription', { userId: currentUserId });
  
  if (!currentUserId) {
    logger.error('No currentUserId provided to subscribeToUserChatList');
    callback([], false);
    return () => {};
  }

  // First, return cached data immediately if available
  const cachedChats = getCachedChatList(currentUserId);
  if (cachedChats.length > 0) {
    logger.debug('Returning cached chat list first', { chatCount: cachedChats.length });
    callback(cachedChats, true);
  }

  try {
    // Query the main chats collection where the current user is in the users array
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('users', 'array-contains', currentUserId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, async (snapshot) => {
      logger.debug('Live chat list updated', { chatCount: snapshot.size });
      
      // Process all chats in parallel instead of sequentially
      const chatPromises = snapshot.docs.map(async (docSnapshot) => {
        const chatData = docSnapshot.data();
        const chatId = docSnapshot.id;
        
        // Skip chats without users array or if user is not in it
        if (!chatData.users || !Array.isArray(chatData.users) || !chatData.users.includes(currentUserId)) {
          return null;
        }
        
        // Get the other user's ID
        const otherUserId = chatData.users.find((id: string) => id !== currentUserId);
        if (!otherUserId) {
          return null;
        }
        
        // Skip chats without a last message (empty chats)
        if (!chatData.lastMessage?.text || chatData.lastMessage.text.trim() === '') {
          return null;
        }
        
        // Get user data for the other user
        let userData: UserData = {};
        try {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            const userDocData = userDoc.data();
            userData = {
              username: userDocData.username,
              displayName: userDocData.displayName,
              avatar: userDocData.avatar,
              email: userDocData.email
            };
          } else {
            return null;
          }
        } catch (error) {
          logger.warn('Failed to fetch other user data', { otherUserId, error });
          return null;
        }

        // Improved seen logic: message is seen if current user sent it OR if it's marked as seen
        const isMessageSeen = chatData.lastMessage.senderId === currentUserId || chatData.lastMessage.seen === true;

        const chatItem: ChatListItem = {
          chatId,
          receiverId: otherUserId,
          username: userData.username || userData.displayName || userData.email?.split('@')[0] || 'Unknown User',
          displayName: userData.displayName || userData.username || 'Unknown User',
          avatar: userData.avatar,
          lastMessage: chatData.lastMessage.text,
          timestamp: chatData.lastMessage.timestamp?.toDate?.()?.getTime() || chatData.updatedAt?.toDate?.()?.getTime() || Date.now(),
          seen: isMessageSeen
        };

        return chatItem;
      });

      // Wait for all chat processing to complete
      const chatResults = await Promise.all(chatPromises);
      
      // Filter out null results and sort by timestamp descending
      const chats = chatResults
        .filter((chat): chat is ChatListItem => chat !== null)
        .sort((a, b) => b.timestamp - a.timestamp);

      // Cache the updated chat list
      setCachedChatList(currentUserId, chats);
      
      logger.debug('Live chat list processed', { chatCount: chats.length });
      callback(chats, false);
    }, (error) => {
      logger.error('Error in live chat list subscription', error);
      // On error, return cached data if available
      const cachedChats = getCachedChatList(currentUserId);
      callback(cachedChats, true);
    });
  } catch (error) {
    logger.error('Error setting up chat list subscription', error);
    // Return cached data on setup error
    const cachedChats = getCachedChatList(currentUserId);
    callback(cachedChats, true);
    return () => {};
  }
};
