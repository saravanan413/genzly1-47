
import React, { useState } from 'react';
import { Music, Play, Pause } from 'lucide-react';

interface StoryMusicProps {
  songTitle: string;
  artist: string;
  albumCover?: string;
  audioUrl?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

const StoryMusic: React.FC<StoryMusicProps> = ({
  songTitle,
  artist,
  albumCover,
  audioUrl,
  isPlaying = false,
  onTogglePlay
}) => {
  const [localPlaying, setLocalPlaying] = useState(false);

  const handleToggle = () => {
    setLocalPlaying(!localPlaying);
    onTogglePlay?.();
  };

  const playing = onTogglePlay ? isPlaying : localPlaying;

  return (
    <div className="absolute bottom-20 left-4 right-4">
      <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-3 flex items-center space-x-3">
        {/* Album cover or music icon */}
        <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
          {albumCover ? (
            <img 
              src={albumCover} 
              alt={`${songTitle} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music className="text-white" size={20} />
          )}
        </div>
        
        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">
            {songTitle}
          </p>
          <p className="text-white/70 text-xs truncate">
            {artist}
          </p>
        </div>
        
        {/* Play/pause button */}
        <button
          onClick={handleToggle}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          {playing ? (
            <Pause className="text-white" size={16} fill="currentColor" />
          ) : (
            <Play className="text-white" size={16} fill="currentColor" />
          )}
        </button>
      </div>
      
      {/* Sound waves animation */}
      {playing && (
        <div className="flex items-center justify-center space-x-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white/60 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 20 + 10}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryMusic;
