
import React, { useState } from 'react';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MediaPreviewProps {
  media: { type: 'image' | 'video', data: string, file: File };
  onBack: () => void;
  onPost: (caption: string) => void;
  onShareToFollowers: () => void;
  loading?: boolean;
  uploadProgress?: number;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ 
  media, 
  onBack, 
  onPost, 
  onShareToFollowers,
  loading = false,
  uploadProgress = 0
}) => {
  const [caption, setCaption] = useState('');

  const handleSubmit = () => {
    onPost(caption);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-lg font-semibold">Share</h1>
        <div className="w-10" />
      </div>

      {/* Media Preview */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Media Display */}
          <div className="mb-4 rounded-lg overflow-hidden bg-muted">
            {media.type === 'image' ? (
              <img 
                src={media.data} 
                alt="Preview" 
                className="w-full h-auto object-cover"
              />
            ) : (
              <video 
                src={media.data} 
                controls 
                className="w-full h-auto object-cover"
              />
            )}
          </div>

          {/* Caption Input */}
          <div className="mb-6">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={`Write a caption for your ${media.type === 'image' ? 'post' : 'reel'}...`}
              className="min-h-[120px] resize-none"
              maxLength={2200}
            />
            <div className="text-right text-sm text-muted-foreground mt-2">
              {caption.length}/2200
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Share to Followers Button */}
            <Button
              onClick={onShareToFollowers}
              disabled={loading}
              className="w-full"
              size="lg"
              variant="outline"
            >
              <Users size={18} className="mr-2" />
              Share to followers
            </Button>
            
            {/* Regular Post/Reel Button */}
            {media.type === 'image' && (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full relative overflow-hidden"
                size="lg"
              >
                {loading && (
                  <div 
                    className="absolute inset-0 bg-white/20 transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(uploadProgress, 5)}%` }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-center w-full">
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2"></div>
                      <span className="font-medium">
                        {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : 'Processing...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Share Post
                    </>
                  )}
                </div>
              </Button>
            )}
            
            {media.type === 'video' && (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full relative overflow-hidden"
                size="lg"
              >
                {loading && (
                  <div 
                    className="absolute inset-0 bg-white/20 transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(uploadProgress, 5)}%` }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-center w-full">
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2"></div>
                      <span className="font-medium">
                        {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : 'Processing...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Share as Reel
                    </>
                  )}
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;
