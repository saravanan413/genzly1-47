
import React, { useState } from 'react';
import { Flag, Share, Copy, Link as LinkIcon } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import ReportModal from '../ReportModal';
import { useToast } from '@/hooks/use-toast';

interface PostContextMenuProps {
  children: React.ReactNode;
  postId: string;
  postAuthorId: string;
  isOwnPost: boolean;
}

const PostContextMenu: React.FC<PostContextMenuProps> = ({
  children,
  postId,
  postAuthorId,
  isOwnPost
}) => {
  const { toast } = useToast();
  const [showReportModal, setShowReportModal] = useState(false);

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl);
    toast({
      title: "Link copied",
      description: "Post link has been copied to clipboard"
    });
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post',
          url: postUrl
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleShare}>
            <Share className="w-4 h-4 mr-2" />
            Share
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy link
          </ContextMenuItem>
          {!isOwnPost && (
            <ContextMenuItem onClick={() => setShowReportModal(true)}>
              <Flag className="w-4 h-4 mr-2" />
              Report
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="post"
        postId={postId}
        postAuthorId={postAuthorId}
      />
    </>
  );
};

export default PostContextMenu;
