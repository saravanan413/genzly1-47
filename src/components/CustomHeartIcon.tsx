
import React from 'react';
import { Heart } from 'lucide-react';

interface CustomHeartIconProps {
  size?: number;
  className?: string;
  filled?: boolean;
}

const CustomHeartIcon = ({ size = 24, className = '', filled = false }: CustomHeartIconProps) => {
  return (
    <Heart
      size={size}
      className={`${className} ${filled ? 'text-red-500 fill-red-500' : 'text-gray-700 dark:text-gray-300'}`}
    />
  );
};

export default CustomHeartIcon;
