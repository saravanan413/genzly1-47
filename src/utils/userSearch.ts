
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../services/firestoreService';

export const searchUsers = async (searchQuery: string): Promise<UserProfile[]> => {
  if (!searchQuery.trim()) {
    return [];
  }

  try {
    const usersRef = collection(db, 'users');
    const searchTerm = searchQuery.toLowerCase();
    
    // Search by username
    const usernameQuery = query(
      usersRef,
      where('username', '>=', searchTerm),
      where('username', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    
    const usernameSnapshot = await getDocs(usernameQuery);
    const usernameResults: UserProfile[] = usernameSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        email: data.email || '',
        username: data.username || '',
        displayName: data.displayName || '',
        avatar: data.avatar,
        bio: data.bio,
        externalLink: data.externalLink,
        followers: data.followers || 0,
        following: data.following || 0,
        postsCount: data.postsCount || 0,
        isVerified: data.isVerified || false
      } as UserProfile;
    });

    // Search by display name
    const nameQuery = query(
      usersRef,
      where('displayName', '>=', searchQuery),
      where('displayName', '<=', searchQuery + '\uf8ff'),
      limit(10)
    );
    
    const nameSnapshot = await getDocs(nameQuery);
    const nameResults: UserProfile[] = nameSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        email: data.email || '',
        username: data.username || '',
        displayName: data.displayName || '',
        avatar: data.avatar,
        bio: data.bio,
        externalLink: data.externalLink,
        followers: data.followers || 0,
        following: data.following || 0,
        postsCount: data.postsCount || 0,
        isVerified: data.isVerified || false
      } as UserProfile;
    });

    // Combine and deduplicate results
    const allResults = [...usernameResults, ...nameResults];
    const uniqueResults = allResults.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    return uniqueResults;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};
