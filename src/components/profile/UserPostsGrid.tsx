
import React from 'react';
import { Play, MessageSquare, Share } from 'lucide-react';
import { Post } from '../../services/firestoreService';

interface UserPostsGridProps {
  posts: Post[];
  loading: boolean;
  isOwnProfile: boolean;
  onImageClick: (index: number) => void;
  onCommentClick: (postId: number) => void;
  onShareClick: () => void;
}

const UserPostsGrid: React.FC<UserPostsGridProps> = ({
  posts,
  loading,
  isOwnProfile,
  onImageClick,
  onCommentClick,
  onShareClick
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5 md:gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="aspect-square bg-gray-200 animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">📷</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
        <p className="text-gray-500 text-center">
          {isOwnProfile ? "When you share posts, they'll appear here." : "This user hasn't shared any posts yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 md:gap-4">
      {posts.map((post, index) => (
        <div 
          key={post.id} 
          className="aspect-square overflow-hidden cursor-pointer hover:opacity-75 transition-opacity relative group"
          onClick={() => onImageClick(index)}
        >
          <img 
            src={post.mediaURL} 
            alt={`Post ${index + 1}`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {post.mediaType === 'video' && (
            <div className="absolute top-2 right-2">
              <Play size={16} className="text-white drop-shadow-lg" fill="white" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              className="bg-black/60 rounded-full p-1 hover:bg-black/90"
              type="button"
              onClick={e => {
                e.stopPropagation();
                onCommentClick(parseInt(post.id));
              }}
            >
              <MessageSquare className="text-white" size={18} />
            </button>
            <button
              className="bg-black/60 rounded-full p-1 hover:bg-black/90"
              type="button"
              onClick={e => {
                e.stopPropagation();
                onShareClick();
              }}
            >
              <Share className="text-white" size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserPostsGrid;
