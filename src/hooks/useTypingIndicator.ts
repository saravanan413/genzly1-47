
import { useState, useEffect, useCallback } from 'react';
import { collection, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

interface TypingUser {
  userId: string;
  username: string;
  timestamp: any;
}

export const useTypingIndicator = (chatId: string, currentUserId: string, currentUsername: string) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Listen to typing indicators
  useEffect(() => {
    if (!chatId) return;

    const typingRef = collection(db, 'chats', chatId, 'typing');
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const typing = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as TypingUser & { id: string }))
        .filter(user => {
          // Remove old typing indicators (>3 seconds)
          const now = Date.now();
          const userTime = user.timestamp?.toDate?.()?.getTime() || 0;
          return now - userTime < 3000 && user.userId !== currentUserId;
        });

      setTypingUsers(typing);
    });

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  // Set typing status
  const setTypingStatus = useCallback(async (typing: boolean) => {
    if (!chatId || isTyping === typing) return;

    setIsTyping(typing);

    try {
      if (typing) {
        const typingRef = doc(db, 'chats', chatId, 'typing', currentUserId);
        await updateDoc(typingRef, {
          userId: currentUserId,
          username: currentUsername,
          timestamp: serverTimestamp()
        }).catch(async () => {
          // If document doesn't exist, create it
          const { setDoc } = await import('firebase/firestore');
          await setDoc(typingRef, {
            userId: currentUserId,
            username: currentUsername,
            timestamp: serverTimestamp()
          });
        });

        // Auto-stop typing after 3 seconds
        setTimeout(() => setTypingStatus(false), 3000);
      } else {
        const typingRef = doc(db, 'chats', chatId, 'typing', currentUserId);
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(typingRef).catch(() => {
          // Ignore if document doesn't exist
        });
      }
    } catch (error) {
      logger.error('Error updating typing status:', error);
    }
  }, [chatId, currentUserId, currentUsername, isTyping]);

  return {
    typingUsers,
    isTyping,
    setTypingStatus
  };
};
