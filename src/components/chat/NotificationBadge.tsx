
import React from 'react';

interface NotificationBadgeProps {
  count: number;
  showDot?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  count, 
  showDot = false, 
  className = '',
  size = 'md'
}) => {
  if (count === 0 && !showDot) return null;

  const sizeClasses = {
    sm: 'w-2 h-2 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  const baseClasses = `
    absolute -top-1 -right-1 
    bg-red-500 text-white 
    rounded-full 
    flex items-center justify-center 
    font-semibold
    min-w-0
    ${sizeClasses[size]}
    ${className}
  `;

  if (showDot && count === 0) {
    return (
      <div className={`${baseClasses} w-2 h-2`} />
    );
  }

  return (
    <div className={baseClasses}>
      {count > 99 ? '99+' : count}
    </div>
  );
};

export default NotificationBadge;
