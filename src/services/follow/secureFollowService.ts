import { 
  doc, 
  writeBatch,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { SecurityService } from '../securityService';
import { logger } from '../../utils/logger';

export class SecureFollowService {
  // Secure follow operation with full validation
  static async followUser(
    currentUserId: string, 
    targetUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    
    // 1. Validate authentication
    const authCheck = SecurityService.validateAuth();
    if (!authCheck.isValid) {
      return { success: false, error: 'Authentication required' };
    }

    if (authCheck.userId !== currentUserId) {
      SecurityService.logSuspiciousActivity(authCheck.userId!, 'follow_user_mismatch');
      return { success: false, error: 'Unauthorized follow attempt' };
    }

    // 2. Check rate limiting
    if (!SecurityService.checkActionRateLimit('follow')) {
      return { success: false, error: 'Too many follow requests. Slow down.' };
    }

    // 3. Validate not following self
    if (currentUserId === targetUserId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    // 4. Check if current user is blocked
    const isBlocked = await SecurityService.isUserBlocked(currentUserId, targetUserId);
    if (isBlocked) {
      return { success: false, error: 'Follow request blocked' };
    }

    try {
      // 5. Get user profiles (Firestore rules will validate read access)
      const [currentUserDoc, targetUserDoc] = await Promise.all([
        getDoc(doc(db, 'users', currentUserId)),
        getDoc(doc(db, 'users', targetUserId))
      ]);
      
      if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const currentUserData = currentUserDoc.data();
      const targetUserData = targetUserDoc.data();

      // 6. Handle private accounts
      if (targetUserData.isPrivate) {
        // Send follow request instead of direct follow
        return await this.sendFollowRequest(currentUserId, targetUserId);
      }

      // 7. Use batch write for atomicity (Firestore rules will validate each write)
      const batch = writeBatch(db);

      // Create follower document - Firestore rule validates write access
      const followersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
      batch.set(followersRef, {
        uid: currentUserId,
        username: currentUserData.username || 'Unknown',
        displayName: currentUserData.displayName || 'Unknown User',
        avatar: currentUserData.avatar || null,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Create following document - Firestore rule validates write access
      const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
      batch.set(followingRef, {
        uid: targetUserId,
        username: targetUserData.username || 'Unknown',
        displayName: targetUserData.displayName || 'Unknown User',
        avatar: targetUserData.avatar || null,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      await batch.commit();
      
      logger.debug('Secure follow operation completed', { currentUserId, targetUserId });
      return { success: true };

    } catch (error: any) {
      logger.error('Secure follow operation failed', error);
      
      // Handle specific errors without exposing internal logic
      if (error.code === 'permission-denied') {
        SecurityService.logSuspiciousActivity(currentUserId, 'follow_permission_denied');
        return { success: false, error: 'Follow permission denied' };
      }
      
      return { success: false, error: 'Follow request failed' };
    }
  }

  // Send follow request for private accounts
  private static async sendFollowRequest(
    requesterId: string, 
    targetUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const requesterDoc = await getDoc(doc(db, 'users', requesterId));
      if (!requesterDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const requesterData = requesterDoc.data();
      
      // Create follow request - Firestore rules validate write access
      const followRequestRef = doc(db, 'users', targetUserId, 'followRequests', requesterId);
      await setDoc(followRequestRef, {
        uid: requesterId,
        username: requesterData.username || 'Unknown',
        displayName: requesterData.displayName || 'Unknown User',
        avatar: requesterData.avatar || null,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      
      logger.debug('Follow request sent', { requesterId, targetUserId });
      return { success: true };
      
    } catch (error: any) {
      logger.error('Follow request failed', error);
      
      if (error.code === 'permission-denied') {
        SecurityService.logSuspiciousActivity(requesterId, 'follow_request_denied');
        return { success: false, error: 'Follow request denied' };
      }
      
      return { success: false, error: 'Follow request failed' };
    }
  }
}
