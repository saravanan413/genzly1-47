import React, { useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, User, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import FollowRequestNotification from '../components/FollowRequestNotification';
import { useUnifiedNotifications } from '../hooks/useUnifiedNotifications';
import { useAuth } from '../contexts/AuthContext';

const Activity = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    notifications, 
    loading, 
    markAsSeen, 
    getNotificationMessage, 
    getRelativeTime 
  } = useUnifiedNotifications();

  // Add debugging for notification loading
  useEffect(() => {
    console.log('🎯 Activity page mounted');
    console.log('Current user:', currentUser?.uid);
    console.log('Loading state:', loading);
    console.log('Notifications count:', notifications.length);
    
    if (notifications.length > 0) {
      console.log('📋 All notifications:');
      notifications.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.type} from ${notification.senderProfile?.username} (seen: ${notification.seen})`);
      });
      
      const followRequests = notifications.filter(n => n.type === 'follow_request');
      console.log('👥 Follow request notifications:', followRequests.length);
      followRequests.forEach((req, index) => {
        console.log(`Follow request ${index + 1}:`, {
          id: req.id,
          senderId: req.senderId,
          senderUsername: req.senderProfile?.username,
          seen: req.seen,
          timestamp: req.timestamp
        });
      });
    }
  }, [currentUser, loading, notifications]);

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

    // Mark as seen
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
    console.log('🔄 Activity page is loading...');
    return (
      <Layout>
        <div className="p-4">
          <div className="container mx-auto max-w-lg">
            <h1 className="text-2xl font-bold mb-6">Activity</h1>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-card rounded-lg border animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                  </div>
                  <div className="w-12 h-12 rounded bg-gray-300"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  console.log('🎨 Rendering Activity page with', notifications.length, 'notifications');

  return (
    <Layout>
      <div className="p-4">
        <div className="container mx-auto max-w-lg">
          <h1 className="text-2xl font-bold mb-6">Activity</h1>
          
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Heart className="text-gray-400" size={32} />
              </div>
              <h3 className="text-gray-900 text-lg font-medium mb-2">No activity yet</h3>
              <p className="text-gray-500 text-sm">When people like, comment, or follow you, you'll see it here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                console.log('🔍 Rendering notification:', notification.type, 'from', notification.senderProfile?.username);
                
                // Handle follow requests specially
                if (notification.type === 'follow_request' && currentUser) {
                  console.log('👤 Rendering follow request notification');
                  return (
                    <FollowRequestNotification
                      key={notification.id}
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
                  );
                }

                // Regular notifications
                return (
                  <div 
                    key={notification.id} 
                    className={`flex items-center space-x-3 p-3 bg-card rounded-lg border transition-colors ${
                      notification.type !== 'follow_request' ? 'cursor-pointer hover:bg-gray-50' : ''
                    } ${!notification.seen ? 'ring-2 ring-blue-500/20 bg-blue-50/50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="relative">
                      <img 
                        src={
                          notification.senderProfile?.avatar || 
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            notification.senderProfile?.displayName || 'User'
                          )}&background=eee&color=555&size=40`
                        }
                        alt={notification.senderProfile?.displayName || 'User'} 
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            notification.senderProfile?.displayName || 'User'
                          )}&background=eee&color=555&size=40`;
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border">
                        {getActivityIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">
                          {notification.senderProfile?.username || 'Unknown User'}
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {getNotificationMessage(notification)}
                        </span>
                        {!notification.seen && (
                          <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {getRelativeTime(notification.timestamp)}
                      </p>
                    </div>
                    
                    {notification.postThumbnail && (
                      <img 
                        src={notification.postThumbnail} 
                        alt="Post" 
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Activity;
