import { Progress } from './progress';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  isUploading: boolean;
  fileName?: string;
  fileSize?: number;
  onCancel?: () => void;
  error?: string;
  success?: boolean;
}

export const UploadProgressDialog = ({
  isOpen,
  onClose,
  progress,
  isUploading,
  fileName,
  fileSize,
  onCancel,
  error,
  success
}: UploadProgressDialogProps) => {
  const { networkInfo, estimateUpload, formatConnectionSpeed } = useNetworkStatus();
  
  const fileSizeMB = fileSize ? fileSize / (1024 * 1024) : 0;
  const uploadEstimate = fileSizeMB > 0 ? estimateUpload(fileSizeMB) : null;
  
  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-6 w-6 text-destructive" />;
    if (success) return <CheckCircle className="h-6 w-6 text-green-500" />;
    return <Upload className="h-6 w-6 text-primary" />;
  };

  const getStatusTitle = () => {
    if (error) return 'Upload Failed';
    if (success) return 'Upload Complete';
    if (isUploading) return 'Uploading...';
    return 'Preparing Upload';
  };

  const getStatusDescription = () => {
    if (error) return error;
    if (success) return 'Your file has been uploaded successfully.';
    if (isUploading) return `Uploading ${fileName || 'file'}...`;
    return 'Getting ready to upload your file.';
  };

  const getRemainingTime = () => {
    if (!uploadEstimate || !isUploading || progress === 0) return null;
    
    const remainingProgress = 100 - progress;
    const estimatedRemaining = (uploadEstimate.estimatedTimeSeconds * remainingProgress) / 100;
    
    if (estimatedRemaining > 60) {
      return `${Math.ceil(estimatedRemaining / 60)} minutes remaining`;
    }
    return `${Math.ceil(estimatedRemaining)} seconds remaining`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <DialogTitle>{getStatusTitle()}</DialogTitle>
              <DialogDescription>{getStatusDescription()}</DialogDescription>
            </div>
            {onCancel && isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Network Status */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Network Status:</span>
            <div className="flex items-center gap-2">
              <NetworkStatusIndicator />
              <span>{formatConnectionSpeed()}</span>
            </div>
          </div>

          {/* File Info */}
          {fileName && (
            <div className="flex items-center justify-between text-sm">
              <span className="truncate flex-1">{fileName}</span>
              {fileSizeMB > 0 && (
                <span className="text-muted-foreground ml-2">
                  {fileSizeMB.toFixed(1)} MB
                </span>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {(isUploading || success) && (
            <div className="space-y-2">
              <Progress value={success ? 100 : progress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{success ? 'Complete' : `${progress}%`}</span>
                {getRemainingTime() && <span>{getRemainingTime()}</span>}
              </div>
            </div>
          )}

          {/* Network Warnings */}
          {uploadEstimate?.warningMessage && !success && !error && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {uploadEstimate.warningMessage}
              </p>
            </div>
          )}

          {/* Data Usage Info */}
          {networkInfo.isMeteredConnection && fileSizeMB > 0 && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              <span>📱 Mobile data usage: {fileSizeMB.toFixed(1)} MB</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          {error && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
          {success && (
            <Button onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};