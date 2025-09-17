
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendChatMessage } from '../services/chat/chatService';
import { logger } from '../utils/logger';

interface MediaUpload {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  file?: File;
}

export const useChatActions = (targetUserId: string) => {
  const { currentUser } = useAuth();
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !currentUser || !targetUserId) {
      logger.debug('Cannot send message - validation failed');
      return;
    }

    logger.debug('Starting message send process...');
    setSendError(null);
    setIsSending(true);

    try {
      const messageId = await sendChatMessage(
        currentUser.uid, 
        targetUserId, 
        messageText
      );

      logger.debug('Message sent successfully:', messageId);
      
    } catch (error: unknown) {
      logger.error('Error sending message:', error);
      setSendError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMedia = async (media: MediaUpload) => {
    if (!currentUser || !targetUserId) {
      logger.debug('Cannot send media - validation failed');
      return;
    }

    logger.debug('Starting media send process...');
    setSendError(null);
    setIsSending(true);

    try {
      const messageId = await sendChatMessage(
        currentUser.uid, 
        targetUserId, 
        media.name, 
        media.type === 'audio' ? 'voice' : media.type as 'text' | 'voice' | 'image' | 'video',
        media.url
      );

      logger.debug('Media sent successfully:', messageId);
      
    } catch (error: unknown) {
      logger.error('Error sending media:', error);
      setSendError('Failed to send media. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const clearError = () => {
    setSendError(null);
  };

  return {
    handleSendMessage,
    handleSendMedia,
    sendingMessage: isSending,
    sendError,
    clearError
  };
};
