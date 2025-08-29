
import { useRef } from 'react';
import { Reel } from '../../types/reels';
import ReelHeader from './ReelHeader';
import HeartAnimation from '../HeartAnimation';
import EnhancedVideoPlayer, { VideoPlayerRef } from './EnhancedVideoPlayer';

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  onDoubleTap?: () => void;
}

const ReelItem = ({ reel, isActive, onDoubleTap }: ReelItemProps) => {
  const videoRef = useRef<VideoPlayerRef>(null);

  return (
    <>
      <HeartAnimation onDoubleClick={onDoubleTap || (() => {})}>
        <EnhancedVideoPlayer
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.videoThumbnail}
          isActive={isActive}
          onDoubleTap={onDoubleTap}
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-black/20" />
      </HeartAnimation>
      
      <ReelHeader />
    </>
  );
};

export default ReelItem;
