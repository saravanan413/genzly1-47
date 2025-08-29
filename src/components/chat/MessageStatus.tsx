
import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface Message {
  status?: 'sending' | 'sent' | 'delivered' | 'seen';
  sending?: boolean;
  failed?: boolean;
}

interface MessageStatusProps {
  message: Message;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ message }) => {
  if (message.failed) {
    return (
      <span className="text-xs text-red-500 flex items-center gap-1">
        <AlertCircle size={10} />
        Failed
      </span>
    );
  }
  
  if (message.status === 'sending' || message.sending) {
    return (
      <span className="text-xs text-gray-400 flex items-center gap-1">
        <Clock size={10} className="animate-pulse" />
        Sending
      </span>
    );
  }
  
  if (message.status === 'seen') {
    return <span className="text-xs text-blue-500">Seen</span>;
  }
  
  if (message.status === 'delivered') {
    return <span className="text-xs text-gray-500">Delivered</span>;
  }
  
  if (message.status === 'sent') {
    return <span className="text-xs text-gray-400">Sent</span>;
  }
  
  return <span className="text-xs text-gray-400">Sent</span>;
};

export default MessageStatus;
