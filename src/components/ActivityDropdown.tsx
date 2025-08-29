
import React, { useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import FollowRequestNotification from './FollowRequestNotification';

interface ActivityDropdownProps {
  isOpen?: boolean;
}

const ActivityDropdown: React.FC<ActivityDropdownProps> = ({ isOpen = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    notifications, 
    loading, 
    markAsSeen, 
    markAllAsSeen,
    getNotificationMessage, 
    getRelativeTime 
  } = useNotifications();

  // Mark all notifications as seen when dropdown is opened
  useEffect(() => {
    if (isOpen && notifications.some(n => !n.seen)) {
      const timer = setTimeout(() => {
        markAllAsSeen();
      }, 1000); // Wait 1 second before marking as seen
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, notifications, markAllAsSeen]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="text-red-500" size={16} />;
      case 'comment':
        return <MessageCircle className="text-blue-500" size={16} />;
      case 'follow_request':
        return <User className="text-blue-500" size={16} />;
      case 'follow_accept':
        return <UserPlus className="text-green-500" size={16} />;
      default:
        return <User className="text-gray-400" size={16} />;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Don't handle clicks for follow requests (they have their own buttons)
    if (notification.type === 'follow_request') {
      return;
    }

    // Mark as seen if not already seen
    if (!notification.seen) {
      await markAsSeen(notification.id);
    }

    // Navigate based on type
    if (notification.type === 'like' || notification.type === 'comment') {
      if (notification.postId) {
        navigate(`/post/${notification.postId}`);
      }
    } else if (notification.type === 'follow_accept') {
      navigate(`/user/${notification.senderId}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-card rounded-xl border animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-300"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show only recent 5 notifications in dropdown
  const recentNotifications = notifications.slice(0, 5);

  if (recentNotifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Heart className="text-gray-400" size={24} />
        </div>
        <h3 className="text-gray-900 font-medium mb-2">No activity yet</h3>
        <p className="text-gray-400 text-sm">When people like, comment, or follow you, you'll see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentNotifications.map((notification) => {
        // Handle follow requests specially
        if (notification.type === 'follow_request' && currentUser) {
          return (
            <div key={notification.id} className="p-2">
              <FollowRequestNotification
                notification={{
                  id: notification.id,
                  type: 'follow_request',
                  from: notification.senderId,
                  fromUserId: notification.senderId,
                  fromUsername: notification.senderProfile?.username || 'Unknown',
                  fromProfilePic: notification.senderProfile?.avatar,
                  timestamp: notification.timestamp,
                  status: 'pending',
                  seen: notification.seen,
                  receiverId: notification.receiverId,
                  senderId: notification.senderId,
                  senderProfile: notification.senderProfile
                }}
                currentUserId={currentUser.uid}
              />
            </div>
          );
        }

        // Regular notifications
        return (
          <div 
            key={notification.id} 
            className={`flex items-center space-x-4 p-4 bg-card rounded-xl border hover:bg-gray-50 hover:scale-[1.02] transition-all duration-200 cursor-pointer group ${
              !notification.seen ? 'ring-2 ring-blue-500/20 bg-blue-50/50' : ''
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
                <img 
                  src={
                    notification.senderProfile?.avatar || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      notification.senderProfile?.displayName || 'User'
                    )}&background=eee&color=555&size=48`
                  }
                  alt={notification.senderProfile?.displayName || 'User'} 
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      notification.senderProfile?.displayName || 'User'
                    )}&background=eee&color=555&size=48`;
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border">
                {getActivityIcon(notification.type)}
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-sm leading-relaxed">
                <span className="font-semibold group-hover:text-primary transition-colors duration-200">
                  {notification.senderProfile?.username || 'Unknown User'}
                </span>{' '}
                <span className="text-muted-foreground">
                  {getNotificationMessage(notification)}
                </span>
                {!notification.seen && (
                  <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getRelativeTime(notification.timestamp)}
              </p>
            </div>
            
            {notification.postThumbnail && (
              <img 
                src={notification.postThumbnail} 
                alt="Post" 
                className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform duration-200"
              />
            )}
          </div>
        );
      })}
      
      {notifications.length > 5 && (
        <div className="pt-2 border-t">
          <button
            onClick={() => navigate('/activity')}
            className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityDropdown;
