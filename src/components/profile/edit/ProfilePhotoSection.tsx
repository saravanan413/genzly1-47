
import { Camera, X, Upload } from 'lucide-react';
import { useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';

interface ProfilePhotoSectionProps {
  profileImage: string;
  displayAvatar: string;
  uploading: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
}

const ProfilePhotoSection = ({ 
  profileImage, 
  displayAvatar, 
  uploading, 
  onFileChange, 
  onRemovePhoto 
}: ProfilePhotoSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePhotoClick = () => {
    if (uploading) return;
    console.log('Profile photo clicked, opening file selector');
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files?.length);
    onFileChange(e);
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative mb-4">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border">
          <img
            src={displayAvatar}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log('Image failed to load, using fallback');
              e.currentTarget.src = '/lovable-uploads/07e28f82-bd38-410c-a208-5db174616626.png';
            }}
          />
        </div>
        
        {/* Camera Icon Overlay */}
        <button
          onClick={handleProfilePhotoClick}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background disabled:opacity-50 hover:bg-primary/90 transition-all duration-200 shadow-lg"
          aria-label="Change profile picture"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera size={16} className="text-primary-foreground" />
          )}
        </button>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={handleProfilePhotoClick}
          disabled={uploading}
          variant="outline"
          size="sm"
          className="min-w-32"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} className="mr-2" />
              Change Photo
            </>
          )}
        </Button>
        
        {profileImage && !uploading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemovePhoto}
            className="text-destructive hover:text-destructive/80 text-xs"
          >
            <X size={12} className="mr-1" />
            Remove Photo
          </Button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={uploading}
      />
    </div>
  );
};

export default ProfilePhotoSection;
