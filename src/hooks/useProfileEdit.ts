
import { useProfileData } from './profile/useProfileData';
import { useProfileValidation } from './profile/useProfileValidation';
import { useProfilePhotoHandlers } from './profile/useProfilePhotoHandlers';
import { useProfileSave } from './profile/useProfileSave';

export const useProfileEdit = () => {
  // Profile data management
  const {
    username,
    displayName,
    bio,
    externalLink,
    profileImage,
    originalData,
    loading,
    setUsername,
    setDisplayName,
    setBio,
    setExternalLink,
    setProfileImage,
    updateOriginalData,
    hasChanges,
    displayAvatar
  } = useProfileData();

  // Validation
  const {
    usernameError,
    linkError,
    hasErrors,
    handleUsernameChange: validateUsername,
    handleExternalLinkChange: validateExternalLink
  } = useProfileValidation(originalData.username);

  // Photo handling
  const {
    uploading,
    uploadProgress,
    showCrop,
    cropImageData,
    handleFileChange,
    handleCropDone: cropDone,
    handleCropCancel,
    handleRemovePhoto: removePhoto,
    hasPendingUpload,
    commitUpload
  } = useProfilePhotoHandlers();

  // Save functionality
  const {
    saving,
    handleSave: saveProfile
  } = useProfileSave();

  // Enhanced handlers that combine validation with state updates
  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    await validateUsername(value);
  };

  const handleExternalLinkChange = (value: string) => {
    setExternalLink(value);
    validateExternalLink(value);
  };

  const handleCropDone = async (croppedImage: string) => {
    await cropDone(croppedImage, setProfileImage);
  };

  const handleRemovePhoto = async () => {
    await removePhoto(setProfileImage);
  };

  const handleSave = async () => {
    // If there's a pending profile photo, upload it now and use the final URL
    let finalImage = profileImage;
    if (hasPendingUpload) {
      const url = await commitUpload(setProfileImage);
      if (!url) return false; // upload failed; toast already shown
      finalImage = url;
    }

    const success = await saveProfile({
      username,
      displayName,
      bio,
      externalLink,
      profileImage: finalImage
    }, hasErrors);
    
    if (success) {
      updateOriginalData({
        username: username.trim(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        externalLink: externalLink.trim(),
        profileImage: finalImage
      });
    }
    
    return success;
  };

  return {
    // State
    username,
    name: displayName,
    bio,
    externalLink,
    profileImage,
    loading,
    saving,
    uploading,
    usernameError,
    linkError,
    showCrop,
    cropImageData,
    
    // Computed
    hasChanges,
    hasErrors,
    displayAvatar,
    
    // Handlers
    setName: setDisplayName,
    setBio,
    handleUsernameChange,
    handleExternalLinkChange,
    handleFileChange,
    handleCropDone,
    handleCropCancel,
    handleRemovePhoto,
    handleSave
  };
};
