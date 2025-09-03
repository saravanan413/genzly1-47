import { 
  collection, 
  addDoc, 
  updateDoc,
  getDoc,
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface NotificationData {
  receiverId: string;
  senderId: string;
  type: 'like' | 'comment' | 'follow_request' | 'follow_accept';
  timestamp: any;
  seen: boolean;
  aggregatedCount: number;
  lastActors: string[];
  postId?: string;
  commentId?: string;
  reelId?: string;
}

export interface CreateNotificationParams {
  receiverId: string;
  senderId: string;
  type: 'like' | 'comment' | 'follow_request' | 'follow_accept';
  aggregatedCount: number;
  lastActors: string[];
  postId?: string;
  commentId?: string;
  reelId?: string;
}

export interface UpdateNotificationParams {
  seen?: boolean;
  aggregatedCount?: number;
  lastActors?: string[];
}

// Create a notification
export const createNotification = async (params: CreateNotificationParams): Promise<string> => {
  const { receiverId, senderId, type, aggregatedCount, lastActors, ...optionalFields } = params;
  
  // Validate required fields
  if (!receiverId || !senderId || !type) {
    throw new Error('Missing required fields: receiverId, senderId, type');
  }
  
  if (!['like', 'comment', 'follow_request', 'follow_accept'].includes(type)) {
    throw new Error('Invalid notification type');
  }
  
  if (aggregatedCount < 1) {
    throw new Error('aggregatedCount must be >= 1');
  }
  
  if (!Array.isArray(lastActors) || lastActors.length === 0) {
    throw new Error('lastActors must be a non-empty array');
  }

  const notificationData: Partial<NotificationData> = {
    receiverId,
    senderId,
    type,
    timestamp: serverTimestamp(),
    seen: false,
    aggregatedCount,
    lastActors,
    ...optionalFields
  };

  const notificationsRef = collection(db, 'notifications', receiverId, 'items');
  const docRef = await addDoc(notificationsRef, notificationData);
  
  return docRef.id;
};

// Update a notification
export const updateNotification = async (
  userId: string, 
  notificationId: string, 
  updates: UpdateNotificationParams
): Promise<void> => {
  const allowedFields = ['seen', 'aggregatedCount', 'lastActors'];
  const updateData: any = { timestamp: serverTimestamp() };
  
  // Only include allowed fields
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = updates[key as keyof UpdateNotificationParams];
    }
  });
  
  const notificationRef = doc(db, 'notifications', userId, 'items', notificationId);
  await updateDoc(notificationRef, updateData);
};

// Read a notification
export const readNotification = async (
  userId: string, 
  notificationId: string
): Promise<(NotificationData & { id: string }) | null> => {
  const notificationRef = doc(db, 'notifications', userId, 'items', notificationId);
  const docSnap = await getDoc(notificationRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as NotificationData & { id: string };
  }
  
  return null;
};

// Delete a notification
export const deleteNotification = async (
  userId: string, 
  notificationId: string
): Promise<void> => {
  const notificationRef = doc(db, 'notifications', userId, 'items', notificationId);
  await deleteDoc(notificationRef);
};