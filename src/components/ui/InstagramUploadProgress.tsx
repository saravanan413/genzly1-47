import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Upload, Image, Video } from 'lucide-react';

interface UploadStage {
  name: string;
  progress: number;
  completed: boolean;
}

interface InstagramUploadProgressProps {
  open: boolean;
  mediaType: 'image' | 'video';
  stages: {
    optimizing: number;
    uploadingOriginal: number;
    uploadingFeed: number;
    uploadingThumb: number;
    savingMetadata: number;
  };
  onOpenChange?: (open: boolean) => void;
}

export default function InstagramUploadProgress({
  open,
  mediaType,
  stages,
  onOpenChange,
}: InstagramUploadProgressProps) {
  const [currentStage, setCurrentStage] = useState<string>('Preparing...');

  useEffect(() => {
    if (stages.optimizing < 100) {
      setCurrentStage('Optimizing media...');
    } else if (stages.uploadingOriginal < 100) {
      setCurrentStage('Uploading full quality...');
    } else if (stages.uploadingFeed < 100 && mediaType === 'image') {
      setCurrentStage('Uploading feed version...');
    } else if (stages.uploadingThumb < 100) {
      setCurrentStage('Uploading thumbnail...');
    } else if (stages.savingMetadata < 100) {
      setCurrentStage('Saving metadata...');
    } else {
      setCurrentStage('Complete!');
    }
  }, [stages, mediaType]);

  const overallProgress =
    mediaType === 'image'
      ? (stages.optimizing * 0.2 +
          stages.uploadingOriginal * 0.3 +
          stages.uploadingFeed * 0.25 +
          stages.uploadingThumb * 0.15 +
          stages.savingMetadata * 0.1)
      : (stages.optimizing * 0.2 +
          stages.uploadingOriginal * 0.5 +
          stages.uploadingThumb * 0.2 +
          stages.savingMetadata * 0.1);

  const Icon = mediaType === 'image' ? Image : Video;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Uploading {mediaType === 'image' ? 'Photo' : 'Video'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{currentStage}</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Individual Stages */}
          <div className="space-y-3">
            {/* Optimization Stage */}
            <StageItem
              icon={<Icon className="w-4 h-4" />}
              label="Optimizing"
              progress={stages.optimizing}
            />

            {/* Upload Original */}
            <StageItem
              icon={<Upload className="w-4 h-4" />}
              label="Full Quality"
              progress={stages.uploadingOriginal}
            />

            {/* Upload Feed (Images only) */}
            {mediaType === 'image' && (
              <StageItem
                icon={<Image className="w-4 h-4" />}
                label="Feed Version"
                progress={stages.uploadingFeed}
              />
            )}

            {/* Upload Thumbnail */}
            <StageItem
              icon={<Image className="w-4 h-4" />}
              label="Thumbnail"
              progress={stages.uploadingThumb}
            />

            {/* Save Metadata */}
            <StageItem
              icon={<Check className="w-4 h-4" />}
              label="Saving"
              progress={stages.savingMetadata}
            />
          </div>

          {overallProgress === 100 && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="w-5 h-5" />
              <span className="font-medium">Upload Complete!</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StageItemProps {
  icon: React.ReactNode;
  label: string;
  progress: number;
}

function StageItem({ icon, label, progress }: StageItemProps) {
  const isComplete = progress === 100;
  const isActive = progress > 0 && progress < 100;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isComplete
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : isActive
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isComplete ? <Check className="w-4 h-4" /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{label}</span>
          {isActive && <span className="text-xs text-muted-foreground">{progress}%</span>}
        </div>
        {isActive && <Progress value={progress} className="h-1" />}
      </div>
    </div>
  );
}
