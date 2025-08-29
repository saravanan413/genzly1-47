
import { useState, useCallback } from 'react';

interface StoryViewer {
  userId: string;
  username: string;
  avatar: string;
  viewedAt: number;
}

interface StoryViewData {
  storyId: number;
  viewers: StoryViewer[];
  viewCount: number;
}

export const useStoryViewers = () => {
  const [viewerData, setViewerData] = useState<Map<number, StoryViewData>>(new Map());

  const addViewer = useCallback((storyId: number, viewer: Omit<StoryViewer, 'viewedAt'>) => {
    setViewerData(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(storyId) || { storyId, viewers: [], viewCount: 0 };
      
      // Check if user already viewed this story
      const hasViewed = existing.viewers.some(v => v.userId === viewer.userId);
      
      if (!hasViewed) {
        const newViewer = { ...viewer, viewedAt: Date.now() };
        existing.viewers.push(newViewer);
        existing.viewCount = existing.viewers.length;
        newMap.set(storyId, existing);
      }
      
      return newMap;
    });
  }, []);

  const getViewers = useCallback((storyId: number): StoryViewData | null => {
    return viewerData.get(storyId) || null;
  }, [viewerData]);

  const getViewCount = useCallback((storyId: number): number => {
    return viewerData.get(storyId)?.viewCount || 0;
  }, [viewerData]);

  return {
    addViewer,
    getViewers,
    getViewCount
  };
};
