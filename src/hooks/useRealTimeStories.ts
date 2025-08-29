
import { useState, useEffect, useCallback } from 'react';
import { StoryWithTimestamp, isStoryExpired, formatTimestamp, getTimeUntilExpiry } from '../utils/storyUtils';
import { useStoryViewers } from './useStoryViewers';
import { sendPushNotification } from '../components/NotificationManager';
import { logger } from '../utils/logger';

interface StoryUser {
  name: string;
  avatar: string;
  stories: StoryWithTimestamp[];
}

export const useRealTimeStories = (initialData: any[]) => {
  // Transform the initial data with proper creation times for testing
  const transformedData: StoryUser[] = initialData.map(userData => ({
    name: userData.user.name,
    avatar: userData.user.avatar,
    stories: userData.stories.map(story => ({
      ...story,
      // For demo: make some stories closer to expiring to see the auto-deletion in action
      createdAt: story.createdAt || (Date.now() - Math.random() * 23 * 60 * 60 * 1000) // Random time within last 23 hours
    }))
  }));

  const [storiesData, setStoriesData] = useState<StoryUser[]>(transformedData);
  const [lastCleanup, setLastCleanup] = useState(Date.now());
  const { addViewer, getViewCount, getViewers } = useStoryViewers();

  // Real-time cleanup function - runs every 10 seconds for demo visibility
  const cleanupExpiredStories = useCallback(() => {
    logger.debug('Starting story cleanup check...');
    
    setStoriesData(prevData => {
      const beforeCount = prevData.reduce((total, user) => total + user.stories.length, 0);
      
      const updatedData = prevData.map(userData => ({
        ...userData,
        stories: userData.stories.filter(story => {
          const expired = isStoryExpired(story.createdAt);
          const timeLeft = getTimeUntilExpiry(story.createdAt);
          
          if (expired) {
            logger.debug(`STORY EXPIRED: Story ${story.id} from ${userData.name} (created ${new Date(story.createdAt).toLocaleString()})`);
          } else {
            logger.debug(`Story ${story.id} from ${userData.name}: ${timeLeft}`);
          }
          return !expired;
        })
      })).filter(userData => userData.stories.length > 0);
      
      const afterCount = updatedData.reduce((total, user) => total + user.stories.length, 0);
      const deletedCount = beforeCount - afterCount;
      
      if (deletedCount > 0) {
        logger.debug(`CLEANUP COMPLETE: Removed ${deletedCount} expired stories (24h+ old)`);
        // Show notification about deleted stories
        sendPushNotification(
          'Stories Expired', 
          `${deletedCount} stories have been automatically deleted after 24 hours`
        );
      } else {
        logger.debug('No expired stories found');
      }
      
      setLastCleanup(Date.now());
      return updatedData;
    });
  }, []);

  // Update timestamps in real-time - runs every 10 seconds
  const updateTimestamps = useCallback(() => {
    setStoriesData(prevData => 
      prevData.map(userData => ({
        ...userData,
        stories: userData.stories.map(story => ({
          ...story,
          timestamp: formatTimestamp(story.createdAt)
        }))
      }))
    );
    logger.debug('Story timestamps updated');
  }, []);

  // Set up real-time intervals - every 10 seconds for demo visibility
  useEffect(() => {
    // Clean up expired stories every 10 seconds (for demo - normally would be longer)
    const cleanupInterval = setInterval(cleanupExpiredStories, 10 * 1000);
    
    // Update timestamps every 10 seconds
    const timestampInterval = setInterval(updateTimestamps, 10 * 1000);
    
    // Initial cleanup and timestamp update
    cleanupExpiredStories();
    updateTimestamps();

    logger.debug('Real-time story management initialized (10s intervals for demo)');
    logger.debug('Stories will be auto-deleted after exactly 24 hours');

    return () => {
      clearInterval(cleanupInterval);
      clearInterval(timestampInterval);
      logger.debug('Real-time story management cleanup');
    };
  }, [cleanupExpiredStories, updateTimestamps]);

  // Add new story
  const addStory = useCallback((userId: string, story: Omit<StoryWithTimestamp, 'createdAt'>) => {
    const newStory: StoryWithTimestamp = {
      ...story,
      createdAt: Date.now(),
      timestamp: 'now'
    };

    setStoriesData(prevData => {
      const userIndex = prevData.findIndex(user => user.name === userId);
      if (userIndex !== -1) {
        const updatedData = [...prevData];
        updatedData[userIndex] = {
          ...updatedData[userIndex],
          stories: [...updatedData[userIndex].stories, newStory]
        };
        return updatedData;
      }
      return prevData;
    });

    logger.debug(`New story added for user: ${userId}, Story ID: ${newStory.id}, Will expire in 24h`);
  }, []);

  // Mark story as viewed
  const markStoryAsViewed = useCallback((storyId: number, viewerData: { userId: string; username: string; avatar: string }) => {
    addViewer(storyId, viewerData);
    logger.debug(`Story viewed: ${storyId} by: ${viewerData.username}`);
  }, [addViewer]);

  return {
    storiesData,
    cleanupExpiredStories,
    addStory,
    markStoryAsViewed,
    getViewCount,
    getViewers,
    lastCleanup
  };
};
