
import React, { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle, XCircle } from 'lucide-react';

interface NotificationManagerProps {
  onNotificationPermissionChange?: (granted: boolean) => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  onNotificationPermissionChange
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      alert('Notifications are not supported in this browser');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      onNotificationPermissionChange?.(result === 'granted');
      setShowStatus(true);
      
      if (result === 'granted') {
        // Send a test notification
        new Notification('Genzly Notifications Enabled! 🎉', {
          body: 'You will now receive notifications for new messages!',
          icon: '/favicon.ico'
        });
        
        setTimeout(() => setShowStatus(false), 3000);
      } else if (result === 'denied') {
        setTimeout(() => setShowStatus(false), 5000);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Failed to request notification permission. Please try again.');
    }
  };

  const sendNotification = (title: string, body: string, icon?: string) => {
    if (permission === 'granted' && isSupported) {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico'
      });
    }
  };

  // Expose the sendNotification function globally
  useEffect(() => {
    (window as any).sendNotification = sendNotification;
  }, [permission, isSupported]);

  if (!isSupported) {
    return (
      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
        <XCircle size={16} />
        <span>Notifications not supported</span>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: <CheckCircle size={16} className="text-green-500" />,
          text: 'Notifications enabled',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-700 dark:text-green-400'
        };
      case 'denied':
        return {
          icon: <XCircle size={16} className="text-red-500" />,
          text: 'Notifications blocked - Enable in browser settings',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-400'
        };
      default:
        return {
          icon: <Bell size={16} className="text-blue-500" />,
          text: 'Click to enable notifications',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-400'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex flex-col items-end space-y-2">
      <button
        onClick={requestPermission}
        disabled={permission === 'granted'}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${statusInfo.bgColor} ${statusInfo.textColor} ${
          permission === 'granted' 
            ? 'cursor-default' 
            : 'hover:scale-105 cursor-pointer shadow-sm hover:shadow-md'
        }`}
        title={
          permission === 'granted'
            ? 'Notifications are enabled'
            : permission === 'denied'
            ? 'Notifications are blocked - Check browser settings'
            : 'Click to enable notifications'
        }
      >
        {statusInfo.icon}
        <span className="text-xs font-medium">
          {permission === 'granted' ? 'Notifications On' : 
           permission === 'denied' ? 'Enable in Settings' : 
           'Enable Notifications'}
        </span>
      </button>
      
      {showStatus && (
        <div className={`px-3 py-2 rounded-lg text-xs ${statusInfo.bgColor} ${statusInfo.textColor} animate-fade-in`}>
          {statusInfo.text}
        </div>
      )}
    </div>
  );
};

// Utility function to send notifications
export const sendPushNotification = (title: string, body: string, icon?: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico'
    });
  }
};

export default NotificationManager;
