
import { useState, useEffect } from 'react';
import { getUserHighlights, createHighlight, deleteHighlight, Highlight } from '../services/highlightsService';
import { useAuth } from '../contexts/AuthContext';

export const useStoryHighlights = () => {
  const { currentUser } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  // Load highlights from Firebase
  useEffect(() => {
    const loadHighlights = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        const userHighlights = await getUserHighlights(currentUser.uid);
        setHighlights(userHighlights);
      } catch (error) {
        console.error('Error loading story highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHighlights();
  }, [currentUser]);

  const createHighlightGroup = async (name: string, storyIds: string[], coverImage: string) => {
    if (!currentUser?.uid) return null;

    try {
      const highlightId = await createHighlight(currentUser.uid, name, storyIds, coverImage);
      if (highlightId) {
        const newHighlight: Highlight = {
          id: highlightId,
          userId: currentUser.uid,
          name,
          stories: storyIds,
          coverImage,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        setHighlights(prev => [newHighlight, ...prev]);
        return newHighlight;
      }
    } catch (error) {
      console.error('Error creating highlight:', error);
    }
    return null;
  };

  const deleteHighlightGroup = async (highlightId: string) => {
    try {
      const success = await deleteHighlight(highlightId);
      if (success) {
        setHighlights(prev => prev.filter(h => h.id !== highlightId));
      }
      return success;
    } catch (error) {
      console.error('Error deleting highlight:', error);
      return false;
    }
  };

  return {
    highlights,
    loading,
    createHighlight: createHighlightGroup,
    deleteHighlight: deleteHighlightGroup
  };
};
