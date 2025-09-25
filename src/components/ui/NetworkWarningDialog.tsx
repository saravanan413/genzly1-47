import { AlertTriangle, Wifi, Smartphone, Clock } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { Badge } from './badge';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { useNetworkStatus, UploadEstimate } from '@/hooks/useNetworkStatus';

interface NetworkWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  uploadEstimate: UploadEstimate;
  fileName: string;
}

export const NetworkWarningDialog = ({
  isOpen,
  onClose,
  onProceed,
  uploadEstimate,
  fileName
}: NetworkWarningDialogProps) => {
  const { networkInfo, formatConnectionSpeed } = useNetworkStatus();

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
    return `${Math.ceil(seconds / 60)} minutes`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <div>
              <DialogTitle>Network Warning</DialogTitle>
              <DialogDescription>
                Please review your connection before proceeding
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Network Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <NetworkStatusIndicator />
              <span className="text-sm font-medium">Current Connection</span>
            </div>
            <div className="text-right text-sm">
              <div>{formatConnectionSpeed()}</div>
              <div className="text-muted-foreground text-xs">
                {networkInfo.connectionType}
              </div>
            </div>
          </div>

          {/* File Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">File:</span>
              <span className="font-medium truncate ml-2 max-w-[200px]">{fileName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{uploadEstimate.dataUsageMB.toFixed(1)} MB</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated time:</span>
              <span className="font-medium">{formatTime(uploadEstimate.estimatedTimeSeconds)}</span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {uploadEstimate.warningMessage}
              </p>
            </div>
          </div>

          {/* Additional Warnings */}
          <div className="space-y-2">
            {networkInfo.isMeteredConnection && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <Smartphone className="h-4 w-4" />
                <span>You're on a metered connection - this will use mobile data</span>
              </div>
            )}
            
            {networkInfo.isSlowConnection && (
              <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                <Wifi className="h-4 w-4" />
                <span>Slow connection detected - upload may take longer</span>
              </div>
            )}
            
            {uploadEstimate.estimatedTimeSeconds > 300 && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Clock className="h-4 w-4" />
                <span>Large file - keep the app open during upload</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onProceed}
            className={uploadEstimate.recommendProceed ? '' : 'bg-orange-600 hover:bg-orange-700'}
          >
            {uploadEstimate.recommendProceed ? 'Continue Upload' : 'Upload Anyway'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};