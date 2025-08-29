
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import PostModal from '../components/PostModal';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { Skeleton } from '@/components/ui/skeleton';
import CommentPage from '../components/CommentPage';
import ShareModal from '../components/ShareModal';
import { useFeedPosts } from '../hooks/useFirebaseData';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState<number | null>(null);
  const [selectedPostForShare, setSelectedPostForShare] = useState<number | null>(null);

  const navigate = useNavigate();
  
  // Use real Firebase posts data
  const { posts, loading, hasMore, loadMorePosts } = useFeedPosts();

  const { targetRef } = useIntersectionObserver({
    hasMore,
    loading,
    onLoadMore: loadMorePosts,
    threshold: 0.5,
    rootMargin: '200px'
  });

  const handleSearch = (query: string) => setSearchQuery(query);
  const handleUserSelect = (userId: string) => navigate(`/user/${userId}`);

  const handleImageClick = (index: number) => {
    setSelectedPostIndex(index);
  };

  const handleCloseModal = () => setSelectedPostIndex(null);

  const handleCommentClick = (postId: number) => setSelectedPostForComments(postId);
  const handleShareClick = (postId: number) => setSelectedPostForShare(postId);

  const handleModalNavigate = (direction: 'prev' | 'next') => {
    if (selectedPostIndex === null) return;
    if (direction === 'prev' && selectedPostIndex > 0) {
      setSelectedPostIndex(selectedPostIndex - 1);
    }
    if (
      direction === 'next' &&
      selectedPostIndex < posts.length - 1
    ) {
      setSelectedPostIndex(selectedPostIndex + 1);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 pb-20 md:pb-6 w-full">
        <div className="w-full">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search profiles..."
            onUserSelect={handleUserSelect}
          />
          
          {posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5 md:gap-4 w-full">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="aspect-square overflow-hidden cursor-pointer hover:opacity-75 transition-all duration-300 hover:scale-[1.02] relative group w-full animate-fade-in"
                  onClick={() => handleImageClick(index)}
                >
                  <img
                    src={post.mediaURL}
                    alt={`Post by ${post.user.username}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {post.mediaType === 'video' && (
                    <div className="absolute top-2 right-2">
                      <Play size={16} className="text-white drop-shadow-lg" fill="white" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading skeletons */}
              {loading && (
                <>
                  {Array.from({ length: 9 }).map((_, index) => (
                    <Skeleton key={`skeleton-${index}`} className="aspect-square w-full" />
                  ))}
                </>
              )}
            </div>
          ) : !loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
              <p className="text-gray-500 text-center">When people share posts, they'll appear here to explore.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 md:gap-4 w-full">
              {Array.from({ length: 15 }).map((_, index) => (
                <Skeleton key={`skeleton-${index}`} className="aspect-square w-full" />
              ))}
            </div>
          )}
          
          {/* Intersection observer target */}
          {hasMore && posts.length > 0 && (
            <div ref={targetRef} className="h-20 flex items-center justify-center">
              {loading && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              )}
            </div>
          )}
          
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground dark:text-muted-foreground">You've explored everything!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Post Modal */}
      {selectedPostIndex !== null && posts.length > 0 && (
        <PostModal
          isOpen={selectedPostIndex !== null}
          onClose={handleCloseModal}
          posts={posts.map(post => ({
            id: parseInt(post.id),
            url: post.mediaURL,
            type: post.mediaType,
            user: {
              name: post.user.username,
              avatar: post.user.avatar || '/placeholder.svg'
            }
          }))}
          currentPostIndex={selectedPostIndex}
          onNavigatePost={handleModalNavigate}
          postId={parseInt(posts[selectedPostIndex].id)}
          imageUrl={posts[selectedPostIndex].mediaURL}
          user={{
            name: posts[selectedPostIndex].user.username,
            avatar: posts[selectedPostIndex].user.avatar || '/placeholder.svg'
          }}
          onOpenComments={() => handleCommentClick(parseInt(posts[selectedPostIndex].id))}
          onOpenShare={() => handleShareClick(parseInt(posts[selectedPostIndex].id))}
        />
      )}
      
      {/* Comment Page */}
      <CommentPage
        isOpen={selectedPostForComments !== null}
        onClose={() => setSelectedPostForComments(null)}
        postId={(selectedPostForComments || '').toString()}
      />
      
      {/* Share Modal */}
      <ShareModal
        isOpen={selectedPostForShare !== null}
        onClose={() => setSelectedPostForShare(null)}
        postId={selectedPostForShare || undefined}
      />
    </Layout>
  );
};

export default Explore;
