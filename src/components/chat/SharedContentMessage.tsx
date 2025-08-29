
import React from 'react';
import { Image, Video, Play } from 'lucide-react';

interface SharedContent {
  type: 'post' | 'reel' | 'image' | 'video';
  url?: string;
  image?: string;
  thumbnail?: string;
  caption?: string;
  username?: string;
  avatar?: string;
  name?: string;
}

interface SharedContentMessageProps {
  content: SharedContent;
  isOwn: boolean;
  onClick?: (content: SharedContent) => void;
}

const SharedContentMessage: React.FC<SharedContentMessageProps> = ({
  content,
  isOwn,
  onClick
}) => {
  const getDisplayImage = () => {
    return content.thumbnail || content.image || content.url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop';
  };

  const isVideo = content.type === 'reel' || content.type === 'video';

  return (
    <div
      className={`relative max-w-[280px] rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:scale-[1.02] transition-transform ${
        isOwn ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'
      }`}
      onClick={() => onClick?.(content)}
    >
      {/* Content Preview */}
      <div className="relative aspect-[4/5] bg-black">
        <img
          src={getDisplayImage()}
          alt="Shared content"
          className="w-full h-full object-cover"
        />
        
        {/* Play button for videos */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 rounded-full p-3">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
        )}
        
        {/* Content type indicator */}
        <div className="absolute top-2 right-2">
          <div className="bg-black/60 rounded-full p-1.5">
            {isVideo ? (
              <Video className="w-4 h-4 text-white" />
            ) : (
              <Image className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      </div>
      
      {/* Caption/Info */}
      {(content.caption || content.username) && (
        <div className={`p-3 ${isOwn ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
          {content.username && (
            <div className="flex items-center space-x-2 mb-1">
              {content.avatar && (
                <img
                  src={content.avatar}
                  alt={content.username}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="font-semibold text-sm">{content.username}</span>
            </div>
          )}
          {content.caption && (
            <p className="text-sm line-clamp-2">{content.caption}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SharedContentMessage;
