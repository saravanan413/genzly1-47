
import React from 'react';

interface OnlineStatusProps {
  isOnline: boolean;
  lastSeen?: string;
  size?: 'sm' | 'md' | 'lg';
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({
  isOnline,
  lastSeen,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (isOnline) {
    return (
      <div className={`${sizeClasses[size]} bg-green-500 rounded-full border-2 border-white`} />
    );
  }

  if (lastSeen) {
    return (
      <span className="text-xs text-gray-500">
        Last seen {lastSeen}
      </span>
    );
  }

  return null;
};

export default OnlineStatus;
