import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  getDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUserProfile } from './firestoreService';

export interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'message' | 'follow_request';
  from: string;
  fromUsername: string;
  fromProfilePic?: string;
  postId?: string;
  timestamp: any;
  status?: 'pending' | 'accepted' | 'rejected';
  seen: boolean;
  fromUserId?: string;
  receiverId?: string;
  senderId?: string;
  title?: string;
  message?: string;
  text?: string;
  chatId?: string;
  senderProfile?: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  postThumbnail?: string;
}

export const createNotification = async (
  ownerId: string,
  type: 'like' | 'follow' | 'comment' | 'message' | 'follow_request',
  fromUserId: string,
  additionalData?: {
    postId?: string;
    status?: 'pending' | 'accepted' | 'rejected';
    text?: string;
  }
) => {
  try {
    console.log('Creating notification:', {
      ownerId,
      fromUserId,
      type,
      additionalData
    });

    if (ownerId === fromUserId) {
      console.log('Skipping notification - self action');
      return;
    }

    const senderProfile = await getUserProfile(fromUserId);
    if (!senderProfile) {
      console.error('Could not find sender profile for:', fromUserId);
      return;
    }

    // First, ensure the parent notifications document exists
    const notificationsDocRef = doc(db, 'users', ownerId, 'notifications', 'data');
    await setDoc(notificationsDocRef, { 
      userId: ownerId,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Check for existing notifications to avoid duplicates
    if (type === 'like' || type === 'follow') {
      const existingQuery = query(
        collection(db, 'users', ownerId, 'notifications', 'data', 'items'),
        where('from', '==', fromUserId),
        where('type', '==', type),
        ...(additionalData?.postId ? [where('postId', '==', additionalData.postId)] : [])
      );
      
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        console.log('Notification already exists, skipping creation');
        return;
      }
    }

    const notificationData = {
      type,
      from: fromUserId,
      fromUsername: senderProfile.username || 'Unknown',
      fromProfilePic: senderProfile.avatar || null,
      timestamp: serverTimestamp(),
      seen: false,
      fromUserId,
      receiverId: ownerId,
      senderId: fromUserId,
      ...(additionalData?.postId && { postId: additionalData.postId }),
      ...(additionalData?.status && { status: additionalData.status }),
      ...(additionalData?.text && { text: additionalData.text })
    };

    console.log('Creating notification with data:', notificationData);

    // Now create the notification in the items subcollection
    const docRef = await addDoc(
      collection(db, 'users', ownerId, 'notifications', 'data', 'items'), 
      notificationData
    );
    
    console.log(`${type} notification created successfully with ID:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    console.error('Error details:', error.code, error.message);
    
    if (error.code === 'permission-denied') {
      console.error('Permission denied details:', {
        ownerId,
        fromUserId,
        type,
        currentUser: 'Check if user is authenticated'
      });
    }
    
    throw error;
  }
};

export const subscribeToNotifications = (
  userId: string, 
  callback: (notifications: Notification[]) => void
) => {
  console.log('Setting up real-time notification listener for user:', userId);
  console.log('Listening to path: users/' + userId + '/notifications/data/items');
  
  const q = query(
    collection(db, 'users', userId, 'notifications', 'data', 'items'),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    console.log('=== NOTIFICATION SNAPSHOT UPDATE ===');
    console.log('Notifications count:', snapshot.docs.length);
    
    const notifications: Notification[] = [];
    
    for (const docSnap of snapshot.docs) {
      const notificationData = docSnap.data();
      console.log('Processing notification:', notificationData.type, 'from:', notificationData.from || notificationData.fromUserId);
      
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
        from: notificationData.from || notificationData.fromUserId,
        fromUserId: notificationData.from || notificationData.fromUserId,
        fromUsername: notificationData.fromUsername || 'Unknown',
        fromProfilePic: notificationData.fromProfilePic,
        postId: notificationData.postId,
        timestamp: notificationData.timestamp,
        status: notificationData.status,
        seen: notificationData.seen || false,
        receiverId: notificationData.receiverId || userId,
        senderId: notificationData.senderId || notificationData.from || notificationData.fromUserId,
        text: notificationData.text,
        postThumbnail,
        senderProfile: {
          username: notificationData.fromUsername || 'Unknown',
          displayName: notificationData.fromUsername || 'Unknown',
          avatar: notificationData.fromProfilePic
        }
      } as Notification);
    }
    
    console.log('=== PROCESSED NOTIFICATIONS ===');
    console.log('Total processed:', notifications.length);
    notifications.forEach(n => console.log(`- ${n.type} from ${n.fromUsername}`));
    
    callback(notifications);
  }, (error) => {
    console.error('Error in notification listener:', error);
    callback([]);
  });
};

export const markNotificationAsSeen = async (userId: string, notificationId: string) => {
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', 'data', 'items', notificationId), {
      seen: true
    });
  } catch (error) {
    console.error('Error marking notification as seen:', error);
  }
};

export const deleteNotification = async (userId: string, notificationId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'notifications', 'data', 'items', notificationId));
    console.log('Notification deleted successfully');
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
};

export const updateNotificationStatus = async (
  userId: string, 
  notificationId: string, 
  status: 'accepted' | 'rejected'
) => {
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', 'data', 'items', notificationId), {
      status
    });
    console.log('Notification status updated to:', status);
  } catch (error) {
    console.error('Error updating notification status:', error);
  }
};

export const createLikeNotification = async (
  postOwnerId: string,
  likerId: string,
  postId: string
) => {
  console.log('Creating like notification:', { postOwnerId, likerId, postId });
  await createNotification(postOwnerId, 'like', likerId, { postId });
};

export const createCommentNotification = async (
  postOwnerId: string,
  commenterId: string,
  postId: string,
  commentText?: string
) => {
  console.log('Creating comment notification:', { postOwnerId, commenterId, postId });
  await createNotification(postOwnerId, 'comment', commenterId, { 
    postId, 
    text: commentText?.substring(0, 100) 
  });
};

export const createFollowNotification = async (
  targetUserId: string,
  followerId: string
) => {
  console.log('Creating follow notification:', { targetUserId, followerId });
  await createNotification(targetUserId, 'follow', followerId);
};

export const createFollowRequestNotification = async (
  targetUserId: string,
  requesterId: string
) => {
  console.log('Creating follow request notification:', { targetUserId, requesterId });
  try {
    await createNotification(targetUserId, 'follow_request', requesterId, { status: 'pending' });
    console.log('Follow request notification created and should appear in real-time');
  } catch (error) {
    console.error('Failed to create follow request notification:', error);
    throw error;
  }
};

export const removeNotification = async (
  targetUserId: string,
  fromUserId: string,
  type: string,
  postId?: string
) => {
  try {
    console.log('Removing notification:', { targetUserId, fromUserId, type, postId });
    
    const q = query(
      collection(db, 'users', targetUserId, 'notifications', 'data', 'items'),
      where('from', '==', fromUserId),
      where('type', '==', type),
      ...(postId ? [where('postId', '==', postId)] : [])
    );
    
    const snapshot = await getDocs(q);
    console.log('Found notifications to remove:', snapshot.docs.length);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`Removed ${snapshot.docs.length} ${type} notifications successfully`);
  } catch (error) {
    console.error('Error removing notification:', error);
  }
};

export { createNotification as createLegacyNotification };
