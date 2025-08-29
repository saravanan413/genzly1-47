
import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';

interface SwipeWrapperProps {
  children: React.ReactNode;
}

const SwipeWrapper: React.FC<SwipeWrapperProps> = ({ children }) => {
  const location = useLocation();
  const { handleTouchStart, handleTouchEnd, isTransitioning } = useSwipeNavigation();

  const slideVariants: Variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'tween',
        ease: 'easeOut',
        duration: 0.3
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: {
        type: 'tween',
        ease: 'easeOut',
        duration: 0.3
      }
    })
  };

  // Determine animation direction based on route
  const getDirection = () => {
    if (location.pathname === '/chat') return 1; // Coming from left
    return -1; // Going to right
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="h-full w-full overflow-hidden"
      style={{ touchAction: 'pan-y' }} // Allow vertical scrolling but handle horizontal swipes
    >
      <AnimatePresence mode="wait" custom={getDirection()}>
        <motion.div
          key={location.pathname}
          custom={getDirection()}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="h-full w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SwipeWrapper;
