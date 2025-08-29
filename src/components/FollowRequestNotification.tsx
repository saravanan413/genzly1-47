
import React, { useState } from 'react';
import { Check, X, User } from 'lucide-react';
import { acceptFollowRequest, rejectFollowRequest } from '../services/follow';
import { useAuth } from '../contexts/AuthContext';

// Updated interface to match the unified notification structure
interface FollowRequestNotificationProps {
  notification: {
    id: string;
    type: string;
    from?: string;
    fromUserId?: string;
    fromUsername?: string;
    fromProfilePic?: string;
    timestamp: any;
    status?: string;
    seen: boolean;
    receiverId: string;
    senderId: string;
    senderProfile?: {
      username: string;
      displayName: string;
      avatar?: string;
    };
  };
  currentUserId: string;
}

const FollowRequestNotification: React.FC<FollowRequestNotificationProps> = ({
  notification,
  currentUserId
}) => {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAcceptRequest = async () => {
    if (isProcessing || !currentUser?.uid) return;
    
    setIsProcessing(true);
    try {
      console.log('Accepting follow request from:', notification.fromUserId || notification.senderId);
      
      const success = await acceptFollowRequest(currentUser.uid, notification.fromUserId || notification.senderId);
      
      if (success) {
        console.log('Follow request accepted successfully');
      } else {
        console.error('Failed to accept follow request');
      }
    } catch (error) {
      console.error('Error accepting follow request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async () => {
    if (isProcessing || !currentUser?.uid) return;
    
    setIsProcessing(true);
    try {
      console.log('Rejecting follow request from:', notification.fromUserId || notification.senderId);
      
      const success = await rejectFollowRequest(currentUser.uid, notification.fromUserId || notification.senderId);
      
      if (success) {
        console.log('Follow request rejected successfully');
      } else {
        console.error('Failed to reject follow request');
      }
    } catch (error) {
      console.error('Error rejecting follow request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const senderUserId = notification.fromUserId || notification.senderId;
  const senderUsername = notification.fromUsername || notification.senderProfile?.username || 'Unknown User';
  const senderAvatar = notification.fromProfilePic || notification.senderProfile?.avatar;

  return (
    <div className="flex items-center space-x-3 p-4 bg-card rounded-xl border">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
          <img 
            src={
              senderAvatar || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(senderUsername)}&background=eee&color=555&size=48`
            }
            alt={senderUsername} 
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderUsername)}&background=eee&color=555&size=48`;
            }}
          />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border">
          <User className="text-blue-500" size={14} />
        </div>
      </div>
      
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold">
            {senderUsername}
          </span>{' '}
          <span className="text-muted-foreground">
            requested to follow you
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(notification.timestamp?.toDate?.() || notification.timestamp).toLocaleDateString()}
        </p>
        
        <div className="flex space-x-2 mt-3">
          <button
            onClick={handleAcceptRequest}
            disabled={isProcessing}
            className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <Check size={14} />
            <span>{isProcessing ? 'Accepting...' : 'Accept'}</span>
          </button>
          <button
            onClick={handleRejectRequest}
            disabled={isProcessing}
            className="px-4 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <X size={14} />
            <span>{isProcessing ? 'Declining...' : 'Decline'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowRequestNotification;
