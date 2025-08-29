
import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfileFormFieldsProps {
  username: string;
  name: string;
  bio: string;
  externalLink: string;
  usernameError: string;
  linkError: string;
  onUsernameChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onExternalLinkChange: (value: string) => void;
}

const ProfileFormFields = ({
  username,
  name,
  bio,
  externalLink,
  usernameError,
  linkError,
  onUsernameChange,
  onNameChange,
  onBioChange,
  onExternalLinkChange
}: ProfileFormFieldsProps) => {
  return (
    <div className="space-y-6">
      {/* Username */}
      <div>
        <Label htmlFor="username" className="text-sm font-medium mb-2 block">
          Username
        </Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="Enter username"
          className={usernameError ? 'border-destructive' : ''}
        />
        {usernameError && (
          <Alert className="mt-2" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{usernameError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Name */}
      <div>
        <Label htmlFor="name" className="text-sm font-medium mb-2 block">
          Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      {/* Bio */}
      <div>
        <Label htmlFor="bio" className="text-sm font-medium mb-2 block">
          Bio
        </Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Write a bio..."
          className="min-h-[80px] resize-none"
          maxLength={150}
        />
        <div className="text-xs text-muted-foreground mt-1">
          {bio.length}/150
        </div>
      </div>

      {/* External Link */}
      <div>
        <Label htmlFor="link" className="text-sm font-medium mb-2 block">
          Link
        </Label>
        <Input
          id="link"
          value={externalLink}
          onChange={(e) => onExternalLinkChange(e.target.value)}
          placeholder="Add link (optional)"
          className={linkError ? 'border-destructive' : ''}
        />
        {linkError && (
          <Alert className="mt-2" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{linkError}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default ProfileFormFields;
