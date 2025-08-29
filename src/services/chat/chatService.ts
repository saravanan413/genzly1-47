
import { 
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { sendMessage } from './messageService';
import { logger } from '../../utils/logger';

export const createChatId = (userId1: string, userId2: string): string => {
  // Ensure consistent chatId by sorting UIDs alphabetically
  const sortedIds = [userId1, userId2].sort();
  const chatId = sortedIds.join('_');
  logger.debug('Generated chatId', { chatId, userId1, userId2 });
  return chatId;
};

export const sendChatMessage = async (
  currentUserId: string, 
  receiverId: string, 
  text: string, 
  type: 'text' | 'voice' | 'image' | 'video' = 'text',
  mediaURL?: string
) => {
  logger.debug('Starting chat message send', {
    currentUserId,
    receiverId,
    messagePreview: text.substring(0, 50) + '...',
    type
  });

  // Validate required parameters
  if (!currentUserId || !receiverId) {
    throw new Error('Missing currentUserId or receiverId');
  }

  if (!text.trim() && !mediaURL) {
    throw new Error('Message cannot be empty');
  }

  const chatId = createChatId(currentUserId, receiverId);
  logger.debug('Using chatId', { chatId });

  try {
    // Send the message (this will also create/update the chat document)
    const messageId = await sendMessage(
      chatId,
      currentUserId,
      receiverId,
      text.trim(),
      type,
      mediaURL
    );

    logger.debug('Message sent successfully', { messageId });
    return messageId;
  } catch (error) {
    logger.error('Complete message send process failed', error);
    throw error;
  }
};

interface ChatDocument {
  users: string[];
  createdAt: ReturnType<typeof serverTimestamp>;
  lastMessage: {
    text: string;
    timestamp: ReturnType<typeof serverTimestamp>;
    senderId: string;
    seen: boolean;
  };
  updatedAt: ReturnType<typeof serverTimestamp>;
}

export const ensureChatExists = async (userId1: string, userId2: string) => {
  const chatId = createChatId(userId1, userId2);
  logger.debug('Ensuring chat exists', { userId1, userId2, chatId });
  
  try {
    // Check if chat already exists
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    
    if (chatDoc.exists()) {
      logger.debug('Chat already exists', { chatId });
      return chatId;
    }

    // Get user data to ensure both users exist
    const [user1Doc, user2Doc] = await Promise.all([
      getDoc(doc(db, 'users', userId1)),
      getDoc(doc(db, 'users', userId2))
    ]);

    if (!user1Doc.exists() || !user2Doc.exists()) {
      throw new Error('One or both users do not exist');
    }

    // Create chat document with proper structure for querying
    const chatData: ChatDocument = {
      users: [userId1, userId2], // This is crucial for array-contains queries
      createdAt: serverTimestamp(),
      lastMessage: {
        text: '',
        timestamp: serverTimestamp(),
        senderId: '',
        seen: true
      },
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'chats', chatId), chatData);
    logger.debug('Chat document created with users array', { chatId, users: [userId1, userId2] });
    
    return chatId;
  } catch (error) {
    logger.error('Error ensuring chat exists', error);
    throw error;
  }
};
