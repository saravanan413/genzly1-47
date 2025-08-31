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
import { db, auth } from '../config/firebase';
import { getUserProfile } from './firestoreService';

export interface UnifiedNotification {
  id: string;
  type: 'like' | 'comment' | 'follow_request' | 'follow_accept';
  senderId: string;
  receiverId: string;
  timestamp: any;
  seen: boolean;
  aggregatedCount: number;
  lastActors: string[];
  postId?: string;
  commentText?: string;
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
    commentText?: string; // NOTE: Will NOT be written due to Firestore rule keys().hasOnly
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
      console.warn('Could not find sender profile for:', senderId);
    }
    console.log('Sender profile found:', senderProfile?.username);

    // Reference to the correct path: /notifications/{receiverId}/items
    const notificationsRef = collection(db, 'notifications', receiverId, 'items');
    console.log('Notifications collection path:', `notifications/${receiverId}/items`);

    // IMPORTANT: Your Firestore rule allows only the receiver (owner) to update.
    // Therefore, DO NOT perform sender-side updates for aggregation or timestamp refresh.
    // We will:
    // - Not aggregate likes client-side (no updates to existing docs).
    // - For follow_request duplicates, just return the existing doc without updating.

    // For follow requests, check for duplicates but DO NOT update existing (rule disallows sender updates)
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
        console.log('Follow request notification already exists; returning existing without update');
        const existingDoc = existingDocs.docs[0];
        return existingDoc.id;
      }
      console.log('No existing follow request notification found, creating new one');
    }

    // Create notification data with EXACT fields allowed by Firestore rules
    // Allowed keys: receiverId, senderId, type, timestamp, seen, aggregatedCount, lastActors, postId, commentId, reelId
    const notificationData: any = {
      receiverId: receiverId,
      senderId: senderId,
      type: type,
      timestamp: serverTimestamp(), // Must equal request.time in rules
      seen: false,
      aggregatedCount: 1,
      lastActors: [senderId]
    };

    // Add optional fields only if they exist and are allowed by the rule
    if (additionalData?.postId) {
      notificationData.postId = additionalData.postId;
    }
    // DO NOT WRITE commentText (not allowed by keys().hasOnly)
    // If you have a comment id, pass it here in the future:
    // if (additionalData?.commentId) { notificationData.commentId = additionalData.commentId; }

    console.log('Creating notification document with data structure that matches Firestore rules:');
    console.log('- receiverId:', notificationData.receiverId, '(matches userId in path)');
    console.log('- senderId:', notificationData.senderId, '(matches current user)');
    console.log('- type:', notificationData.type, '(valid type)');
    console.log('- timestamp:', '[ServerTimestamp]', '(must equal request.time)');
    console.log('- seen:', notificationData.seen, '(false on create)');
    console.log('- aggregatedCount:', notificationData.aggregatedCount, '(number >= 1)');
    console.log('- lastActors:', notificationData.lastActors, '(non-empty list)');
    console.log('- postId (optional):', notificationData.postId || 'not set');

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
    
    // Log specific error types with detailed debugging
    if (error.code === 'permission-denied') {
      console.error('PERMISSION DENIED - Firestore rule validation failed');
      console.error('Required by rules:');
      console.error('1. request.auth != null (user authenticated)');
      console.error('2. request.resource.data.receiverId == userId (path matches)');
      console.error('3. request.resource.data.senderId == request.auth.uid (sender is current user)');
      console.error('4. request.resource.data.type in valid types');
      console.error('5. request.resource.data.timestamp == request.time (server timestamp)');
      console.error('6. request.resource.data.seen == false');
      console.error('7. request.resource.data.aggregatedCount is number >= 1');
      console.error('8. request.resource.data.lastActors is list with size > 0');
      console.error('9. keys().hasOnly allowed fields (no commentText, etc.)');
      console.error('Receiver ID:', receiverId);
      console.error('Sender ID:', senderId);
    } else if (error.code === 'invalid-argument') {
      console.error('INVALID ARGUMENT - Check data structure');
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
        commentText: notificationData.commentText, // may be undefined; UI handles fallback
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

    // Your rules only allow the OWNER (receiverId) to update/delete notifications.
    // If current user is not the owner, skip any write to avoid permission errors.
    const currentUid = auth.currentUser?.uid;
    if (currentUid !== receiverId) {
      console.log('Skipping notification removal: only the notification owner can modify/delete per rules');
      return;
    }
    
    // Since we no longer aggregate likes client-side, simply delete matching docs when owner triggers the action.
    const q = query(
      collection(db, 'notifications', receiverId, 'items'),
      where('type', '==', type),
      ...(postId ? [where('postId', '==', postId)] : []),
      ...(type !== 'like' ? [where('senderId', '==', senderId)] : [])
    );
    
    const snapshot = await getDocs(q);
    console.log('Found notifications to remove:', snapshot.docs.length);
    
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    console.log(`Deleted ${snapshot.docs.length} ${type} notifications`);
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
  // No client-side aggregation updates (rule forbids sender updates)
  return await createUnifiedNotification(postOwnerId, likerId, 'like', { postId });
};

export const createCommentNotification = async (
  postOwnerId: string,
  commenterId: string,
  postId: string,
  commentText?: string
) => {
  // commentText intentionally NOT written due to keys().hasOnly in rules
  return await createUnifiedNotification(postOwnerId, commenterId, 'comment', { 
    postId, 
    // commentText is ignored in createUnifiedNotification to satisfy rules
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
