import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  getDoc,
  deleteDoc,
  where,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUserProfile } from './firestoreService';

export interface UnifiedNotification {
  id: string;
  type: 'like' | 'comment' | 'follow_request' | 'follow_accept';
  senderId: string;
  receiverId: string;
  timestamp: any;
  seen: boolean;
  postId?: string;
  commentText?: string;
  // For Instagram-like aggregation
  aggregatedCount?: number;
  lastActors?: string[];
  senderProfile?: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  postThumbnail?: string;
}

// Create notification using the security rule compliant path
export const createUnifiedNotification = async (
  receiverId: string,
  senderId: string,
  type: 'like' | 'comment' | 'follow_request' | 'follow_accept',
  additionalData?: {
    postId?: string;
    commentText?: string;
  }
) => {
  try {
    console.log('=== CREATING UNIFIED NOTIFICATION ===');
    console.log('Receiver ID:', receiverId);
    console.log('Sender ID:', senderId);
    console.log('Type:', type);
    console.log('Additional data:', additionalData);

    // Don't create notification for self-actions
    if (receiverId === senderId) {
      console.log('Skipping self-notification');
      return null;
    }

    // Validate required parameters
    if (!receiverId || !senderId || !type) {
      console.error('Missing required parameters for notification creation');
      throw new Error('Missing required parameters');
    }

    // Get sender profile for notification display
    console.log('Fetching sender profile for:', senderId);
    const senderProfile = await getUserProfile(senderId);
    if (!senderProfile) {
      console.error('Could not find sender profile for:', senderId);
      throw new Error('Sender profile not found');
    }
    console.log('Sender profile found:', senderProfile.username);

    // Reference to the correct path: /notifications/{receiverId}/items
    const notificationsRef = collection(db, 'notifications', receiverId, 'items');
    console.log('Notifications collection path:', `notifications/${receiverId}/items`);

    // For likes, check for existing notification on same post for aggregation
    if (type === 'like' && additionalData?.postId) {
      const existingQuery = query(
        notificationsRef,
        where('type', '==', 'like'),
        where('postId', '==', additionalData.postId),
        limit(1)
      );
      
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        // Update existing notification with aggregation
        const existingDoc = existingDocs.docs[0];
        const existingData = existingDoc.data();
        
        const currentActors = existingData.lastActors || [existingData.senderId];
        const newActors = [senderId, ...currentActors.filter(id => id !== senderId)].slice(0, 3);
        
        await updateDoc(existingDoc.ref, {
          timestamp: serverTimestamp(),
          seen: false,
          aggregatedCount: (existingData.aggregatedCount || 1) + 1,
          lastActors: newActors,
          senderId: senderId // Most recent actor becomes primary sender
        });
        
        console.log('Updated aggregated like notification');
        return existingDoc.id;
      }
    }

    // For follow requests, check for duplicates
    if (type === 'follow_request') {
      console.log('Checking for existing follow request notifications...');
      const existingQuery = query(
        notificationsRef,
        where('senderId', '==', senderId),
        where('type', '==', 'follow_request'),
        limit(1)
      );
      
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        console.log('Follow request notification already exists, updating timestamp');
        const existingDoc = existingDocs.docs[0];
        await updateDoc(existingDoc.ref, {
          timestamp: serverTimestamp(),
          seen: false
        });
        return existingDoc.id;
      }
      console.log('No existing follow request notification found, creating new one');
    }

    // Create notification data with all required fields per security rules
    const notificationData = {
      type,
      senderId,
      receiverId,
      timestamp: serverTimestamp(),
      seen: false,
      aggregatedCount: 1,
      lastActors: [senderId],
      ...(additionalData?.postId && { postId: additionalData.postId }),
      ...(additionalData?.commentText && { commentText: additionalData.commentText })
    };

    console.log('Creating notification document with data:', {
      ...notificationData,
      timestamp: '[ServerTimestamp]' // Don't log the actual timestamp object
    });
    
    console.log('Validating required fields per Firestore rules:');
    console.log('- receiverId:', !!notificationData.receiverId);
    console.log('- senderId:', !!notificationData.senderId);
    console.log('- type:', !!notificationData.type);
    console.log('- timestamp:', !!notificationData.timestamp);
    console.log('- seen:', notificationData.seen !== undefined);
    console.log('- type is valid:', ['like', 'comment', 'follow_request', 'follow_accept'].includes(notificationData.type));

    // Attempt to create the notification
    console.log('Attempting to create notification document...');
    const docRef = await addDoc(notificationsRef, notificationData);
    
    console.log('✅ Notification created successfully!');
    console.log('Document ID:', docRef.id);
    console.log('Collection path:', docRef.parent.path);
    
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating unified notification:', error);
    console.error('Error details:');
    console.error('- Code:', error.code);
    console.error('- Message:', error.message);
    console.error('- Stack:', error.stack);
    
    // Log specific error types
    if (error.code === 'permission-denied') {
      console.error('PERMISSION DENIED - Check Firestore rules for notifications collection');
      console.error('Required path: /notifications/{receiverId}/items');
      console.error('Receiver ID:', receiverId);
      console.error('Sender ID:', senderId);
    } else if (error.code === 'invalid-argument') {
      console.error('INVALID ARGUMENT - Check data structure matches Firestore rules');
    } else if (error.code === 'not-found') {
      console.error('NOT FOUND - Collection or document path issue');
    }
    
    throw error;
  }
};

// Subscribe to real-time notifications
export const subscribeToUnifiedNotifications = (
  userId: string,
  callback: (notifications: UnifiedNotification[]) => void
) => {
  console.log('Setting up unified notification listener for user:', userId);
  
  const q = query(
    collection(db, 'notifications', userId, 'items'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  return onSnapshot(q, async (snapshot) => {
    console.log('Unified notification update received:', snapshot.docs.length, 'notifications');
    
    const notifications: UnifiedNotification[] = [];
    
    for (const docSnap of snapshot.docs) {
      const notificationData = docSnap.data();
      
      // Get sender profile for display
      let senderProfile = null;
      try {
        const profile = await getUserProfile(notificationData.senderId);
        if (profile) {
          senderProfile = {
            username: profile.username,
            displayName: profile.displayName,
            avatar: profile.avatar
          };
        }
      } catch (error) {
        console.error('Error fetching sender profile:', error);
      }

      // Get post thumbnail for post-related notifications
      let postThumbnail = null;
      if (notificationData.postId && (notificationData.type === 'like' || notificationData.type === 'comment')) {
        try {
          const postDoc = await getDoc(doc(db, 'posts', notificationData.postId));
          if (postDoc.exists()) {
            postThumbnail = postDoc.data().mediaURL;
          }
        } catch (error) {
          console.error('Error fetching post thumbnail:', error);
        }
      }

      notifications.push({
        id: docSnap.id,
        type: notificationData.type,
        senderId: notificationData.senderId,
        receiverId: notificationData.receiverId,
        timestamp: notificationData.timestamp,
        seen: notificationData.seen || false,
        postId: notificationData.postId,
        commentText: notificationData.commentText,
        aggregatedCount: notificationData.aggregatedCount || 1,
        lastActors: notificationData.lastActors || [notificationData.senderId],
        senderProfile,
        postThumbnail
      } as UnifiedNotification);
    }
    
    callback(notifications);
  }, (error) => {
    console.error('Error in unified notification listener:', error);
    callback([]);
  });
};

// Mark notification as seen
export const markUnifiedNotificationAsSeen = async (userId: string, notificationId: string) => {
  try {
    await updateDoc(doc(db, 'notifications', userId, 'items', notificationId), {
      seen: true
    });
  } catch (error) {
    console.error('Error marking unified notification as seen:', error);
  }
};

// Mark all notifications as seen
export const markAllUnifiedNotificationsAsSeen = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications', userId, 'items'),
      where('seen', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { seen: true });
    });
    
    await batch.commit();
    console.log('All unified notifications marked as seen');
  } catch (error) {
    console.error('Error marking all unified notifications as seen:', error);
  }
};

// Delete notification
export const deleteUnifiedNotification = async (userId: string, notificationId: string) => {
  try {
    await deleteDoc(doc(db, 'notifications', userId, 'items', notificationId));
  } catch (error) {
    console.error('Error deleting unified notification:', error);
  }
};

// Remove notification when user performs reverse action
export const removeUnifiedNotification = async (
  receiverId: string,
  senderId: string,
  type: string,
  postId?: string
) => {
  try {
    console.log('Removing unified notification:', { receiverId, senderId, type, postId });
    
    const q = query(
      collection(db, 'notifications', receiverId, 'items'),
      where('type', '==', type),
      ...(postId ? [where('postId', '==', postId)] : []),
      ...(type !== 'like' ? [where('senderId', '==', senderId)] : [])
    );
    
    const snapshot = await getDocs(q);
    console.log('Found notifications to remove/update:', snapshot.docs.length);
    
    if (type === 'like' && snapshot.docs.length > 0) {
      // For likes, handle aggregation
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      if (data.aggregatedCount > 1) {
        // Remove sender from aggregation
        const newActors = (data.lastActors || []).filter(id => id !== senderId);
        const newCount = (data.aggregatedCount || 1) - 1;
        
        await updateDoc(doc.ref, {
          aggregatedCount: newCount,
          lastActors: newActors,
          senderId: newActors[0] || data.senderId,
          timestamp: serverTimestamp()
        });
        console.log('Updated aggregated like notification');
      } else {
        // Delete if it was the only like
        await deleteDoc(doc.ref);
        console.log('Deleted last like notification');
      }
    } else {
      // For other types, delete all matching notifications
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`Deleted ${snapshot.docs.length} ${type} notifications`);
    }
  } catch (error) {
    console.error('Error removing unified notification:', error);
  }
};

// Specific notification creators
export const createLikeNotification = async (
  postOwnerId: string,
  likerId: string,
  postId: string
) => {
  return await createUnifiedNotification(postOwnerId, likerId, 'like', { postId });
};

export const createCommentNotification = async (
  postOwnerId: string,
  commenterId: string,
  postId: string,
  commentText?: string
) => {
  return await createUnifiedNotification(postOwnerId, commenterId, 'comment', { 
    postId, 
    commentText: commentText?.substring(0, 100) 
  });
};

export const createFollowRequestNotification = async (
  targetUserId: string,
  requesterId: string
) => {
  console.log('🔔 Creating follow request notification');
  console.log('Target user (receiver):', targetUserId);
  console.log('Requester (sender):', requesterId);
  
  return await createUnifiedNotification(targetUserId, requesterId, 'follow_request');
};

export const createFollowAcceptNotification = async (
  requesterId: string,
  accepterId: string
) => {
  return await createUnifiedNotification(requesterId, accepterId, 'follow_accept');
};
