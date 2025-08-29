
import { Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Reel } from '../../types/reels';

interface ReelContentProps {
  reel: Reel;
  onFollow: (username: string) => void;
}

const ReelContent = ({ reel, onFollow }: ReelContentProps) => {
  const navigate = useNavigate();

  const handleUsernameClick = () => {
    navigate(`/user/${reel.user.name}`);
  };

  return (
    <div className="absolute bottom-10 left-0 right-16 p-4 z-30">
      <div className="text-white space-y-2">
        <div className="flex items-center space-x-2">
          <span 
            className="font-semibold cursor-pointer hover:underline" 
            onClick={handleUsernameClick}
          >
            @{reel.user.name}
          </span>
          {!reel.user.isFollowing && (
            <button 
              onClick={() => onFollow(reel.user.name)}
              className="text-white font-semibold border border-white px-2 py-1 rounded text-xs"
            >
              Follow
            </button>
          )}
        </div>
        
        <p className="text-sm leading-relaxed">{reel.caption}</p>
        
        <div className="flex items-center space-x-2">
          <Music size={16} className="text-white" />
          <span className="text-sm">{reel.music}</span>
        </div>
      </div>
    </div>
  );
};

export default ReelContent;
