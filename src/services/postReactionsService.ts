import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp,
  updateDoc,
  increment,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Like {
  id: string;
  userId: string;
  timestamp: any;
  username?: string;
  userAvatar?: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: any;
  username?: string;
  userAvatar?: string;
}

// Like functions
export const likePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const likesRef = collection(db, 'posts', postId, 'likes');
    await addDoc(likesRef, {
      userId,
      timestamp: serverTimestamp()
    });
    
    // Update like count in post document
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likeCount: increment(1)
    });
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

export const unlikePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const likesRef = collection(db, 'posts', postId, 'likes');
    const q = query(likesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const likeDoc = snapshot.docs[0];
      await deleteDoc(doc(db, 'posts', postId, 'likes', likeDoc.id));
      
      // Update like count in post document
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likeCount: increment(-1)
      });
    }
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
};

export const checkIfLiked = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const likesRef = collection(db, 'posts', postId, 'likes');
    const q = query(likesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if liked:', error);
    return false;
  }
};

// Real-time likes listener
export const subscribeLikes = (postId: string, callback: (likes: Like[]) => void) => {
  const likesRef = collection(db, 'posts', postId, 'likes');
  
  return onSnapshot(likesRef, (snapshot) => {
    const likes: Like[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Like[];
    callback(likes);
  });
};

// Comment functions
export const addComment = async (postId: string, userId: string, text: string): Promise<void> => {
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    await addDoc(commentsRef, {
      userId,
      text,
      timestamp: serverTimestamp()
    });
    
    // Update comment count in post document
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(1)
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
    
    // Update comment count in post document
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(-1)
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Real-time comments listener
export const subscribeComments = (postId: string, callback: (comments: Comment[]) => void) => {
  const commentsRef = collection(db, 'posts', postId, 'comments');
  
  return onSnapshot(commentsRef, (snapshot) => {
    const comments: Comment[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[];
    callback(comments.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
  });
};

// Reel reactions (same pattern)
export const likeReel = async (reelId: string, userId: string): Promise<void> => {
  try {
    const likesRef = collection(db, 'reels', reelId, 'likes');
    await addDoc(likesRef, {
      userId,
      timestamp: serverTimestamp()
    });
    
    const reelRef = doc(db, 'reels', reelId);
    await updateDoc(reelRef, {
      likeCount: increment(1)
    });
  } catch (error) {
    console.error('Error liking reel:', error);
    throw error;
  }
};

export const unlikeReel = async (reelId: string, userId: string): Promise<void> => {
  try {
    const likesRef = collection(db, 'reels', reelId, 'likes');
    const q = query(likesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const likeDoc = snapshot.docs[0];
      await deleteDoc(doc(db, 'reels', reelId, 'likes', likeDoc.id));
      
      const reelRef = doc(db, 'reels', reelId);
      await updateDoc(reelRef, {
        likeCount: increment(-1)
      });
    }
  } catch (error) {
    console.error('Error unliking reel:', error);
    throw error;
  }
};

export const addReelComment = async (reelId: string, userId: string, text: string): Promise<void> => {
  try {
    const commentsRef = collection(db, 'reels', reelId, 'comments');
    await addDoc(commentsRef, {
      userId,
      text,
      timestamp: serverTimestamp()
    });
    
    const reelRef = doc(db, 'reels', reelId);
    await updateDoc(reelRef, {
      commentCount: increment(1)
    });
  } catch (error) {
    console.error('Error adding reel comment:', error);
    throw error;
  }
};