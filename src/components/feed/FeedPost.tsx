
import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LazyImage from '../LazyImage';
import CustomHeartIcon from '../CustomHeartIcon';
import HeartAnimation from '../HeartAnimation';
import PostContextMenu from './PostContextMenu';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '../../services/firestoreService';

interface FeedPostProps {
  post: Post;
  onLike: (postId: string) => void;
  onFollow: (userId: string) => void;
  onDoubleClick: (postId: string) => void;
  onCommentClick: (postId: string) => void;
  onShareClick: (postId: string) => void;
}

const FeedPost: React.FC<FeedPostProps> = ({
  post,
  onLike,
  onFollow,
  onDoubleClick,
  onCommentClick,
  onShareClick
}) => {
  const { currentUser } = useAuth();
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const isOwnPost = currentUser?.uid === post.userId;

  const handleDoubleClick = () => {
    if (!isLiked) {
      setShowHeartAnimation(true);
      onLike(post.id);
      setIsLiked(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    onDoubleClick(post.id);
  };

  const handleLikeClick = () => {
    onLike(post.id);
    setIsLiked(!isLiked);
  };

  const timeAgo = post.timestamp ? formatDistanceToNow(new Date(post.timestamp.seconds * 1000), { addSuffix: true }) : 'Just now';

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.userId}`}>
            <img
              src={post.user.avatar || '/placeholder.svg'}
              alt={post.user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          </Link>
          <div className="flex items-center space-x-2">
            <Link to={`/profile/${post.userId}`}>
              <span className="font-semibold text-sm hover:underline">
                {post.user.username}
              </span>
            </Link>
            <span className="text-gray-500 dark:text-gray-400 text-xs">•</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">{timeAgo}</span>
            {!isOwnPost && (
              <>
                <span className="text-gray-500 dark:text-gray-400 text-xs">•</span>
                <button
                  onClick={() => onFollow(post.userId)}
                  className="text-blue-500 hover:text-blue-600 text-xs font-medium"
                >
                  Follow
                </button>
              </>
            )}
          </div>
        </div>
        <PostContextMenu
          postId={post.id}
          postAuthorId={post.userId}
          isOwnPost={isOwnPost}
        >
          <Button variant="ghost" size="sm" className="p-2">
            <MoreHorizontal size={16} />
          </Button>
        </PostContextMenu>
      </div>

      {/* Post Media */}
      <div className="relative" ref={imageRef}>
        <LazyImage
          src={post.mediaURL}
          alt="Post content"
          className="w-full aspect-square object-cover cursor-pointer"
          onDoubleClick={handleDoubleClick}
        />
        {showHeartAnimation && (
          <HeartAnimation
            onDoubleClick={() => {}}
            onComplete={() => setShowHeartAnimation(false)}
          >
            <div />
          </HeartAnimation>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto"
              onClick={handleLikeClick}
            >
              <CustomHeartIcon
                filled={isLiked}
                className="w-6 h-6"
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto"
              onClick={() => onCommentClick(post.id)}
            >
              <MessageCircle size={24} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto"
              onClick={() => onShareClick(post.id)}
            >
              <Share size={24} />
            </Button>
          </div>
        </div>

        {/* Likes count */}
        <div className="text-sm font-semibold mb-1">
          {post.likes} likes
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="text-sm">
            <Link to={`/profile/${post.userId}`} className="font-semibold hover:underline">
              {post.user.username}
            </Link>
            <span className="ml-2">{post.caption}</span>
          </div>
        )}

        {/* View comments */}
        {post.comments > 0 && (
          <button
            onClick={() => onCommentClick(post.id)}
            className="text-sm text-gray-500 dark:text-gray-400 mt-1 hover:underline"
          >
            View all {post.comments} comments
          </button>
        )}
      </div>
    </div>
  );
};

export default FeedPost;
