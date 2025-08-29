
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '../../services/firestoreService';

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  externalLink: string;
  profileImage: string;
}

export const useProfileData = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Profile data state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');

  // Original data for comparison
  const [originalData, setOriginalData] = useState<ProfileData>({
    username: '',
    displayName: '',
    bio: '',
    externalLink: '',
    profileImage: ''
  });

  const [loading, setLoading] = useState(true);

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser?.uid) return;
      
      setLoading(true);
      try {
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setUsername(profile.username || '');
          setDisplayName(profile.displayName || '');
          setBio(profile.bio || '');
          setExternalLink(profile.externalLink || '');
          setProfileImage(profile.avatar || '');
          
          // Store original data
          const originalProfile = {
            username: profile.username || '',
            displayName: profile.displayName || '',
            bio: profile.bio || '',
            externalLink: profile.externalLink || '',
            profileImage: profile.avatar || ''
          };
          setOriginalData(originalProfile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      }
      setLoading(false);
    };

    loadUserProfile();
  }, [currentUser, toast]);

  // Check if any changes were made
  const hasChanges = () => {
    return (
      username !== originalData.username ||
      displayName !== originalData.displayName ||
      bio !== originalData.bio ||
      externalLink !== originalData.externalLink ||
      profileImage !== originalData.profileImage
    );
  };

  // Generate default avatar URL - use uploaded neutral image
  const getFallbackAvatar = () => {
    return '/lovable-uploads/07e28f82-bd38-410c-a208-5db174616626.png';
  };

  // Get display avatar (with neutral fallback)
  const getDisplayAvatar = () => {
    return profileImage || getFallbackAvatar();
  };

  const updateOriginalData = (newData: ProfileData) => {
    setOriginalData(newData);
  };

  return {
    // State
    username,
    displayName,
    bio,
    externalLink,
    profileImage,
    originalData,
    loading,
    
    // Setters
    setUsername,
    setDisplayName,
    setBio,
    setExternalLink,
    setProfileImage,
    updateOriginalData,
    
    // Computed
    hasChanges: hasChanges(),
    displayAvatar: getDisplayAvatar(),
    getFallbackAvatar
  };
};
