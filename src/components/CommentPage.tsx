
import { useState } from 'react';
import { X, Heart, MessageCircle, Send } from 'lucide-react';

interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  likes: number;
  timestamp: string;
  isLiked: boolean;
}

interface CommentPageProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

const CommentPage = ({ isOpen, onClose, postId }: CommentPageProps) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      user: {
        name: 'john_doe',
        avatar: 'https://via.placeholder.com/32/87CEEB/000000?Text=J'
      },
      text: 'Amazing photo! 😍',
      likes: 12,
      timestamp: '2h',
      isLiked: false
    },
    {
      id: '2',
      user: {
        name: 'jane_smith',
        avatar: 'https://via.placeholder.com/32/FFB6C1/000000?Text=J'
      },
      text: 'Love this! Where was this taken?',
      likes: 8,
      timestamp: '1h',
      isLiked: true
    }
  ]);

  const handleLikeComment = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
        : c
    ));
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        user: {
          name: 'you',
          avatar: 'https://via.placeholder.com/32/DDA0DD/000000?Text=Y'
        },
        text: comment,
        likes: 0,
        timestamp: 'now',
        isLiked: false
      };
      setComments(prev => [newComment, ...prev]);
      setComment('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <img 
                src={comment.user.avatar} 
                alt={comment.user.name}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-sm mr-2">{comment.user.name}</span>
                    <span className="text-sm">{comment.text}</span>
                  </div>
                  <button 
                    onClick={() => handleLikeComment(comment.id)}
                    className="ml-2 p-1"
                  >
                    <Heart 
                      size={12} 
                      className={comment.isLiked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'} 
                    />
                  </button>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                  <span>{comment.timestamp}</span>
                  {comment.likes > 0 && <span>{comment.likes} likes</span>}
                  <button className="text-muted-foreground hover:text-foreground">Reply</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center space-x-3">
            <img 
              src="https://via.placeholder.com/32/DDA0DD/000000?Text=Y"
              alt="Your avatar"
              className="w-8 h-8 rounded-full"
            />
            <input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none placeholder:text-muted-foreground"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
            />
            {comment.trim() && (
              <button 
                onClick={handleSubmitComment}
                className="text-primary font-semibold text-sm"
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

export default CommentPage;
