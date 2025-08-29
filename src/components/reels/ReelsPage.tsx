
import { useState } from 'react';
import { useReelsScroll } from '../../hooks/useReelsScroll';
import { useReelsData } from '../../hooks/useReelsData';
import ReelItem from './ReelItem';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import ReelActions from './ReelActions';
import ReelContent from './ReelContent';
import CommentPage from '../CommentPage';
import Layout from '../Layout';

const ReelsPage = () => {
  const { currentIndex, containerRef } = useReelsScroll();
  const { reels, loading, hasMore, loadMoreReels, handleLike, handleSave, handleFollow } = useReelsData();
  const [selectedPostForComments, setSelectedPostForComments] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleDoubleTap = (reelId: number) => {
    handleLike(reelId.toString());
  };

  const handleReelCommentClick = (reelId: number) => {
    setSelectedPostForComments(reelId);
  };

  if (loading && reels.length === 0) {
    return (
      <Layout>
        <div className="fixed inset-0 bg-black w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="w-16 h-16 rounded-full bg-white/20" />
            <Skeleton className="w-32 h-4 bg-white/20" />
            <Skeleton className="w-24 h-4 bg-white/20" />
          </div>
        </div>
      </Layout>
    );
  }

  if (reels.length === 0 && !loading) {
    return (
      <Layout>
        <div className="fixed inset-0 bg-black w-full h-full">
          {/* Header */}
          <div className="fixed top-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 pt-8 sm:pt-12">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-white text-lg font-semibold">Reels</h1>
              <button className="p-2 text-white rounded-full hover:bg-white/10 transition-colors">
                <MoreHorizontal size={24} />
              </button>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center h-full text-white">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🎬</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">No reels yet</h3>
            <p className="text-gray-400 text-center">When people share reels, they'll appear here.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="fixed inset-0 bg-black w-full h-full">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4 pt-8 sm:pt-12">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-white text-lg font-semibold">Reels</h1>
            <button className="p-2 text-white rounded-full hover:bg-white/10 transition-colors">
              <MoreHorizontal size={24} />
            </button>
          </div>
        </div>

        {/* Reels Container */}
        <div 
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory w-full"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none'
          }}
        >
          <style>
            {`
              div::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          
          {reels.map((reel, index) => (
            <div key={reel.id} className="relative h-screen w-full snap-start snap-always bg-black">
              <ReelItem
                reel={reel}
                isActive={index === currentIndex}
                onDoubleTap={() => handleDoubleTap(reel.id)}
              />
              <ReelActions
                reel={reel}
                onLike={(id) => handleLike(id.toString())}
                onSave={(id) => handleSave(id.toString())}
                onFollow={(name) => handleFollow(name)}
                onComment={handleReelCommentClick}
              />
              <ReelContent
                reel={reel}
                onFollow={(name) => handleFollow(name)}
              />
            </div>
          ))}
          
          {loading && hasMore && (
            <div className="h-screen w-full snap-start snap-always flex items-center justify-center bg-black">
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="w-16 h-16 rounded-full bg-white/20" />
                <Skeleton className="w-32 h-4 bg-white/20" />
                <Skeleton className="w-24 h-4 bg-white/20" />
              </div>
            </div>
          )}

          {!hasMore && reels.length > 0 && (
            <div className="h-screen w-full snap-start snap-always flex items-center justify-center bg-black">
              <p className="text-white text-center">You've reached the end!</p>
            </div>
          )}
        </div>

        {/* Comment Page */}
        <CommentPage
          isOpen={selectedPostForComments !== null}
          onClose={() => setSelectedPostForComments(null)}
          postId={(selectedPostForComments || '').toString()}
        />
      </div>
    </Layout>
  );
};

export default ReelsPage;
