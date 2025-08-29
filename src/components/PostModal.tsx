
import { useState, useRef, useEffect } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  VolumeX,
  Volume2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  videoUrl?: string;
  postId: number;
  user?: {
    name: string;
    avatar: string;
  };
  posts?: Array<{
    id: number;
    url: string;
    user?: { name: string; avatar: string };
    type?: string;
  }>;
  currentPostIndex?: number;
  onNavigatePost?: (direction: 'prev' | 'next') => void;
  onOpenComments?: () => void;
  onOpenShare?: () => void;
}

const TRANSITION_DURATION = 800;
const WHATSAPP_BEZIER = 'cubic-bezier(0.22, 1, 0.36, 1)';
const ROLL_ANGLE = 45;

const PostModal = ({
  isOpen,
  onClose,
  imageUrl,
  videoUrl,
  postId,
  user,
  posts,
  currentPostIndex,
  onNavigatePost,
  onOpenComments,
  onOpenShare,
}: PostModalProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [comment, setComment] = useState('');
  const [scale, setScale] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slideAnimating, setSlideAnimating] = useState(false);
  const [slideTo, setSlideTo] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideInFrom, setSlideInFrom] = useState<null | 'left' | 'right'>(null);
  const [prevPostIndex, setPrevPostIndex] = useState<number | null>(null);

  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Only for zoom using double tap/click
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    resetZoom();
  }, [currentPostIndex]);

  // Keyboard navigation 
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!posts || typeof currentPostIndex !== 'number' || !onNavigatePost) return;
      if (isSliding) return;
      if (e.key === 'ArrowLeft') {
        triggerSlide('prev');
      }
      if (e.key === 'ArrowRight') {
        triggerSlide('next');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, posts, currentPostIndex, onNavigatePost, isSliding]);

  const triggerSlide = (direction: 'prev' | 'next') => {
    if (!onNavigatePost || isSliding) return;
    setIsSliding(true);
    setIsAnimating(true);
    setPrevPostIndex(currentPostIndex ?? null);

    setSlideInFrom(direction === 'next' ? 'right' : 'left');
    setSlideOffset(direction === 'next' ? -window.innerWidth : window.innerWidth);

    setTimeout(() => {
      setIsSliding(false);
      setSlideOffset(0);
      setSlideTo(null);
      setSlideDirection(null);
      setSlideInFrom(null);
      setPrevPostIndex(null);
      setIsAnimating(false);
      onNavigatePost(direction);
    }, TRANSITION_DURATION);
  };

  // --- Drag/swipe logic for slide transition ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartX;
    setDragCurrentX(e.clientX);
    setSlideOffset(delta);
  };
  const handleMouseUp = () => {
    if (!isDragging || isSliding) {
      setIsDragging(false);
      setSlideOffset(0);
      return;
    }
    const diff = dragCurrentX - dragStartX;
    const threshold = window.innerWidth * 0.15;
    if (Math.abs(diff) > threshold && onNavigatePost) {
      onNavigatePost(diff > 0 ? 'prev' : 'next');
      setSlideOffset(0);
    } else {
      setSlideOffset(0);
    }
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragCurrentX(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - dragStartX;
    setDragCurrentX(e.touches[0].clientX);
    setSlideOffset(delta);
  };
  const handleTouchEnd = () => {
    if (!isDragging || isSliding) {
      setIsDragging(false);
      setSlideOffset(0);
      return;
    }
    const diff = dragCurrentX - dragStartX;
    const threshold = window.innerWidth * 0.15;
    if (Math.abs(diff) > threshold && onNavigatePost) {
      onNavigatePost(diff > 0 ? 'prev' : 'next');
      setSlideOffset(0);
    } else {
      setSlideOffset(0);
    }
    setIsDragging(false);
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  const resetZoom = () => {
    setScale(1);
    setPositionX(0);
    setPositionY(0);
    setIsZooming(false);
  };

  if (!isOpen) return null;

  // Helpers to get the post info
  let postToShow: any = {};
  if (posts && typeof currentPostIndex === 'number' && posts[currentPostIndex]) {
    postToShow = posts[currentPostIndex];
  } else {
    postToShow = { id: postId, url: imageUrl, type: videoUrl ? 'video' : 'image' };
    if (videoUrl) postToShow.videoUrl = videoUrl;
  }

  let prevPost: any = null;
  if (
    isAnimating &&
    prevPostIndex !== null &&
    posts &&
    typeof prevPostIndex === 'number' &&
    posts[prevPostIndex]
  ) {
    prevPost = posts[prevPostIndex];
  }
  const mockUser = user || {
    name: 'john_doe',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
  };

  const getOutgoingTransform = () => {
    if (!isAnimating || !slideInFrom) return 'translateX(0) rotateY(0deg)';
    if (slideInFrom === 'right') {
      return `translateX(-120vw) rotateY(-${ROLL_ANGLE}deg)`;
    } else {
      return `translateX(120vw) rotateY(${ROLL_ANGLE}deg)`;
    }
  };
  const getIncomingTransform = () => 'translateX(0) rotateY(0deg)';
  const getInitialIncomingTransform = () => {
    if (!isAnimating || !slideInFrom) return 'translateX(0) rotateY(0deg)';
    if (slideInFrom === 'right') {
      return `translateX(120vw) rotateY(${ROLL_ANGLE}deg)`;
    } else {
      return `translateX(-120vw) rotateY(-${ROLL_ANGLE}deg)`;
    }
  };

  const mockComments = [
    { id: 1, user: 'jane_smith', text: 'Amazing shot! 📸', time: '2h' },
    { id: 2, user: 'mike_photo', text: 'Love the composition', time: '1h' },
    { id: 3, user: 'sarah_art', text: '🔥🔥🔥', time: '30m' }
  ];

  const handleUserClick = () => {
    navigate(`/user/${mockUser.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex w-full h-full">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 p-2 text-white hover:bg-white/10 rounded-full"
      >
        <X size={24} />
      </button>

      {/* Slide Animation With Both Outgoing and Incoming Posts */}
      <div
        className="flex-1 flex items-center justify-center bg-black overflow-hidden"
        style={{
          perspective: 1400,
          perspectiveOrigin: '50% 50%',
          touchAction: 'pan-x',
          width: '100%',
          minWidth: 0,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleTap}
      >
        {/* Outgoing post (roll out) */}
        {isAnimating && prevPost && (
          <div
            className="absolute w-full h-full flex items-center justify-center pointer-events-none"
            style={{
              zIndex: 1,
              width: '100%',
              height: '100%',
              transition: `transform ${TRANSITION_DURATION}ms ${WHATSAPP_BEZIER}`,
              transform: getOutgoingTransform(),
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d',
            }}
          >
            {prevPost.type === 'video' && prevPost.videoUrl ? (
              <video
                src={prevPost.videoUrl}
                className="w-full h-auto max-h-full object-contain select-none"
                autoPlay
                loop
                playsInline
                muted
                style={{
                  width: '100%',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <img
                src={prevPost.url}
                alt={`Post ${prevPost.id}`}
                className="w-full h-auto max-h-full object-contain select-none"
                draggable={false}
                style={{
                  width: '100%',
                  objectFit: 'contain'
                }}
              />
            )}
          </div>
        )}
        {/* Incoming post (main post, animates in) */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            width: '100%',
            height: '100%',
            transition: isAnimating && slideInFrom
              ? `transform ${TRANSITION_DURATION}ms ${WHATSAPP_BEZIER}`
              : isDragging
                ? 'none'
                : `transform 320ms cubic-bezier(.66,0,.33,1)`,
            transform: isDragging
              ? `translateX(${slideOffset}px) scale(${scale})`
              : isAnimating && slideInFrom
                ? getInitialIncomingTransform()
                : `translateX(0) scale(${scale})`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
            perspective: 1400,
          }}
        >
          {isAnimating && slideInFrom && (
            <style>
              {`
                .slide-enter-active {
                  transform: ${getIncomingTransform()};
                  transition: transform ${TRANSITION_DURATION}ms ${WHATSAPP_BEZIER};
                  will-change: transform;
                }
              `}
            </style>
          )}
          {postToShow.type === 'video' && postToShow.videoUrl ? (
            <video
              ref={videoRef}
              src={postToShow.videoUrl}
              className="w-full h-auto max-h-full object-contain select-none"
              autoPlay
              loop
              playsInline
              muted={isMuted}
              style={{
                width: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <img
              src={postToShow.url}
              alt={`Post ${postToShow.id}`}
              className="w-full h-auto max-h-full object-contain select-none"
              draggable={false}
              style={{
                width: '100%',
                objectFit: 'contain'
              }}
            />
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm md:relative md:w-96 md:bg-background dark:md:bg-background md:backdrop-blur-none flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 md:border-border dark:md:border-border">
          <div className="flex items-center space-x-3" onClick={handleUserClick}>
            <img
              src={mockUser.avatar}
              alt={mockUser.name}
              className="w-8 h-8 rounded-full cursor-pointer"
            />
            <span className="font-semibold text-white md:text-foreground dark:md:text-foreground cursor-pointer hover:underline">
              {mockUser.name}
            </span>
          </div>
          <button className="p-1 hover:bg-white/10 md:hover:bg-muted dark:md:hover:bg-muted rounded-full">
            <MoreHorizontal size={20} className="text-white md:text-foreground dark:md:text-foreground" />
          </button>
        </div>

        {/* Comments */}
        <div className="hidden md:flex flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex space-x-3">
            <img
              src={mockUser.avatar}
              alt={mockUser.name}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div>
              <span className="font-semibold text-foreground dark:text-foreground">{mockUser.name}</span>
              <span className="ml-2 text-muted-foreground dark:text-muted-foreground">Beautiful sunset capture! The colors are incredible.</span>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">3h</p>
            </div>
          </div>

          {mockComments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-muted dark:bg-muted flex-shrink-0"></div>
              <div>
                <span className="font-semibold text-foreground dark:text-foreground">{comment.user}</span>
                <span className="ml-2 text-muted-foreground dark:text-muted-foreground">{comment.text}</span>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">{comment.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/20 md:border-border dark:md:border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="hover:scale-110 transition-transform"
              >
                <Heart
                  size={24}
                  className={isLiked ? 'text-red-500 fill-red-500' : 'text-white md:text-foreground dark:md:text-foreground'}
                />
              </button>
              <button
                className="hover:scale-110 transition-transform"
                onClick={onOpenComments}
                type="button"
              >
                <MessageCircle size={24} className="text-white md:text-foreground dark:md:text-foreground" />
              </button>
              <button
                className="hover:scale-110 transition-transform"
                onClick={onOpenShare}
                type="button"
              >
                <Send size={24} className="text-white md:text-foreground dark:md:text-foreground" />
              </button>
            </div>
            <button
              onClick={() => setIsSaved(!isSaved)}
              className="hover:scale-110 transition-transform"
            >
              <Bookmark
                size={24}
                className={isSaved ? 'text-white md:text-foreground dark:md:text-foreground fill-current' : 'text-white md:text-foreground dark:md:text-foreground'}
              />
            </button>
          </div>

          <p className="font-semibold text-sm mb-2 text-white md:text-foreground dark:md:text-foreground">1,234 likes</p>
          <p className="text-xs text-white/70 md:text-muted-foreground dark:md:text-muted-foreground mb-3">2 HOURS AGO</p>

          {/* Add Comment */}
          <div className="flex items-center space-x-3 border-t border-white/20 md:border-border dark:md:border-border pt-3">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm focus:outline-none bg-transparent text-white md:text-foreground dark:md:text-foreground placeholder:text-white/70 md:placeholder:text-muted-foreground dark:md:placeholder:text-muted-foreground"
            />
            {comment.trim() && (
              <button
                onClick={() => setComment('')}
                className="text-blue-400 md:text-primary dark:md:text-primary font-semibold text-sm"
              >
                Post
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
