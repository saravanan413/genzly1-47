
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { logger } from '../../utils/logger';

export interface ChatUserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export const getChatUser = async (currentUserId: string, targetUserId: string): Promise<ChatUserProfile | null> => {
  try {
    logger.debug(`Getting chat user info for: ${targetUserId}`);
    const userDoc = await getDoc(doc(db, 'users', targetUserId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: targetUserId,
        username: userData.username || 'Unknown',
        displayName: userData.displayName || userData.username || 'Unknown User',
        avatar: userData.avatar || null,
        bio: userData.bio || '',
        isOnline: await checkUserOnlineStatus(targetUserId),
        lastSeen: userData.lastSeen?.toDate() || undefined
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting chat user', error);
    return null;
  }
};

export const updateUserOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    logger.error('Error updating online status', error);
  }
};

export const checkUserOnlineStatus = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const lastSeen = userData.lastSeen?.toDate();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      return userData.isOnline && lastSeen && lastSeen > fiveMinutesAgo;
    }
    return false;
  } catch (error) {
    logger.error('Error checking online status', error);
    return false;
  }
};
