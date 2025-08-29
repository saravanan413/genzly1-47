
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
  setDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUserProfile } from './firestoreService';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow_request' | 'follow_accept';
  senderId: string;
  receiverId: string;
  timestamp: any;
  seen: boolean;
  postId?: string;
  commentText?: string;
  senderProfile?: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  postThumbnail?: string;
}

// Create notification using the new path structure
export const createNotification = async (
  receiverId: string,
  senderId: string,
  type: 'like' | 'comment' | 'follow_request' | 'follow_accept',
  additionalData?: {
    postId?: string;
    commentText?: string;
  }
) => {
  try {
    // Don't create notification for self-actions
    if (receiverId === senderId) {
      return;
    }

    // Get sender profile for notification display
    const senderProfile = await getUserProfile(senderId);
    if (!senderProfile) {
      console.error('Could not find sender profile for:', senderId);
      return;
    }

    // Check for duplicate notifications (for likes and follows)
    if (type === 'like' || type === 'follow_request') {
      const existingQuery = query(
        collection(db, 'notifications', receiverId, 'items'),
        where('senderId', '==', senderId),
        where('type', '==', type),
        ...(additionalData?.postId ? [where('postId', '==', additionalData.postId)] : [])
      );
      
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        console.log('Notification already exists, skipping creation');
        return;
      }
    }

    // Prepare notification data according to security rules
    const notificationData = {
      type,
      senderId,
      receiverId,
      timestamp: serverTimestamp(),
      seen: false,
      ...(additionalData?.postId && { postId: additionalData.postId }),
      ...(additionalData?.commentText && { commentText: additionalData.commentText })
    };

    console.log('Creating notification:', notificationData);

    // Create notification in the correct path: /notifications/{receiverId}/items/{notificationId}
    const docRef = await addDoc(
      collection(db, 'notifications', receiverId, 'items'), 
      notificationData
    );
    
    console.log(`${type} notification created successfully with ID:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Subscribe to real-time notifications
export const subscribeToNotifications = (
  userId: string, 
  callback: (notifications: Notification[]) => void
) => {
  console.log('Setting up notification listener for user:', userId);
  
  const q = query(
    collection(db, 'notifications', userId, 'items'),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    console.log('Notification update received:', snapshot.docs.length, 'notifications');
    
    const notifications: Notification[] = [];
    
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

      // Get post thumbnail if this is a post-related notification
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
        senderProfile,
        postThumbnail
      } as Notification);
    }
    
    callback(notifications);
  }, (error) => {
    console.error('Error in notification listener:', error);
    callback([]);
  });
};

// Mark notification as seen
export const markNotificationAsSeen = async (userId: string, notificationId: string) => {
  try {
    await updateDoc(doc(db, 'notifications', userId, 'items', notificationId), {
      seen: true
    });
  } catch (error) {
    console.error('Error marking notification as seen:', error);
  }
};

// Delete notification
export const deleteNotification = async (userId: string, notificationId: string) => {
  try {
    await deleteDoc(doc(db, 'notifications', userId, 'items', notificationId));
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
};

// Remove notification (for when user unlikes/unfollows)
export const removeNotification = async (
  receiverId: string,
  senderId: string,
  type: string,
  postId?: string
) => {
  try {
    const q = query(
      collection(db, 'notifications', receiverId, 'items'),
      where('senderId', '==', senderId),
      where('type', '==', type),
      ...(postId ? [where('postId', '==', postId)] : [])
    );
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`Removed ${snapshot.docs.length} ${type} notifications successfully`);
  } catch (error) {
    console.error('Error removing notification:', error);
  }
};

// Specific notification creators
export const createLikeNotification = async (
  postOwnerId: string,
  likerId: string,
  postId: string
) => {
  await createNotification(postOwnerId, likerId, 'like', { postId });
};

export const createCommentNotification = async (
  postOwnerId: string,
  commenterId: string,
  postId: string,
  commentText?: string
) => {
  await createNotification(postOwnerId, commenterId, 'comment', { 
    postId, 
    commentText: commentText?.substring(0, 100) 
  });
};

export const createFollowRequestNotification = async (
  targetUserId: string,
  requesterId: string
) => {
  await createNotification(targetUserId, requesterId, 'follow_request');
};

export const createFollowAcceptNotification = async (
  requesterId: string,
  accepterId: string
) => {
  await createNotification(requesterId, accepterId, 'follow_accept');
};
