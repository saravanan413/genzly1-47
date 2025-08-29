import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  where,
  onSnapshot,
  startAfter,
  DocumentSnapshot,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  id: string;
  uid?: string; // Add uid as optional since some code expects it
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  externalLink?: string;
  followers: number;
  following: number;
  postsCount: number;
  isVerified?: boolean;
  isPrivate?: boolean; // Add isPrivate property
}

export interface Post {
  id: string;
  userId: string;
  caption: string;
  mediaURL: string;
  mediaType: 'image' | 'video';
  timestamp: any;
  likes: number;
  comments: number;
  user: {
    username: string;
    displayName: string;
    avatar?: string;
  };
}

export interface Reel {
  id: string;
  userId: string;
  videoURL: string;
  thumbnailURL?: string;
  caption: string;
  music?: string;
  timestamp: any;
  likes: number;
  comments: number;
  shares: number;
  user: {
    username: string;
    displayName: string;
    avatar?: string;
  };
}

export interface Story {
  id: string;
  userId: string;
  mediaURL: string;
  mediaType: 'image' | 'video';
  timestamp: any;
  expiresAt: any;
  createdAt?: number;
  user: {
    username: string;
    displayName: string;
    avatar?: string;
  };
}

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Get feed posts with pagination
export const getFeedPosts = async (lastDoc?: DocumentSnapshot, limitCount = 10): Promise<{ posts: Post[], lastDoc: DocumentSnapshot | null }> => {
  try {
    let q = query(
      collection(db, 'posts'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'posts'),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const posts: Post[] = [];
    
    for (const docSnap of snapshot.docs) {
      const postData = docSnap.data();
      const userProfile = await getUserProfile(postData.userId);
      
      posts.push({
        id: docSnap.id,
        ...postData,
        user: {
          username: userProfile?.username || 'unknown',
          displayName: userProfile?.displayName || 'Unknown User',
          avatar: userProfile?.avatar
        }
      } as Post);
    }

    const lastDocument = snapshot.docs[snapshot.docs.length - 1] || null;
    return { posts, lastDoc: lastDocument };
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    return { posts: [], lastDoc: null };
  }
};

// Get user's posts
export const getUserPosts = async (userId: string): Promise<Post[]> => {
  try {
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const userProfile = await getUserProfile(userId);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      user: {
        username: userProfile?.username || 'unknown',
        displayName: userProfile?.displayName || 'Unknown User',
        avatar: userProfile?.avatar
      }
    })) as Post[];
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
};

// Get reels with pagination
export const getReels = async (lastDoc?: DocumentSnapshot, limitCount = 10): Promise<{ reels: Reel[], lastDoc: DocumentSnapshot | null }> => {
  try {
    let q = query(
      collection(db, 'reels'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'reels'),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const reels: Reel[] = [];
    
    for (const docSnap of snapshot.docs) {
      const reelData = docSnap.data();
      const userProfile = await getUserProfile(reelData.userId);
      
      reels.push({
        id: docSnap.id,
        ...reelData,
        user: {
          username: userProfile?.username || 'unknown',
          displayName: userProfile?.displayName || 'Unknown User',
          avatar: userProfile?.avatar
        }
      } as Reel);
    }

    const lastDocument = snapshot.docs[snapshot.docs.length - 1] || null;
    return { reels, lastDoc: lastDocument };
  } catch (error) {
    console.error('Error fetching reels:', error);
    return { reels: [], lastDoc: null };
  }
};

// Get active stories (not expired)
export const getActiveStories = async (): Promise<{ [userId: string]: Story[] }> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '>', now),
      orderBy('expiresAt'),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const storiesByUser: { [userId: string]: Story[] } = {};
    
    for (const docSnap of snapshot.docs) {
      const storyData = docSnap.data();
      const userProfile = await getUserProfile(storyData.userId);
      
      const story: Story = {
        id: docSnap.id,
        ...storyData,
        user: {
          username: userProfile?.username || 'unknown',
          displayName: userProfile?.displayName || 'Unknown User',
          avatar: userProfile?.avatar
        }
      } as Story;
      
      if (!storiesByUser[storyData.userId]) {
        storiesByUser[storyData.userId] = [];
      }
      storiesByUser[storyData.userId].push(story);
    }
    
    return storiesByUser;
  } catch (error) {
    console.error('Error fetching stories:', error);
    return {};
  }
};

// Get followers/following count
export const getFollowStats = async (userId: string): Promise<{ followers: number, following: number }> => {
  try {
    const followersSnapshot = await getDocs(collection(db, 'followers', userId, 'list'));
    const followingSnapshot = await getDocs(collection(db, 'following', userId, 'list'));
    
    return {
      followers: followersSnapshot.size,
      following: followingSnapshot.size
    };
  } catch (error) {
    console.error('Error fetching follow stats:', error);
    return { followers: 0, following: 0 };
  }
};

// Get chat users (people you've chatted with)
export const getChatUsers = async (currentUserId: string): Promise<UserProfile[]> => {
  try {
    // This would need to be implemented based on your chat structure
    // For now, return empty array until chat history is built
    return [];
  } catch (error) {
    console.error('Error fetching chat users:', error);
    return [];
  }
};

// Update user profile using setDoc with merge
export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<boolean> => {
  try {
    console.log('🔄 Updating user profile for:', userId, profileData);
    const userDocRef = doc(db, 'users', userId);
    
    // Use setDoc with merge to safely update or create the document
    await setDoc(userDocRef, {
      ...profileData,
      uid: userId, // Ensure uid is always set
    }, { merge: true });
    
    console.log('✅ User profile updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    return false;
  }
};

// Check if username is available
export const checkUsernameAvailability = async (username: string, currentUserId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    
    const snapshot = await getDocs(q);
    
    // If no documents found, username is available
    if (snapshot.empty) {
      return true;
    }
    
    // If found, check if it belongs to current user
    const existingUser = snapshot.docs[0];
    return existingUser.id === currentUserId;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
};

// Create or update user profile with proper structure
export const createOrUpdateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<boolean> => {
  try {
    console.log('🔄 Creating/updating user profile for:', userId);
    const userDocRef = doc(db, 'users', userId);
    
    // Prepare the profile data with required fields
    const fullProfileData = {
      uid: userId,
      username: profileData.username || `user${Date.now()}`,
      displayName: profileData.displayName || 'User',
      avatar: profileData.avatar || '',
      bio: profileData.bio || '',
      followers: profileData.followers || 0,
      following: profileData.following || 0,
      postsCount: profileData.postsCount || 0,
      createdAt: serverTimestamp(),
      ...profileData // Override with any provided data
    };
    
    // Use setDoc with merge to safely create or update
    await setDoc(userDocRef, fullProfileData, { merge: true });
    
    console.log('✅ User profile created/updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating/updating user profile:', error);
    return false;
  }
};
