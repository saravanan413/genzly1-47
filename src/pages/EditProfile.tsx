
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import CropImageModal from "@/components/CropImageModal";
import EditProfileHeader from '../components/profile/edit/EditProfileHeader';
import ProfilePhotoSection from '../components/profile/edit/ProfilePhotoSection';
import ProfileFormFields from '../components/profile/edit/ProfileFormFields';
import { useProfileEdit } from '../hooks/useProfileEdit';

const EditProfile = () => {
  const navigate = useNavigate();
  const {
    username,
    name,
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
    hasChanges,
    hasErrors,
    displayAvatar,
    setName,
    setBio,
    handleUsernameChange,
    handleExternalLinkChange,
    handleFileChange,
    handleCropDone,
    handleCropCancel,
    handleRemovePhoto,
    handleSave
  } = useProfileEdit();

  const onSave = async () => {
    const success = await handleSave();
    if (success) {
      navigate('/profile');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Crop Modal */}
      {cropImageData && (
        <CropImageModal
          open={showCrop}
          image={cropImageData}
          aspect={1}
          onCancel={handleCropCancel}
          onCrop={handleCropDone}
        />
      )}

      {/* Header */}
      <EditProfileHeader
        hasChanges={hasChanges}
        saving={saving}
        hasErrors={hasErrors}
        onSave={onSave}
      />

      {/* Content */}
      <div className="p-6 max-w-md mx-auto">
        {/* Profile Photo */}
        <ProfilePhotoSection
          profileImage={profileImage}
          displayAvatar={displayAvatar}
          uploading={uploading}
          onFileChange={handleFileChange}
          onRemovePhoto={handleRemovePhoto}
        />

        {/* Form Fields */}
        <ProfileFormFields
          username={username}
          name={name}
          bio={bio}
          externalLink={externalLink}
          usernameError={usernameError}
          linkError={linkError}
          onUsernameChange={handleUsernameChange}
          onNameChange={setName}
          onBioChange={setBio}
          onExternalLinkChange={handleExternalLinkChange}
        />
      </div>
    </Layout>
  );
};

export default EditProfile;
