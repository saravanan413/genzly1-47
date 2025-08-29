
import { useState, useRef } from 'react';

export const usePullToRefresh = (onRefresh: () => void) => {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      onRefresh();
      setRefreshing(false);
      setPullDistance(0);
    }, 1500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && startY > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, Math.min(120, currentY - startY));
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  return {
    containerRef,
    refreshing,
    pullDistance,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
