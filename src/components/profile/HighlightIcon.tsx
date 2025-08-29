
import React from 'react';
import { Highlight } from '../../services/highlightsService';

interface HighlightIconProps {
  highlight: Highlight;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const HighlightIcon: React.FC<HighlightIconProps> = ({ 
  highlight, 
  onClick, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex flex-col items-center cursor-pointer group" onClick={onClick}>
      <div className={`${sizeClasses[size]} rounded-full border-2 border-gray-300 dark:border-gray-600 overflow-hidden group-hover:scale-105 transition-transform duration-200`}>
        <img
          src={highlight.coverImage}
          alt={highlight.name}
          className="w-full h-full object-cover"
        />
      </div>
      <span className={`${textSizeClasses[size]} text-gray-700 dark:text-gray-300 mt-1 max-w-[60px] truncate text-center`}>
        {highlight.name}
      </span>
    </div>
  );
};

export default HighlightIcon;
