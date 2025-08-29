
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const VAPID_KEY = 'BA1ZE8M_jo1ACNgftDkYBtZPhHpeUYqBMWLudB_5rfNMgTgcRdmf1AcnofMgbqba4FyjXwrhASK4wSTSpbX4X3c';

export const initializeFCM = async (userId: string) => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const messaging = getMessaging();
    
    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });

    if (token) {
      // Store token in Firestore
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        lastTokenUpdate: new Date()
      });

      console.log('FCM Token stored successfully');
      return token;
    }
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return null;
  }
};

export const onForegroundMessage = () => {
  const messaging = getMessaging();
  
  onMessage(messaging, (payload) => {
    console.log('Received foreground message:', payload);
    
    // Show notification
    if (payload.notification) {
      new Notification(payload.notification.title || 'New Message', {
        body: payload.notification.body,
        icon: payload.notification.icon || '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  });
};

export const sendNotificationToUser = async (targetUserId: string, title: string, body: string, data?: any) => {
  // This would typically be called from a backend function
  // For now, we'll just log the intended notification
  console.log('Would send notification:', {
    targetUserId,
    title,
    body,
    data
  });
};
