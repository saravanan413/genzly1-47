import { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { createLikeNotification, createCommentNotification } from '../services/unifiedNotificationService';

interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
}

export const useReelsActions = () => {
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const { currentUser } = useAuth();

  const likeReel = async (reelId: string) => {
    if (!currentUser) return false;

    try {
      setIsLiking(true);
      const reelRef = doc(db, 'reels', reelId);
      
      // Get reel data to find the owner
      const reelDoc = await getDoc(reelRef);
      if (!reelDoc.exists()) {
        console.error('Reel not found');
        return false;
      }
      
      const reelData = reelDoc.data();
      const reelOwnerId = reelData.userId;
      
      await updateDoc(reelRef, {
        likes: arrayUnion(currentUser.uid),
        likeCount: increment(1)
      });

      // Create unified notification for the reel owner (if not liking own reel)
      if (reelOwnerId && reelOwnerId !== currentUser.uid) {
        await createLikeNotification(reelOwnerId, currentUser.uid, reelId);
      }

      return true;
    } catch (error) {
      console.error('Error liking reel:', error);
      return false;
    } finally {
      setIsLiking(false);
    }
  };

  const unlikeReel = async (reelId: string) => {
    if (!currentUser) return false;

    try {
      setIsLiking(true);
      const reelRef = doc(db, 'reels', reelId);
      
      await updateDoc(reelRef, {
        likes: arrayRemove(currentUser.uid),
        likeCount: increment(-1)
      });

      return true;
    } catch (error) {
      console.error('Error unliking reel:', error);
      return false;
    } finally {
      setIsLiking(false);
    }
  };

  const addComment = async (reelId: string, commentText: string) => {
    if (!currentUser || !commentText.trim()) return false;

    try {
      setIsCommenting(true);
      
      // Get reel data to find the owner
      const reelDoc = await getDoc(doc(db, 'reels', reelId));
      if (!reelDoc.exists()) {
        console.error('Reel not found');
        return false;
      }
      
      const reelData = reelDoc.data();
      const reelOwnerId = reelData.userId;

      const reelRef = doc(db, 'reels', reelId);
      const comment = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        username: currentUser.displayName || 'Anonymous',
        text: commentText.trim(),
        timestamp: new Date()
      };

      await updateDoc(reelRef, {
        comments: arrayUnion(comment),
        commentCount: increment(1)
      });

      // Create unified notification for the reel owner (if not commenting on own reel)
      if (reelOwnerId && reelOwnerId !== currentUser.uid) {
        await createCommentNotification(reelOwnerId, currentUser.uid, reelId, commentText);
      }

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    } finally {
      setIsCommenting(false);
    }
  };

  return {
    isLiking,
    isCommenting,
    likeReel,
    unlikeReel,
    addComment
  };
};
