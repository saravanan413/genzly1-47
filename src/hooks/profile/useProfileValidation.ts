
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkUsernameAvailability } from '../../services/firestoreService';

export const useProfileValidation = (originalUsername: string) => {
  const { currentUser } = useAuth();
  const [usernameError, setUsernameError] = useState('');
  const [linkError, setLinkError] = useState('');

  // Handle username change with validation
  const handleUsernameChange = async (value: string) => {
    setUsernameError('');
    
    if (!value.trim()) {
      setUsernameError('Username is required');
      return;
    }
    
    if (value === originalUsername) {
      return; // No change
    }
    
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    
    // Check if username is available
    if (!currentUser?.uid) return;
    
    const isAvailable = await checkUsernameAvailability(value, currentUser.uid);
    if (!isAvailable) {
      setUsernameError('Username is already taken');
    }
  };

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Empty is allowed
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  // Handle external link validation
  const handleExternalLinkChange = (value: string) => {
    setLinkError('');
    
    if (value && !isValidUrl(value)) {
      setLinkError('Please enter a valid URL');
    }
  };

  return {
    usernameError,
    linkError,
    hasErrors: !!usernameError || !!linkError,
    handleUsernameChange,
    handleExternalLinkChange
  };
};
