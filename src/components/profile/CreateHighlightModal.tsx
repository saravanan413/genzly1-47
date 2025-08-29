
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { useYourStories } from '../../hooks/useYourStories';
import { createHighlight, Highlight } from '../../services/highlightsService';
import { useToast } from '@/hooks/use-toast';

interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHighlightCreated: (highlight: Highlight) => void;
}

const CreateHighlightModal: React.FC<CreateHighlightModalProps> = ({
  isOpen,
  onClose,
  onHighlightCreated
}) => {
  const { currentUser } = useAuth();
  const { yourStories } = useYourStories();
  const { toast } = useToast();
  
  const [highlightName, setHighlightName] = useState('');
  const [selectedStories, setSelectedStories] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);

  const handleStorySelect = (storyId: number) => {
    setSelectedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const handleCreate = async () => {
    if (!currentUser || !highlightName.trim() || selectedStories.size === 0) {
      toast({
        title: "Error",
        description: "Please enter a name and select at least one story",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const selectedStoryIds = Array.from(selectedStories).map(id => id.toString());
      const coverStory = yourStories.find(story => story.id === Array.from(selectedStories)[0]);
      const coverImage = coverStory?.image || '';

      const highlightId = await createHighlight(
        currentUser.uid,
        highlightName.trim(),
        selectedStoryIds,
        coverImage
      );

      if (highlightId) {
        const newHighlight: Highlight = {
          id: highlightId,
          userId: currentUser.uid,
          name: highlightName.trim(),
          coverImage,
          stories: selectedStoryIds,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        onHighlightCreated(newHighlight);
        
        toast({
          title: "Success",
          description: "Highlight created successfully"
        });
      } else {
        throw new Error('Failed to create highlight');
      }
    } catch (error) {
      console.error('Error creating highlight:', error);
      toast({
        title: "Error",
        description: "Failed to create highlight",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Create Highlight</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Highlight Name</label>
            <Input
              placeholder="e.g., Travel, Food, etc."
              value={highlightName}
              onChange={(e) => setHighlightName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Select Stories ({selectedStories.size} selected)
            </label>
            <div className="max-h-60 overflow-y-auto">
              {yourStories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No stories available</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {yourStories.map((story) => (
                    <div
                      key={story.id}
                      className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedStories.has(story.id)
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                      onClick={() => handleStorySelect(story.id)}
                    >
                      <img
                        src={story.image}
                        alt="Story"
                        className="w-full h-full object-cover"
                      />
                      {selectedStories.has(story.id) && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !highlightName.trim() || selectedStories.size === 0}
          >
            {creating ? 'Creating...' : 'Create Highlight'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateHighlightModal;
