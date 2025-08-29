
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface EnhancedVideoPlayerProps {
  src: string;
  poster?: string;
  isActive: boolean;
  onDoubleTap?: () => void;
  className?: string;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  toggleMute: () => void;
}

const EnhancedVideoPlayer = forwardRef<VideoPlayerRef, EnhancedVideoPlayerProps>(
  ({ src, poster, isActive, onDoubleTap, className = "" }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [progress, setProgress] = useState(0);

    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      toggleMute: () => toggleMute()
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      if (isActive) {
        video.currentTime = 0;
        video.play().catch(error => {
          console.error("Autoplay failed:", error);
          video.muted = true;
          video.play();
        });
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }, [isActive]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const updateProgress = () => {
        const progress = (video.currentTime / video.duration) * 100;
        setProgress(progress);
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      video.addEventListener('timeupdate', updateProgress);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);

      return () => {
        video.removeEventListener('timeupdate', updateProgress);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      };
    }, []);

    const toggleMute = () => {
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
      }
    };

    const togglePlayPause = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      }
    };

    const handleVideoClick = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const centerX = rect.width / 2;
      
      if (Math.abs(x - centerX) < 50) {
        togglePlayPause();
      }
    };

    return (
      <div 
        className={`relative w-full h-full ${className}`}
        onDoubleClick={onDoubleTap}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onTouchStart={() => setShowControls(true)}
        onTouchEnd={() => setTimeout(() => setShowControls(false), 3000)}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
          onClick={handleVideoClick}
        />
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
          <div 
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls overlay */}
        {showControls && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center mr-4"
            >
              {isPlaying ? (
                <Pause size={24} className="text-white" />
              ) : (
                <Play size={24} className="text-white ml-1" />
              )}
            </button>
            
            <button
              onClick={toggleMute}
              className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center"
            >
              {isMuted ? (
                <VolumeX size={20} className="text-white" />
              ) : (
                <Volume2 size={20} className="text-white" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  }
);

EnhancedVideoPlayer.displayName = 'EnhancedVideoPlayer';

export default EnhancedVideoPlayer;
