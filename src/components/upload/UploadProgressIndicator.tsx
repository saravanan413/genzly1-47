import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RotateCcw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { UploadTask } from '../../services/uploadQueue';

interface UploadProgressIndicatorProps {
  tasks: UploadTask[];
  onRetry: (taskId: string) => void;
  onCancel: (taskId: string) => void;
}

const UploadProgressIndicator: React.FC<UploadProgressIndicatorProps> = ({
  tasks,
  onRetry,
  onCancel
}) => {
  const activeTasks = tasks.filter(task => 
    task.status === 'uploading' || task.status === 'failed' || task.status === 'completed'
  );

  if (activeTasks.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {activeTasks.map(task => (
        <div
          key={task.id}
          className="bg-card/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {task.status === 'uploading' && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
              {task.status === 'completed' && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              {task.status === 'failed' && (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
              <span className="text-sm font-medium">
                {task.mediaType === 'image' ? 'Photo' : 'Video'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {task.status === 'failed' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRetry(task.id)}
                  className="h-6 w-6 p-0"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
              {task.status === 'uploading' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCancel(task.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {task.status === 'uploading' && (
            <div className="space-y-1">
              <Progress value={task.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {Math.round(task.progress)}% uploaded
              </p>
            </div>
          )}

          {task.status === 'completed' && (
            <p className="text-xs text-green-600">Upload complete!</p>
          )}

          {task.status === 'failed' && (
            <p className="text-xs text-destructive">
              {task.error || 'Upload failed'}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default UploadProgressIndicator;