
import React from 'react';
import { User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ProfileHeaderProps {
  userPosts: Array<{ type: string; url: string }>;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  profile: {
    id: string;
    username: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
    externalLink?: string;
    followers: number;
    following: number;
  } | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userPosts,
  onFollowersClick,
  onFollowingClick,
  profile
}) => {
  if (!profile) return null;

  // Generate default avatar
  const getFallbackAvatar = () => {
    return '/lovable-uploads/07e28f82-bd38-410c-a208-5db174616626.png';
  };

  const avatarUrl = profile.avatar || getFallbackAvatar();

  return (
    <div className="flex flex-col items-center text-center px-4 py-6">
      {/* Settings Icon - Top Right */}
      <div className="w-full flex justify-end mb-4">
        <Link to="/settings">
          <Button variant="ghost" size="sm" className="p-2">
            <Settings size={24} />
          </Button>
        </Link>
      </div>

      {/* Profile Picture */}
      <div className="mb-4">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-primary/20 p-1">
          <img
            src={avatarUrl}
            alt={profile.displayName || profile.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>

      {/* Username */}
      <h1 className="text-xl md:text-2xl font-semibold mb-4">@{profile.username}</h1>

      {/* Edit Profile Button */}
      <div className="mb-6">
        <Link to="/edit-profile">
          <Button variant="outline" className="px-8 py-2 rounded-full">
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="flex justify-center space-x-12 mb-6">
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold">{userPosts.length}</div>
          <div className="text-sm md:text-base text-muted-foreground">Posts</div>
        </div>
        <div className="text-center">
          <div
            className="text-xl md:text-2xl font-bold cursor-pointer hover:underline text-primary"
            onClick={onFollowersClick}
          >
            {profile.followers}
          </div>
          <div className="text-sm md:text-base text-muted-foreground cursor-pointer" onClick={onFollowersClick}>
            Followers
          </div>
        </div>
        <div className="text-center">
          <div
            className="text-xl md:text-2xl font-bold cursor-pointer hover:underline text-primary"
            onClick={onFollowingClick}
          >
            {profile.following}
          </div>
          <div className="text-sm md:text-base text-muted-foreground cursor-pointer" onClick={onFollowingClick}>
            Following
          </div>
        </div>
      </div>

      {/* Name and Bio */}
      <div className="max-w-xs md:max-w-sm">
        <h2 className="font-semibold text-lg mb-2">{profile.displayName || profile.username}</h2>
        {profile.bio ? (
          <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line mb-2">
            {profile.bio}
          </p>
        ) : (
          <p className="text-sm md:text-base text-muted-foreground mb-2">
            Your bio goes here
          </p>
        )}
        {profile.externalLink && (
          <a 
            href={profile.externalLink.startsWith('http') ? profile.externalLink : `https://${profile.externalLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm md:text-base text-primary hover:underline"
          >
            {profile.externalLink}
          </a>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
