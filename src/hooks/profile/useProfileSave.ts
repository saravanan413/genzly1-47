
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { logger } from '../../utils/logger';

interface SaveProfileData {
  username: string;
  displayName: string;
  bio: string;
  externalLink: string;
  profileImage: string;
}

export const useProfileSave = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Save profile with proper Firestore update
  const handleSave = async (profileData: SaveProfileData, hasErrors: boolean) => {
    if (!currentUser?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to save your profile",
        variant: "destructive"
      });
      return false;
    }
    
    // Validate before saving
    if (!profileData.username.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive"
      });
      return false;
    }
    
    if (hasErrors) {
      toast({
        title: "Error",
        description: "Please fix all errors before saving",
        variant: "destructive"
      });
      return false;
    }
    
    setSaving(true);
    try {
      logger.debug('Saving profile updates for user:', currentUser.uid);
      
      const updateData = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        username: profileData.username.trim(),
        displayName: profileData.displayName.trim(),
        bio: profileData.bio.trim(),
        externalLink: profileData.externalLink.trim(),
        avatar: profileData.profileImage,
        updatedAt: serverTimestamp(),
        // Preserve existing fields
        followers: 0,
        following: 0,
        postsCount: 0,
        isVerified: false
      };
      
      logger.debug('Update data:', updateData);
      
      // Use setDoc with merge to safely create or update
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, updateData, { merge: true });
      
      logger.info('Profile saved successfully');
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      return true;
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    handleSave
  };
};
