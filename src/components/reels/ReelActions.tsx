import { MessageSquare, Share, Heart, Bookmark, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Reel } from '../../types/reels';
import ShareModal from '../ShareModal';

interface ReelActionsProps {
  reel: Reel;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
  onFollow: (username: string) => void;
  onComment?: (id: number) => void; // Added optional comment handler
}

const ReelActions = ({ reel, onLike, onSave, onFollow, onComment }: ReelActionsProps) => {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = () => setShowShareModal(true);
  const handleCloseShareModal = () => setShowShareModal(false);

  return (
    <>
      <div className="absolute right-4 bottom-32 flex flex-col space-y-6 z-30">
        <div className="flex flex-col items-center">
          <button 
            onClick={() => onLike(reel.id)}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group"
          >
            <Heart 
              size={28} 
              className={`transition-transform duration-200 ease-in-out active:scale-125 ${reel.isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} 
            />
          </button>
          <span className="text-white text-xs mt-1 font-medium">
            {reel.likes > 999 ? `${Math.floor(reel.likes/1000)}k` : reel.likes}
          </span>
        </div>
        {/* Comment Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => onComment?.(reel.id)}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            <MessageSquare size={28} className="text-white" />
          </button>
          <span className="text-white text-xs mt-1 font-medium">{reel.comments}</span>
        </div>

        <div className="flex flex-col items-center">
          <button 
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            <Share size={28} className="text-white" />
          </button>
          <span className="text-white text-xs mt-1 font-medium">{reel.shares}</span>
        </div>

        <div className="flex flex-col items-center">
          <button 
            onClick={() => onSave(reel.id)}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            <Bookmark 
              size={28} 
              className={`text-white transition-transform duration-200 ease-in-out ${reel.isSaved ? 'fill-white' : ''}`} 
            />
          </button>
        </div>

        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <MoreHorizontal size={28} className="text-white" />
        </button>

        <div className="relative">
          <img 
            src={reel.user.avatar} 
            alt={reel.user.name}
            className="w-12 h-12 rounded-full border-2 border-white"
          />
          {!reel.user.isFollowing && (
            <button 
              onClick={() => onFollow(reel.user.name)}
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-sm font-bold">+</span>
            </button>
          )}
        </div>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        postId={reel.id}
      />
    </>
  );
};

export default ReelActions;
