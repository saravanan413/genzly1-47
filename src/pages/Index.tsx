
import { useState } from 'react';
import Layout from '../components/Layout';
import StoriesBar from '../components/StoriesBar';
import CommentPage from '../components/CommentPage';
import ShareModal from '../components/ShareModal';
import FeedPost from '../components/feed/FeedPost';
import FeedLoadingSkeletons from '../components/feed/FeedLoadingSkeletons';
import PullToRefresh from '../components/feed/PullToRefresh';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useFeedData } from '../hooks/useFeedData';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { Post } from '../types/index';

const Index = () => {
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null);
  const [selectedPostForShare, setSelectedPostForShare] = useState<string | null>(null);

  const {
    posts,
    loading,
    hasMore,
    loadMorePosts,
    handleRefresh,
    handleLike,
    handleFollow,
    handleDoubleClick
  } = useFeedData();

  const {
    containerRef,
    refreshing,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = usePullToRefresh(handleRefresh);

  const { targetRef } = useIntersectionObserver({
    hasMore,
    loading,
    onLoadMore: loadMorePosts
  });

  const handleCommentClick = (postId: string) => {
    setSelectedPostForComments(postId);
  };

  const handleShareClick = (postId: string) => {
    setSelectedPostForShare(postId);
  };

  // Convert Post to the format expected by FeedPost component
  const convertPostForFeedPost = (post: Post) => {
    return {
      ...post,
      likes: post.likeCount || 0 // Convert likes array to count for FeedPost component
    };
  };

  return (
    <Layout>
      <div 
        ref={containerRef}
        className="w-full overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        <PullToRefresh pullDistance={pullDistance} refreshing={refreshing} />

        <StoriesBar />

        <div className="w-full">
          <div className="container mx-auto max-w-2xl px-4 md:px-6">
            <div className="space-y-8">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <FeedPost
                    key={post.id}
                    post={convertPostForFeedPost(post) as any}
                    onLike={handleLike}
                    onFollow={handleFollow}
                    onDoubleClick={handleDoubleClick}
                    onCommentClick={handleCommentClick}
                    onShareClick={handleShareClick}
                  />
                ))
              ) : !loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">📱</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                  <p className="text-gray-500 text-center">When people share posts, they'll appear here in your feed.</p>
                </div>
              ) : null}

              {/* Intersection Observer Target */}
              {hasMore && posts.length > 0 && (
                <div ref={targetRef} className="h-10 flex items-center justify-center">
                  {loading && (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              )}

              {/* Loading skeleton */}
              {loading && posts.length === 0 && <FeedLoadingSkeletons />}

              {!hasMore && posts.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground dark:text-muted-foreground">You've reached the end!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Page */}
      <CommentPage 
        isOpen={selectedPostForComments !== null}
        onClose={() => setSelectedPostForComments(null)}
        postId={selectedPostForComments || ''}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={selectedPostForShare !== null}
        onClose={() => setSelectedPostForShare(null)}
        postId={parseInt(selectedPostForShare || '0')}
      />
    </Layout>
  );
};

export default Index;
