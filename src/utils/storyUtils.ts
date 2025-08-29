
export const STORY_EXPIRY_HOURS = 24;

export interface StoryWithTimestamp {
  id: number;
  image: string;
  timestamp: string;
  createdAt: number; // Unix timestamp
}

export const isStoryExpired = (createdAt: number): boolean => {
  const now = Date.now();
  const expiryTime = STORY_EXPIRY_HOURS * 60 * 60 * 1000; // 24 hours in milliseconds
  return (now - createdAt) > expiryTime;
};

export const cleanupExpiredStories = (stories: StoryWithTimestamp[]): StoryWithTimestamp[] => {
  return stories.filter(story => !isStoryExpired(story.createdAt));
};

export const formatTimestamp = (createdAt: number): string => {
  const now = Date.now();
  const diffMs = now - createdAt;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'now';
  } else if (diffHours < 1) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else {
    return '24h';
  }
};

// Calculate time remaining until story expires
export const getTimeUntilExpiry = (createdAt: number): string => {
  const now = Date.now();
  const expiryTime = createdAt + (STORY_EXPIRY_HOURS * 60 * 60 * 1000);
  const timeLeft = expiryTime - now;
  
  if (timeLeft <= 0) return 'Expired';
  
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hoursLeft > 0) {
    return `${hoursLeft}h ${minutesLeft}m left`;
  } else {
    return `${minutesLeft}m left`;
  }
};
