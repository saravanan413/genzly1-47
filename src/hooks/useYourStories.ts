
import { useState, useEffect } from 'react';
import { StoryWithTimestamp } from '../utils/storyUtils';

interface YourStory extends StoryWithTimestamp {
  id: number;
  image: string;
  timestamp: string;
  createdAt: number;
  type: 'image' | 'video' | 'text';
  textContent?: string;
  backgroundColor?: string;
  textColor?: string;
}

export const useYourStories = () => {
  const [yourStories, setYourStories] = useState<YourStory[]>([]);

  // Load stories from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('genzly_your_stories');
      if (saved) {
        const stories = JSON.parse(saved);
        // Filter out expired stories
        const validStories = stories.filter((story: YourStory) => {
          const now = Date.now();
          const expiryTime = 24 * 60 * 60 * 1000; // 24 hours
          return (now - story.createdAt) < expiryTime;
        });
        setYourStories(validStories);
        
        // Save back filtered stories
        if (validStories.length !== stories.length) {
          localStorage.setItem('genzly_your_stories', JSON.stringify(validStories));
        }
      }
    } catch (error) {
      console.error('Error loading your stories:', error);
    }
  }, []);

  const addStory = (story: Omit<YourStory, 'id' | 'createdAt' | 'timestamp'>) => {
    const newStory: YourStory = {
      ...story,
      id: Date.now(),
      createdAt: Date.now(),
      timestamp: 'now'
    };

    const updatedStories = [...yourStories, newStory];
    setYourStories(updatedStories);
    
    try {
      localStorage.setItem('genzly_your_stories', JSON.stringify(updatedStories));
    } catch (error) {
      console.error('Error saving story:', error);
    }

    console.log('📸 Your story added:', newStory.id);
    return newStory;
  };

  const deleteStory = (storyId: number) => {
    const updatedStories = yourStories.filter(story => story.id !== storyId);
    setYourStories(updatedStories);
    
    try {
      localStorage.setItem('genzly_your_stories', JSON.stringify(updatedStories));
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  // Clean up expired stories
  const cleanupExpiredStories = () => {
    const now = Date.now();
    const expiryTime = 24 * 60 * 60 * 1000; // 24 hours
    const validStories = yourStories.filter(story => (now - story.createdAt) < expiryTime);
    
    if (validStories.length !== yourStories.length) {
      setYourStories(validStories);
      localStorage.setItem('genzly_your_stories', JSON.stringify(validStories));
      console.log(`🧹 Cleaned up ${yourStories.length - validStories.length} expired stories`);
    }
  };

  return {
    yourStories,
    addStory,
    deleteStory,
    cleanupExpiredStories
  };
};
