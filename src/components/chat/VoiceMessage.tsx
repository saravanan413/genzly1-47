
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface VoiceMessageProps {
  audioUrl?: string;
  duration?: number;
  isOwn: boolean;
  waveform?: number[];
}

const VoiceMessage: React.FC<VoiceMessageProps> = ({
  audioUrl,
  duration = 30,
  isOwn,
  waveform = [0.3, 0.7, 0.4, 0.8, 0.6, 0.5, 0.9, 0.3, 0.6, 0.4, 0.7, 0.5]
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      const handleLoadedMetadata = () => {
        setActualDuration(audio.duration);
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          // Fallback for demo - simulate playing
          setIsPlaying(true);
          setTimeout(() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }, 3000);
        });
      }
      setIsPlaying(!isPlaying);
    } else {
      // Fallback for demo when no audio URL
      setIsPlaying(!isPlaying);
      if (!isPlaying) {
        const interval = setInterval(() => {
          setCurrentTime(prev => {
            const newTime = prev + 0.1;
            if (newTime >= actualDuration) {
              clearInterval(interval);
              setIsPlaying(false);
              setCurrentTime(0);
              return 0;
            }
            return newTime;
          });
        }, 100);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = actualDuration > 0 ? (currentTime / actualDuration) : 0;

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-2xl max-w-xs ${
      isOwn 
        ? 'bg-primary text-primary-foreground' 
        : 'bg-muted text-muted-foreground'
    }`}>
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-300 hover:bg-gray-400'
        }`}
      >
        {isPlaying ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" />
        )}
      </button>
      
      {/* Waveform */}
      <div className="flex items-center space-x-1 flex-1">
        {waveform.map((height, index) => (
          <div
            key={index}
            className={`w-1 rounded-full transition-all duration-200 ${
              isOwn ? 'bg-white/60' : 'bg-gray-400'
            }`}
            style={{ 
              height: `${height * 20 + 8}px`,
              opacity: index <= progress * waveform.length ? 1 : 0.4,
              backgroundColor: index <= progress * waveform.length 
                ? (isOwn ? '#ffffff' : '#3b82f6') 
                : undefined
            }}
          />
        ))}
      </div>
      
      <span className="text-xs opacity-70 min-w-[35px]">
        {formatTime(actualDuration - currentTime)}
      </span>
      
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
      )}
    </div>
  );
};

export default VoiceMessage;
