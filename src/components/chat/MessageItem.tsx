import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Forward, Copy, Trash2, Flag } from 'lucide-react';
import MessageReactions from './MessageReactions';
import VoiceMessage from './VoiceMessage';
import SharedContentMessage from './SharedContentMessage';

// Local SharedContent interface to match SharedContentMessage expectations
interface LocalSharedContent {
  type: 'post' | 'reel' | 'image' | 'video';
  url?: string;
  image?: string;
  thumbnail?: string;
  caption?: string;
  username?: string;
  avatar?: string;
  name?: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'voice' | 'shared';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  audioDuration?: number;
  seen?: boolean;
  reactions?: { [emoji: string]: number };
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  };
  sharedContent?: LocalSharedContent;
}

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string;
  currentUserId: string;
  onReact?: (messageId: string, emoji: string) => void;
  onForward?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
  onSharedContent?: (content: LocalSharedContent) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwnMessage,
  showAvatar = false,
  senderName,
  senderAvatar,
  currentUserId,
  onReact,
  onForward,
  onReply,
  onDelete,
  onReport,
  onSharedContent
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const getProfilePictureUrl = (avatar?: string): string => {
    if (avatar && avatar.trim() !== '') {
      return avatar;
    }
    return '/lovable-uploads/d349107d-a94b-4c77-9738-6efb4f4d75e5.png';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/lovable-uploads/d349107d-a94b-4c77-9738-6efb4f4d75e5.png';
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
    setShowContextMenu(false);
  };

  const renderMessageContent = () => {
    if (message.type === 'shared' && message.sharedContent) {
      return (
        <SharedContentMessage
          content={message.sharedContent}
          isOwn={isOwnMessage}
          onClick={onSharedContent}
        />
      );
    }

    if (message.type === 'voice' && message.mediaUrl) {
      return (
        <VoiceMessage
          audioUrl={message.mediaUrl}
          duration={message.audioDuration || 0}
          isOwn={isOwnMessage}
        />
      );
    }

    if (message.type === 'image' && message.mediaUrl) {
      return (
        <div className="max-w-xs">
          <img
            src={message.mediaUrl}
            alt="Shared image"
            className="rounded-lg max-w-full h-auto"
            loading="lazy"
          />
          {message.text && (
            <p className="mt-2 text-sm">{message.text}</p>
          )}
        </div>
      );
    }

    if (message.type === 'video' && message.mediaUrl) {
      return (
        <div className="max-w-xs">
          <video
            src={message.mediaUrl}
            controls
            className="rounded-lg max-w-full h-auto"
            preload="metadata"
          />
          {message.text && (
            <p className="mt-2 text-sm">{message.text}</p>
          )}
        </div>
      );
    }

    if (message.type === 'file' && message.mediaUrl) {
      return (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg max-w-xs">
          <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
            <span className="text-xs">📎</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.fileName || 'File'}</p>
            {message.fileSize && (
              <p className="text-xs text-muted-foreground">
                {(message.fileSize / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
        </div>
      );
    }

    return <p className="text-sm">{message.text}</p>;
  };

  return (
    <div className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
      {!isOwnMessage && showAvatar && (
        <img
          src={getProfilePictureUrl(senderAvatar)}
          alt={senderName}
          className="w-8 h-8 rounded-full object-cover mt-1"
          onError={handleImageError}
        />
      )}
      
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwnMessage && showAvatar && senderName && (
          <span className="text-xs text-muted-foreground px-2 mb-1">{senderName}</span>
        )}
        
        {message.replyTo && (
          <div className="mb-1 p-2 bg-muted/30 rounded-t-lg border-l-2 border-primary/50">
            <p className="text-xs text-muted-foreground">{message.replyTo.senderName}</p>
            <p className="text-xs truncate">{message.replyTo.text}</p>
          </div>
        )}

        <div
          className={`px-3 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          } ${message.replyTo ? 'rounded-tl-none' : ''}`}
          onContextMenu={handleContextMenu}
        >
          {renderMessageContent()}
        </div>

        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(message.timestamp, { addSuffix: false })}
          </span>
          
          {isOwnMessage && (
            <div className="ml-1">
              {message.seen ? (
                <CheckCheck size={14} className="text-blue-500" />
              ) : (
                <Check size={14} className="text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <MessageReactions
            messageId={message.id}
            reactions={message.reactions}
            onReact={onReact}
          />
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowContextMenu(false)}
          />
          <div
            className="fixed z-50 bg-background border rounded-lg shadow-lg py-1 min-w-[150px]"
            style={{ left: menuPosition.x, top: menuPosition.y }}
          >
            {onReact && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                onClick={() => {
                  onReact(message.id, '👍');
                  setShowContextMenu(false);
                }}
              >
                👍 React
              </button>
            )}
            
            {onReply && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                onClick={() => {
                  onReply(message);
                  setShowContextMenu(false);
                }}
              >
                ↩️ Reply
              </button>
            )}
            
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              onClick={handleCopyMessage}
            >
              <Copy size={14} />
              Copy
            </button>
            
            {onForward && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                onClick={() => {
                  onForward(message);
                  setShowContextMenu(false);
                }}
              >
                <Forward size={14} />
                Forward
              </button>
            )}
            
            {isOwnMessage && onDelete && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted text-red-600 flex items-center gap-2"
                onClick={() => {
                  onDelete(message.id);
                  setShowContextMenu(false);
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
            
            {!isOwnMessage && onReport && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted text-red-600 flex items-center gap-2"
                onClick={() => {
                  onReport(message.id);
                  setShowContextMenu(false);
                }}
              >
                <Flag size={14} />
                Report
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MessageItem;
