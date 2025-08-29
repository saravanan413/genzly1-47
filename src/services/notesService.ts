import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getFollowing } from './follow/followQueries';

export interface Note {
  uid: string;
  content: string;
  createdAt: Date;
  username?: string;
  userAvatar?: string;
}

// Create or update a note
export const createNote = async (userId: string, content: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', userId, 'notes', userId), {
      uid: userId,
      content,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'notes', userId));
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Subscribe to notes from followed users
export const subscribeToNotes = (
  userId: string,
  callback: (notes: Note[]) => void
): (() => void) => {
  const unsubscribeFunctions: (() => void)[] = [];
  
  const setupSubscriptions = async () => {
    try {
      // Get list of users that current user follows
      const following = await getFollowing(userId);
      const followedUserIds = following.map(f => f.followedId);
      
      // Add current user to the list to include their own note
      const allUserIds = [userId, ...followedUserIds];
      
      const allNotes: Note[] = [];
      let completedSubscriptions = 0;
      
      const checkAndUpdateNotes = () => {
        completedSubscriptions++;
        if (completedSubscriptions >= allUserIds.length) {
          // Filter notes that are less than 24 hours old
          const now = new Date();
          const validNotes = allNotes.filter(note => {
            const hoursDiff = (now.getTime() - note.createdAt.getTime()) / (1000 * 60 * 60);
            return hoursDiff < 24;
          });
          
          // Sort by creation time (newest first)
          validNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          callback(validNotes);
        }
      };
      
      // Subscribe to each user's note
      allUserIds.forEach(async (targetUserId) => {
        const noteDocRef = doc(db, 'users', targetUserId, 'notes', targetUserId);
        
        const unsubscribe = onSnapshot(noteDocRef, async (noteDoc) => {
          // Remove existing note for this user
          const existingIndex = allNotes.findIndex(note => note.uid === targetUserId);
          if (existingIndex >= 0) {
            allNotes.splice(existingIndex, 1);
          }
          
          if (noteDoc.exists()) {
            const noteData = noteDoc.data();
            
            // Get user profile data
            const userDoc = await getDoc(doc(db, 'users', targetUserId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            
            allNotes.push({
              uid: noteData.uid,
              content: noteData.content,
              createdAt: noteData.createdAt?.toDate() || new Date(),
              username: userData.username || 'Unknown',
              userAvatar: userData.avatar || userData.photoURL || null
            });
          }
          
          checkAndUpdateNotes();
        }, (error) => {
          console.error(`Error in note subscription for ${targetUserId}:`, error);
          checkAndUpdateNotes();
        });
        
        unsubscribeFunctions.push(unsubscribe);
      });
      
    } catch (error) {
      console.error('Error setting up notes subscriptions:', error);
      callback([]);
    }
  };
  
  setupSubscriptions();
  
  // Return cleanup function
  return () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  };
};