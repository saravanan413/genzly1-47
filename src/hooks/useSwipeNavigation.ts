
import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeConfig {
  threshold: number; // minimum distance for swipe
  velocity: number; // minimum velocity for swipe
}

const defaultConfig: SwipeConfig = {
  threshold: 60, // Changed to 60px as requested
  velocity: 0.3
};

export const useSwipeNavigation = (config: SwipeConfig = defaultConfig) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    // Calculate velocity
    const velocity = Math.abs(deltaX) / deltaTime;
    
    // Check if it's a horizontal swipe (not vertical scroll)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (
      isHorizontalSwipe &&
      Math.abs(deltaX) > config.threshold &&
      velocity > config.velocity &&
      !isTransitioning
    ) {
      setIsTransitioning(true);
      
      // Navigate based on swipe direction and current page
      if (deltaX < 0 && location.pathname === '/') {
        // Swipe left from home -> go to chat
        navigate('/chat');
      } else if (deltaX > 0 && location.pathname === '/chat') {
        // Swipe right from chat -> go to home
        navigate('/');
      }
      
      // Reset transition state after animation
      setTimeout(() => setIsTransitioning(false), 300);
    }
    
    touchStartRef.current = null;
  };

  return {
    handleTouchStart,
    handleTouchEnd,
    isTransitioning
  };
};
