import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, RotateCw, Crop, Sun, Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface MediaEditorProps {
  media: { type: 'image' | 'video', data: string, file: File };
  onBack: () => void;
  onEditComplete: (editedMedia: { type: 'image' | 'video', data: string, file: File }) => void;
}

const MediaEditor: React.FC<MediaEditorProps> = ({ media, onBack, onEditComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [rotation, setRotation] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'brightness' | 'contrast' | 'crop' | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || media.type !== 'image') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    img.onload = () => {
      // Set canvas size to fit image
      const maxSize = 400;
      let { width, height } = img;
      
      const scale = Math.min(maxSize / width, maxSize / height);
      width *= scale;
      height *= scale;
      
      canvas.width = width;
      canvas.height = height;
      
      setIsImageLoaded(true);
      drawImage();
    };

    img.src = media.data;
  }, [media.data, media.type]);

  const drawImage = () => {
    if (!canvasRef.current || !imageRef.current || !isImageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for transformations
    ctx.save();

    // Apply rotation
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Apply filters
    const filters = [];
    if (brightness[0] !== 100) {
      filters.push(`brightness(${brightness[0]}%)`);
    }
    if (contrast[0] !== 100) {
      filters.push(`contrast(${contrast[0]}%)`);
    }
    
    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
    }

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Restore context
    ctx.restore();
  };

  useEffect(() => {
    drawImage();
  }, [brightness, contrast, rotation, isImageLoaded]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const enableCrop = () => {
    setActiveFilter(activeFilter === 'crop' ? null : 'crop');
  };

  const handleComplete = async () => {
    if (media.type === 'video') {
      // For videos, just pass through for now
      onEditComplete(media);
      return;
    }

    if (!canvasRef.current || !isImageLoaded) return;

    try {
      // Export canvas as image
      const dataURL = canvasRef.current.toDataURL('image/jpeg', 1.0);

      // Convert dataURL to File
      const response = await fetch(dataURL);
      const blob = await response.blob();
      const editedFile = new File([blob], media.file.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      onEditComplete({
        type: 'image',
        data: dataURL,
        file: editedFile
      });
    } catch (error) {
      console.error('Error editing image:', error);
      // Fallback to original media
      onEditComplete(media);
    }
  };

  // For videos, show a simple preview without editing capabilities
  if (media.type === 'video') {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-lg font-semibold">Edit Video</h1>
          <Button variant="ghost" size="icon" onClick={handleComplete}>
            <Check size={24} />
          </Button>
        </div>

        {/* Video Preview */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <video 
              src={media.data} 
              controls 
              className="w-full h-auto object-cover rounded-lg"
            />
            <p className="text-center text-muted-foreground mt-4">
              Video editing coming soon. Click the checkmark to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-lg font-semibold">Edit Photo</h1>
        <Button variant="ghost" size="icon" onClick={handleComplete}>
          <Check size={24} />
        </Button>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="mb-4 relative">
          <canvas ref={canvasRef} className="border border-border rounded-lg shadow-sm" />
          <img ref={imageRef} className="hidden" alt="Source" />
        </div>

        {/* Edit Controls */}
        <div className="w-full max-w-md space-y-4">
          {/* Tool Buttons */}
          <div className="flex justify-center gap-2">
            <Button
              variant={activeFilter === 'crop' ? 'default' : 'outline'}
              size="sm"
              onClick={enableCrop}
            >
              <Crop size={16} className="mr-1" />
              Crop
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw size={16} className="mr-1" />
              Rotate
            </Button>
            <Button
              variant={activeFilter === 'brightness' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(activeFilter === 'brightness' ? null : 'brightness')}
            >
              <Sun size={16} className="mr-1" />
              Brightness
            </Button>
            <Button
              variant={activeFilter === 'contrast' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(activeFilter === 'contrast' ? null : 'contrast')}
            >
              <Contrast size={16} className="mr-1" />
              Contrast
            </Button>
          </div>

          {/* Brightness Slider */}
          {activeFilter === 'brightness' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Brightness: {brightness[0]}%</label>
              <Slider
                value={brightness}
                onValueChange={setBrightness}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Contrast Slider */}
          {activeFilter === 'contrast' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Contrast: {contrast[0]}%</label>
              <Slider
                value={contrast}
                onValueChange={setContrast}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Crop Instructions */}
          {activeFilter === 'crop' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Drag the corners to crop your image</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaEditor;