import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    return {
      uid: userId,
      username: userData.username || 'unknown',
      displayName: userData.displayName || userData.name || userData.username || 'Unknown User',
      avatar: userData.photoURL || userData.avatar,
      bio: userData.bio,
      followerCount: userData.followerCount || 0,
      followingCount: userData.followingCount || 0,
      postCount: userData.postCount || 0
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const batchGetUserProfiles = async (userIds: string[]): Promise<Map<string, UserProfile>> => {
  const profiles = new Map<string, UserProfile>();
  
  try {
    const promises = userIds.map(async (userId) => {
      const profile = await getUserProfile(userId);
      if (profile) {
        profiles.set(userId, profile);
      }
    });
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error batch fetching user profiles:', error);
  }
  
  return profiles;
};