import { useState, useEffect } from 'react';
import { uploadQueue, UploadTask } from '../services/uploadQueue';

export const useUploadQueue = () => {
  const [tasks, setTasks] = useState<UploadTask[]>([]);

  useEffect(() => {
    const unsubscribe = uploadQueue.subscribe(setTasks);
    return unsubscribe;
  }, []);

  const addUpload = async (
    userId: string,
    file: File,
    caption: string,
    mediaType: 'image' | 'video'
  ) => {
    return uploadQueue.addUpload(userId, file, caption, mediaType);
  };

  const retryUpload = (taskId: string) => {
    uploadQueue.retryUpload(taskId);
  };

  const cancelUpload = (taskId: string) => {
    uploadQueue.cancelUpload(taskId);
  };

  const getQueueStatus = () => {
    return uploadQueue.getQueueStatus();
  };

  return {
    tasks,
    addUpload,
    retryUpload,
    cancelUpload,
    getQueueStatus
  };
};