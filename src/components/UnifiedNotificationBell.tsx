
import React from 'react';
import { Bell } from 'lucide-react';
import { useUnifiedNotifications } from '../hooks/useUnifiedNotifications';

interface UnifiedNotificationBellProps {
  className?: string;
  size?: number;
}

const UnifiedNotificationBell: React.FC<UnifiedNotificationBellProps> = ({ 
  className = '', 
  size = 24 
}) => {
  const { unreadCount } = useUnifiedNotifications();
  const hasUnseen = unreadCount > 0;

  return (
    <div className={`relative ${className}`}>
      <Bell size={size} className="text-foreground" />
      {hasUnseen && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default UnifiedNotificationBell;
