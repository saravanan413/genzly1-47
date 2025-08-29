
import { useState, RefObject } from 'react';
import { Heart } from 'lucide-react';

interface HeartAnimationProps {
  onDoubleClick: () => void;
  children: React.ReactNode;
  onComplete?: () => void;
  parentRef?: RefObject<HTMLElement>;
}

const HeartAnimation = ({ onDoubleClick, children, onComplete }: HeartAnimationProps) => {
  const [showHeart, setShowHeart] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      setShowHeart(true);
      onDoubleClick();
      
      setTimeout(() => {
        setShowHeart(false);
        onComplete?.();
      }, 1000);
    }
    
    setLastTap(now);
  };

  return (
    <div className="relative" onClick={handleTap}>
      {children}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Heart
            size={80}
            className="text-red-500 fill-red-500"
            style={{
              animation: 'heartPop 1s ease-out forwards',
            }}
          />
        </div>
      )}
      <style>{`
        @keyframes heartPop {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default HeartAnimation;
