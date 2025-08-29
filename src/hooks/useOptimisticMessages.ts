
import { useState, useCallback } from 'react';
import { ChatMessage } from '../services/chat/types';
import { logger } from '../utils/logger';

interface OptimisticMessage extends ChatMessage {
  isOptimistic?: boolean;
  failed?: boolean;
  tempId?: string;
}

export const useOptimisticMessages = () => {
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);

  const addOptimisticMessage = useCallback((message: Omit<OptimisticMessage, 'id' | 'timestamp'>) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: OptimisticMessage = {
      ...message,
      id: tempId,
      tempId: tempId,
      timestamp: { toDate: () => new Date() },
      status: 'sending',
      delivered: false,
      seen: false,
      isOptimistic: true
    };

    logger.debug('Adding optimistic message:', tempId);
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    return tempId;
  }, []);

  const updateOptimisticMessage = useCallback((tempId: string, updates: Partial<OptimisticMessage>) => {
    logger.debug('Updating optimistic message:', tempId, updates);
    setOptimisticMessages(prev => 
      prev.map(msg => {
        if (msg.tempId === tempId || msg.id === tempId) {
          return { ...msg, ...updates };
        }
        return msg;
      })
    );
  }, []);

  const removeOptimisticMessage = useCallback((tempId: string) => {
    logger.debug('Removing optimistic message:', tempId);
    setOptimisticMessages(prev => prev.filter(msg => 
      msg.tempId !== tempId && msg.id !== tempId
    ));
  }, []);

  const clearOptimisticMessages = useCallback(() => {
    logger.debug('Clearing all optimistic messages');
    setOptimisticMessages([]);
  }, []);

  return {
    optimisticMessages,
    addOptimisticMessage,
    updateOptimisticMessage,
    removeOptimisticMessage,
    clearOptimisticMessages
  };
};
