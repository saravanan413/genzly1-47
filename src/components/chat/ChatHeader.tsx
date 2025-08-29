import React from 'react';
import { ArrowLeft, Video, Phone, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OnlineStatus from './OnlineStatus';

interface ChatHeaderUser {
  name: string;
  avatar: string;
}

interface ChatHeaderProps {
  user?: ChatHeaderUser;
  isOnline?: boolean;
  onNewChat?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  isOnline = false,
  onNewChat
}) => {
  const navigate = useNavigate();

  const getProfilePictureUrl = (avatar?: string, username?: string): string => {
    if (avatar && avatar.trim() !== '') {
      return avatar;
    }
    return '/lovable-uploads/d349107d-a94b-4c77-9738-6efb4f4d75e5.png';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/lovable-uploads/d349107d-a94b-4c77-9738-6efb4f4d75e5.png';
  };

  // If no user is provided, show the main chat header
  if (!user) {
    return (
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
          {onNewChat && (
            <button 
              onClick={onNewChat}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              aria-label="New chat"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14m7-7H5"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Individual chat header
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/chat')}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <img
            src={getProfilePictureUrl(user.avatar)}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
            onError={handleImageError}
          />
          
          <div>
            <h2 className="font-semibold">{user.name}</h2>
            <OnlineStatus isOnline={isOnline} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Video size={20} />
          </button>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Phone size={20} />
          </button>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Info size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
