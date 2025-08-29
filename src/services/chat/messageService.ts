import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc,
  serverTimestamp,
  writeBatch,
  where,
  getDocs,
  limit,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ChatMessage } from '../../types/chat';
import { logger } from '../../utils/logger';

interface MessageData {
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: ReturnType<typeof serverTimestamp>;
  seen: boolean;
  status: 'sent' | 'delivered' | 'seen';
  type: 'text' | 'voice' | 'image' | 'video';
  mediaURL: string | null;
}

interface ChatDocument {
  users: string[];
  lastMessage: {
    text: string;
    timestamp: ReturnType<typeof serverTimestamp>;
    senderId: string;
    seen: boolean;
  };
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

export const subscribeToChatMessages = (
  chatId: string, 
  callback: (messages: ChatMessage[]) => void,
  messageLimit: number = 100
) => {
  logger.debug('Setting up real-time message subscription', { chatId });
  
  if (!chatId) {
    logger.debug('No chatId provided for message subscription');
    callback([]);
    return () => {};
  }

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  
  const q = query(
    messagesRef, 
    orderBy('timestamp', 'asc'),
    limit(messageLimit)
  );

  return onSnapshot(q, (snapshot) => {
    logger.debug('Real-time messages update', { messageCount: snapshot.size });
    
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        text: data.text || '',
        senderId: data.senderId,
        receiverId: data.receiverId,
        timestamp: data.timestamp,
        seen: data.seen || false,
        status: data.status || 'sent',
        type: data.type || 'text',
        mediaURL: data.mediaURL || null,
        delivered: true
      } as ChatMessage;
    });
    
    logger.debug('Processed messages for callback', { messageCount: messages.length });
    callback(messages);
  }, (error) => {
    logger.error('Error in message subscription', error);
    callback([]);
  });
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  receiverId: string,
  text: string,
  type: 'text' | 'voice' | 'image' | 'video' = 'text',
  mediaURL?: string
): Promise<string> => {
  logger.debug('Sending message and updating chat document', {
    chatId,
    senderId,
    receiverId,
    messagePreview: text.substring(0, 50) + '...',
    type
  });

  if (!chatId || !senderId || !receiverId) {
    throw new Error('Missing required parameters for sending message');
  }

  if (!text.trim() && !mediaURL) {
    throw new Error('Message must have text or media');
  }

  try {
    // Use a batch to ensure atomicity - both message and chat document updated together
    const batch = writeBatch(db);
    
    // 1. Create/Update the main chat document in /chats/{chatId}
    const chatDocRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatDocRef);
    
    const chatData: ChatDocument = {
      users: [senderId, receiverId],
      lastMessage: {
        text: text.trim(),
        timestamp: serverTimestamp(),
        senderId: senderId,
        seen: false
      },
      createdAt: chatDoc.exists() ? chatDoc.data()?.createdAt : serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Always update the chat document (create or update)
    batch.set(chatDocRef, chatData, { merge: true });
    logger.debug('Updating chat document with latest message', { chatId, users: [senderId, receiverId] });

    // 2. Add the message to the messages subcollection
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messageDocRef = doc(messagesRef);
    
    const messageData: MessageData = {
      text: text.trim(),
      senderId,
      receiverId,
      timestamp: serverTimestamp(),
      seen: false,
      status: 'sent',
      type,
      mediaURL: mediaURL || null
    };

    batch.set(messageDocRef, messageData);
    
    // 3. Commit the batch - this ensures both operations succeed or fail together
    await batch.commit();
    
    logger.debug('Message sent and chat document updated successfully', { 
      messageId: messageDocRef.id,
      chatId 
    });
    
    return messageDocRef.id;
  } catch (error) {
    logger.error('Failed to send message and update chat', error);
    throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const markMessagesAsSeen = async (chatId: string, userId: string) => {
  try {
    logger.debug('Marking messages as seen', { chatId, userId });
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef, 
      where('receiverId', '==', userId),
      where('seen', '==', false)
    );
    
    const snapshot = await getDocs(q);
    logger.debug('Messages to mark as seen', { messageCount: snapshot.size });
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnapshot => {
      batch.update(doc(db, 'chats', chatId, 'messages', docSnapshot.id), { 
        seen: true,
        status: 'seen'
      });
    });
    
    // Also update the chat document's last message seen status if needed
    const chatDocRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatDocRef);
    
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      if (chatData?.lastMessage && chatData.lastMessage.senderId !== userId) {
        batch.update(chatDocRef, {
          'lastMessage.seen': true
        });
        logger.debug('Updated chat document seen status', { chatId });
      }
    }
    
    await batch.commit();
    logger.debug('Messages marked as seen');
  } catch (error) {
    logger.error('Error marking messages as seen', error);
  }
};
