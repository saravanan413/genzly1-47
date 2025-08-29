
import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface ShareEditModalContent {
  type: 'post' | 'reel' | 'profile' | 'image' | 'video';
  url?: string;
  caption?: string;
}

interface ShareEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ShareEditModalContent;
  onShare: (editedContent: ShareEditModalContent) => void;
}

const ShareEditModal: React.FC<ShareEditModalProps> = ({
  isOpen,
  onClose,
  content,
  onShare
}) => {
  const [caption, setCaption] = useState(content.caption || '');
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    setIsSharing(true);
    await onShare({
      ...content,
      caption: caption.trim()
    });
    setIsSharing(false);
    onClose();
  };

  const isMediaContent = content.type === 'post' || content.type === 'reel';
  const displayUrl = content.url || '';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share {content.type}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content Preview */}
        {isMediaContent && displayUrl && (
          <div className="p-4">
            <div className="aspect-square rounded-lg overflow-hidden mb-4">
              {content.type === 'reel' ? (
                <video
                  src={displayUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <img
                  src={displayUrl}
                  alt="Content preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Caption Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Add a caption (optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Write a caption for this ${content.type}...`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={280}
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                {caption.length}/280
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {isSharing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Send size={16} />
                <span>Share in Chat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareEditModal;
