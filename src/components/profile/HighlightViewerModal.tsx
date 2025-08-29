
import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import InstagramStoryModal from '../InstagramStoryModal';
import { Highlight, deleteHighlight } from '../../services/highlightsService';
import { useYourStories } from '../../hooks/useYourStories';
import { useToast } from '@/hooks/use-toast';

interface HighlightViewerModalProps {
  isOpen: boolean;
  highlight: Highlight;
  onClose: () => void;
  onHighlightDeleted: (highlightId: string) => void;
  canDelete: boolean;
}

const HighlightViewerModal: React.FC<HighlightViewerModalProps> = ({
  isOpen,
  highlight,
  onClose,
  onHighlightDeleted,
  canDelete
}) => {
  const { yourStories } = useYourStories();
  const { toast } = useToast();
  
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [stories, setStories] = useState<any[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (highlight && yourStories.length > 0) {
      const highlightStories = highlight.stories
        .map(storyId => yourStories.find(story => story.id.toString() === storyId))
        .filter(Boolean)
        .map(story => ({
          id: story!.id,
          image: story!.image,
          timestamp: story!.timestamp,
          createdAt: story!.createdAt
        }));
      
      setStories(highlightStories);
    }
  }, [highlight, yourStories]);

  const handlePlayStories = (startIndex = 0) => {
    setCurrentStoryIndex(startIndex);
    setShowStoryModal(true);
  };

  const handleDeleteHighlight = async () => {
    if (!canDelete) return;
    
    setDeleting(true);
    try {
      const success = await deleteHighlight(highlight.id);
      if (success) {
        onHighlightDeleted(highlight.id);
        toast({
          title: "Success",
          description: "Highlight deleted successfully"
        });
      } else {
        throw new Error('Failed to delete highlight');
      }
    } catch (error) {
      console.error('Error deleting highlight:', error);
      toast({
        title: "Error",
        description: "Failed to delete highlight",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full mx-4 max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">{highlight.name}</h2>
            <div className="flex items-center gap-2">
              {canDelete && (
                <button
                  onClick={handleDeleteHighlight}
                  disabled={deleting}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500"
                  title="Delete highlight"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4">
            {stories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No stories in this highlight</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stories.length} {stories.length === 1 ? 'story' : 'stories'}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handlePlayStories(0)}
                  >
                    Play All
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {stories.map((story, index) => (
                    <div
                      key={story.id}
                      className="aspect-square cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:ring-2 hover:ring-blue-500 transition-all"
                      onClick={() => handlePlayStories(index)}
                    >
                      <img
                        src={story.image}
                        alt={`Story ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Story Modal */}
      {showStoryModal && stories.length > 0 && (
        <InstagramStoryModal
          isOpen={showStoryModal}
          onClose={() => setShowStoryModal(false)}
          user={{ name: highlight.name, avatar: highlight.coverImage }}
          stories={stories}
          initialIndex={currentStoryIndex}
          onIndexChange={setCurrentStoryIndex}
        />
      )}
    </>
  );
};

export default HighlightViewerModal;
