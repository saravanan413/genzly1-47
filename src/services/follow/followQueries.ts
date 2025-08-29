
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FollowData } from './types';

export const subscribeToFollowStatus = (
  currentUserId: string,
  targetUserId: string,
  callback: (isFollowing: boolean) => void
) => {
  const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  
  return onSnapshot(followingRef, (doc) => {
    callback(doc.exists());
  }, (error) => {
    console.error('Error in follow status subscription:', error);
    callback(false);
  });
};

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

export const subscribeToFollowersCount = (
  userId: string,
  callback: (count: number) => void
) => {
  const followersRef = collection(db, 'users', userId, 'followers');
  
  return onSnapshot(followersRef, (snapshot) => {
    callback(snapshot.docs.length);
  }, (error) => {
    console.error('Error in followers count subscription:', error);
    callback(0);
  });
};

export const subscribeToFollowingCount = (
  userId: string,
  callback: (count: number) => void
) => {
  const followingRef = collection(db, 'users', userId, 'following');
  
  return onSnapshot(followingRef, (snapshot) => {
    callback(snapshot.docs.length);
  }, (error) => {
    console.error('Error in following count subscription:', error);
    callback(0);
  });
};

export const getFollowers = async (userId: string): Promise<FollowData[]> => {
  try {
    const followersRef = collection(db, 'users', userId, 'followers');
    const q = query(followersRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        followerId: doc.id,
        followedId: userId,
        timestamp: data.timestamp,
        followerInfo: {
          uid: data.uid,
          username: data.username,
          displayName: data.displayName,
          avatar: data.avatar
        },
        followedInfo: {
          uid: userId,
          username: '',
          displayName: '',
          avatar: ''
        }
      };
    });
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
};

export const getFollowing = async (userId: string): Promise<FollowData[]> => {
  try {
    const followingRef = collection(db, 'users', userId, 'following');
    const q = query(followingRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        followerId: userId,
        followedId: doc.id,
        timestamp: data.timestamp,
        followerInfo: {
          uid: userId,
          username: '',
          displayName: '',
          avatar: ''
        },
        followedInfo: {
          uid: data.uid,
          username: data.username,
          displayName: data.displayName,
          avatar: data.avatar
        }
      };
    });
  } catch (error) {
    console.error('Error getting following:', error);
    return [];
  }
};

export const getFollowRequests = async (userId: string): Promise<FollowData[]> => {
  try {
    const followRequestsRef = collection(db, 'users', userId, 'followRequests');
    const q = query(followRequestsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        followerId: doc.id,
        followedId: userId,
        timestamp: data.timestamp,
        followerInfo: {
          uid: data.uid,
          username: data.username,
          displayName: data.displayName,
          avatar: data.avatar
        },
        followedInfo: {
          uid: userId,
          username: '',
          displayName: '',
          avatar: ''
        }
      };
    });
  } catch (error) {
    console.error('Error getting follow requests:', error);
    return [];
  }
};
