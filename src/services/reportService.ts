
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ReportData {
  reportedById: string;
  reportedByUsername: string;
  reportedUserId?: string;
  reportedUsername?: string;
  postId?: string;
  postAuthorId?: string;
  reason: string;
  description?: string;
  timestamp: any;
  status: 'pending' | 'reviewed' | 'resolved';
}

export const reportUser = async (
  reportedById: string,
  reportedByUsername: string,
  reportedUserId: string,
  reportedUsername: string,
  reason: string,
  description?: string
): Promise<boolean> => {
  try {
    const reportData: ReportData = {
      reportedById,
      reportedByUsername,
      reportedUserId,
      reportedUsername,
      reason,
      description,
      timestamp: serverTimestamp(),
      status: 'pending'
    };

    await addDoc(collection(db, 'reports'), reportData);
    console.log('User report submitted successfully');
    return true;
  } catch (error) {
    console.error('Error reporting user:', error);
    return false;
  }
};

export const reportPost = async (
  reportedById: string,
  reportedByUsername: string,
  postId: string,
  postAuthorId: string,
  reason: string,
  description?: string
): Promise<boolean> => {
  try {
    const reportData: ReportData = {
      reportedById,
      reportedByUsername,
      postId,
      postAuthorId,
      reason,
      description,
      timestamp: serverTimestamp(),
      status: 'pending'
    };

    await addDoc(collection(db, 'reports'), reportData);
    console.log('Post report submitted successfully');
    return true;
  } catch (error) {
    console.error('Error reporting post:', error);
    return false;
  }
};
