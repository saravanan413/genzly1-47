
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { createLikeNotification, removeUnifiedNotification } from './unifiedNotificationService';

export interface PostReaction {
  userId: string;
  username: string;
  timestamp: any;
}

export const likePost = async (postId: string, userId: string, username: string) => {
  try {
    console.log('Liking post:', { postId, userId, username });
    
    const postRef = doc(db, 'posts', postId);
    
    // Get post data to find the owner
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      console.error('Post not found');
      return false;
    }
    
    const postData = postDoc.data();
    const postOwnerId = postData.userId;
    
    console.log('Post owner ID:', postOwnerId);
    
    // Update the post
    await updateDoc(postRef, {
      likes: arrayUnion(userId),
      likeCount: increment(1),
      [`reactions.${userId}`]: {
        userId,
        username,
        type: 'like',
        timestamp: new Date()
      }
    });
    
    console.log('Post updated successfully');
    
    // Create unified notification for the post owner (if not liking own post)
    if (postOwnerId && postOwnerId !== userId) {
      console.log('Creating unified like notification...');
      await createLikeNotification(postOwnerId, userId, postId);
      console.log('Unified like notification created successfully');
    } else {
      console.log('Not creating notification - user liked own post or no owner found');
    }
    
    return true;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
};

export const unlikePost = async (postId: string, userId: string) => {
  try {
    console.log('Unliking post:', { postId, userId });
    
    const postRef = doc(db, 'posts', postId);
    
    // Get post data to find the owner
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      console.error('Post not found');
      return false;
    }
    
    const postData = postDoc.data();
    const postOwnerId = postData.userId;
    
    console.log('Post owner ID for unlike:', postOwnerId);
    
    // Update the post
    await updateDoc(postRef, {
      likes: arrayRemove(userId),
      likeCount: increment(-1),
      [`reactions.${userId}`]: null
    });
    
    console.log('Post unliked successfully');
    
    // Remove unified like notification (if exists)
    if (postOwnerId && postOwnerId !== userId) {
      console.log('Removing unified like notification...');
      await removeUnifiedNotification(postOwnerId, userId, 'like', postId);
      console.log('Unified like notification removed successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
};

export const subscribeToPostReactions = (postId: string, callback: (likes: string[], likeCount: number) => void) => {
  const postRef = doc(db, 'posts', postId);
  
  return onSnapshot(postRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.likes || [], data.likeCount || 0);
    }
  });
};

export const checkIfLiked = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const likes = postDoc.data().likes || [];
      return likes.includes(userId);
    }
    return false;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
};
