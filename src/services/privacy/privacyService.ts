
import { 
  doc, 
  onSnapshot,
  getDoc,
  collection,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// Subscribe to follow request status
export const subscribeToFollowRequestStatus = (
  currentUserId: string,
  targetUserId: string,
  callback: (hasRequest: boolean) => void
) => {
  const followRequestRef = doc(db, 'users', targetUserId, 'followRequests', currentUserId);
  
  return onSnapshot(followRequestRef, (doc) => {
    callback(doc.exists());
  }, (error) => {
    console.error('Error in follow request status subscription:', error);
    callback(false);
  });
};

// Subscribe to blocked status
export const subscribeToBlockedStatus = (
  currentUserId: string,
  targetUserId: string,
  callback: (isBlocked: boolean) => void
) => {
  const blockedRef = doc(db, 'users', currentUserId, 'blockedUsers', targetUserId);
  
  return onSnapshot(blockedRef, (doc) => {
    callback(doc.exists());
  }, (error) => {
    console.error('Error in blocked status subscription:', error);
    callback(false);
  });
};

// Check if user is private
export const checkIfUserIsPrivate = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().isPrivate === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking if user is private:', error);
    return false;
  }
};

// Block user function
export const blockUser = async (currentUserId: string, targetUserId: string) => {
  try {
    console.log('Blocking user:', targetUserId);
    
    // Get target user info for blocked users collection
    const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
    const targetUserData = targetUserDoc.exists() ? targetUserDoc.data() : {};
    
    // Add to blocked users collection
    await setDoc(doc(db, 'users', currentUserId, 'blockedUsers', targetUserId), {
      userId: targetUserId,
      username: targetUserData.username || 'Unknown User',
      displayName: targetUserData.displayName || 'Unknown User',
      avatar: targetUserData.avatar || null,
      blockedAt: serverTimestamp()
    });
    
    // Remove from following/followers if exists
    try {
      await deleteDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
      await deleteDoc(doc(db, 'users', targetUserId, 'followers', currentUserId));
      await deleteDoc(doc(db, 'users', currentUserId, 'followers', targetUserId));
      await deleteDoc(doc(db, 'users', targetUserId, 'following', currentUserId));
    } catch (error) {
      console.log('Some follow relationships did not exist to delete:', error);
    }
    
    return {
      success: true,
      message: 'User has been blocked successfully'
    };
  } catch (error) {
    console.error('Error blocking user:', error);
    return {
      success: false,
      message: 'Failed to block user. Please try again.'
    };
  }
};

// Unblock user function
export const unblockUser = async (currentUserId: string, targetUserId: string) => {
  try {
    console.log('Unblocking user:', targetUserId);
    
    // Remove from blocked users collection
    await deleteDoc(doc(db, 'users', currentUserId, 'blockedUsers', targetUserId));
    
    return {
      success: true,
      message: 'User has been unblocked successfully'
    };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return {
      success: false,
      message: 'Failed to unblock user. Please try again.'
    };
  }
};
