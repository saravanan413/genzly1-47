
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Highlight {
  id: string;
  userId: string;
  name: string;
  coverImage: string;
  stories: string[]; // Array of story IDs
  createdAt: any;
  updatedAt: any;
}

export const createHighlight = async (
  userId: string,
  name: string,
  storyIds: string[],
  coverImage: string
): Promise<string | null> => {
  try {
    const highlightData = {
      userId,
      name: name.trim(),
      stories: storyIds,
      coverImage,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const highlightRef = await addDoc(collection(db, 'highlights'), highlightData);
    console.log('Highlight created with ID:', highlightRef.id);
    return highlightRef.id;
  } catch (error) {
    console.error('Error creating highlight:', error);
    return null;
  }
};

export const getUserHighlights = async (userId: string): Promise<Highlight[]> => {
  try {
    const q = query(
      collection(db, 'highlights'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Highlight[];
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return [];
  }
};

export const addStoryToHighlight = async (
  highlightId: string,
  storyId: string
): Promise<boolean> => {
  try {
    const highlightRef = doc(db, 'highlights', highlightId);
    
    // Get current highlight data
    const highlightDoc = await getDocs(query(collection(db, 'highlights'), where('__name__', '==', highlightId)));
    const currentHighlight = highlightDoc.docs[0]?.data();
    
    if (!currentHighlight) return false;
    
    const updatedStories = [...(currentHighlight.stories || []), storyId];
    
    await updateDoc(highlightRef, {
      stories: updatedStories,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error adding story to highlight:', error);
    return false;
  }
};

export const deleteHighlight = async (highlightId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'highlights', highlightId));
    console.log('Highlight deleted:', highlightId);
    return true;
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return false;
  }
};

export const updateHighlight = async (
  highlightId: string,
  updates: Partial<Highlight>
): Promise<boolean> => {
  try {
    const highlightRef = doc(db, 'highlights', highlightId);
    await updateDoc(highlightRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating highlight:', error);
    return false;
  }
};
