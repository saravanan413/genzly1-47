
import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Home } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const SwipeIndicator: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  if (!isHomePage && location.pathname !== '/chat') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 md:bottom-8 left-1/2 transform -translate-x-1/2 z-30"
    >
      <div className="bg-black/70 text-white px-4 py-2 rounded-full flex items-center space-x-2 text-sm backdrop-blur-sm">
        {isHomePage ? (
          <>
            <span>Swipe left for messages</span>
            <MessageCircle size={16} />
          </>
        ) : (
          <>
            <Home size={16} />
            <span>Swipe right for home</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SwipeIndicator;
