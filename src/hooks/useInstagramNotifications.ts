
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnifiedNotifications } from './useUnifiedNotifications';

export const useInstagramNotifications = () => {
  const { currentUser } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsSeen, 
    markAllAsSeen, 
    deleteNotificationById 
  } = useUnifiedNotifications();

  // Filter for Instagram-style notifications (likes, comments, follows)
  const instagramNotifications = notifications.filter(notification => 
    ['like', 'comment', 'follow_request', 'follow_accept'].includes(notification.type)
  );

  return {
    notifications: instagramNotifications,
    unreadCount,
    loading,
    markNotificationAsRead: markAsSeen,
    markAllAsRead: markAllAsSeen,
    deleteNotification: deleteNotificationById
  };
};
