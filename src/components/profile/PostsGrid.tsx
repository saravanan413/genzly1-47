
import React from 'react';
import { Play } from 'lucide-react';

interface PostsGridProps {
  posts: Array<{ type: string; url: string }>;
  onImageClick: (index: number) => void;
  onShareClick: (postId: number) => void;
}

const PostsGrid: React.FC<PostsGridProps> = ({
  posts,
  onImageClick,
  onShareClick
}) => {
  return (
    <div className="grid grid-cols-3 gap-0.5 md:gap-4">
      {posts.map((post, index) => (
        <div 
          key={index} 
          className="aspect-square overflow-hidden cursor-pointer hover:opacity-75 transition-opacity relative group"
          onClick={() => onImageClick(index)}
        >
          <img 
            src={post.url} 
            alt={`Post ${index + 1}`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {post.type === 'video' && (
            <div className="absolute top-2 right-2">
              <Play size={16} className="text-white drop-shadow-lg" fill="white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostsGrid;
