import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, RotateCw, Crop, Sun, Contrast, Palette, MessageCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';

interface MediaEditorProps {
  media: { type: 'image' | 'video', data: string, file: File };
  onBack: () => void;
  onEditComplete: (editedMedia: { 
    type: 'image' | 'video', 
    data: string, 
    file: File,
    settings: {
      allowComments: boolean;
      hideLikeCount: boolean;
    }
  }) => void;
}

const MediaEditor: React.FC<MediaEditorProps> = ({ media, onBack, onEditComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [rotation, setRotation] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'brightness' | 'contrast' | 'saturation' | 'crop' | 'settings' | null>(null);
  const [allowComments, setAllowComments] = useState(true);
  const [hideLikeCount, setHideLikeCount] = useState(false);

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
    if (saturation[0] !== 100) {
      filters.push(`saturate(${saturation[0]}%)`);
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
  }, [brightness, contrast, saturation, rotation, isImageLoaded]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const enableCrop = () => {
    setActiveFilter(activeFilter === 'crop' ? null : 'crop');
  };

  const handleComplete = async () => {
    const settings = {
      allowComments,
      hideLikeCount
    };

    if (media.type === 'video') {
      // For videos, just pass through for now
      onEditComplete({
        ...media,
        settings
      });
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
        file: editedFile,
        settings
      });
    } catch (error) {
      console.error('Error editing image:', error);
      // Fallback to original media
      onEditComplete({
        ...media,
        settings
      });
    }
  };

  // For videos, show a simple preview without editing capabilities
  if (media.type === 'video') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted/50">
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Edit Video
          </h1>
          <Button variant="default" size="icon" onClick={handleComplete} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
            <Check size={24} />
          </Button>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="p-4 bg-gradient-to-br from-card to-muted/10 border-border/50 shadow-xl">
              <video 
                src={media.data} 
                controls 
                className="w-full max-w-md h-auto object-cover rounded-lg shadow-lg"
              />
            </Card>
          </div>

          {/* Settings */}
          <div className="p-6 bg-background/50 backdrop-blur-sm border-t border-border/50">
            <Card className="p-4 bg-gradient-to-r from-card to-muted/10 border-border/50">
              <h3 className="text-sm font-medium mb-4 text-foreground/80">Post Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-muted-foreground" />
                    <span className="text-sm">Allow Comments</span>
                  </div>
                  <Switch checked={allowComments} onCheckedChange={setAllowComments} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-muted-foreground" />
                    <span className="text-sm">Hide Like Count</span>
                  </div>
                  <Switch checked={hideLikeCount} onCheckedChange={setHideLikeCount} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted/50">
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Edit Photo
        </h1>
        <Button variant="default" size="icon" onClick={handleComplete} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          <Check size={24} />
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Canvas Container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-4 bg-gradient-to-br from-card to-muted/10 border-border/50 shadow-xl">
            <canvas ref={canvasRef} className="rounded-lg shadow-lg max-w-full max-h-[60vh]" />
            <img ref={imageRef} className="hidden" alt="Source" />
          </Card>
        </div>

        {/* Edit Controls */}
        <div className="w-full lg:w-80 p-6 bg-background/50 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-border/50 space-y-6">
          
          {/* Tool Buttons */}
          <Card className="p-4 bg-gradient-to-r from-card to-muted/10 border-border/50">
            <h3 className="text-sm font-medium mb-3 text-foreground/80">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={activeFilter === 'crop' ? 'default' : 'outline'}
                size="sm"
                onClick={enableCrop}
                className="h-12 flex-col gap-1"
              >
                <Crop size={16} />
                <span className="text-xs">Crop</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRotate}
                className="h-12 flex-col gap-1"
              >
                <RotateCw size={16} />
                <span className="text-xs">Rotate</span>
              </Button>
            </div>
          </Card>

          {/* Filters */}
          <Card className="p-4 bg-gradient-to-r from-card to-muted/10 border-border/50">
            <h3 className="text-sm font-medium mb-3 text-foreground/80">Filters</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Button
                variant={activeFilter === 'brightness' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(activeFilter === 'brightness' ? null : 'brightness')}
                className="h-12 flex-col gap-1"
              >
                <Sun size={16} />
                <span className="text-xs">Bright</span>
              </Button>
              <Button
                variant={activeFilter === 'contrast' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(activeFilter === 'contrast' ? null : 'contrast')}
                className="h-12 flex-col gap-1"
              >
                <Contrast size={16} />
                <span className="text-xs">Contrast</span>
              </Button>
              <Button
                variant={activeFilter === 'saturation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(activeFilter === 'saturation' ? null : 'saturation')}
                className="h-12 flex-col gap-1"
              >
                <Palette size={16} />
                <span className="text-xs">Saturate</span>
              </Button>
            </div>

            {/* Filter Controls */}
            {activeFilter === 'brightness' && (
              <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Brightness</label>
                  <span className="text-sm text-muted-foreground">{brightness[0]}%</span>
                </div>
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

            {activeFilter === 'contrast' && (
              <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Contrast</label>
                  <span className="text-sm text-muted-foreground">{contrast[0]}%</span>
                </div>
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

            {activeFilter === 'saturation' && (
              <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Saturation</label>
                  <span className="text-sm text-muted-foreground">{saturation[0]}%</span>
                </div>
                <Slider
                  value={saturation}
                  onValueChange={setSaturation}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
            )}

            {activeFilter === 'crop' && (
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Drag the corners to crop your image</p>
              </div>
            )}
          </Card>

          {/* Post Settings */}
          <Card className="p-4 bg-gradient-to-r from-card to-muted/10 border-border/50">
            <h3 className="text-sm font-medium mb-4 text-foreground/80">Post Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-muted-foreground" />
                  <span className="text-sm">Allow Comments</span>
                </div>
                <Switch checked={allowComments} onCheckedChange={setAllowComments} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-muted-foreground" />
                  <span className="text-sm">Hide Like Count</span>
                </div>
                <Switch checked={hideLikeCount} onCheckedChange={setHideLikeCount} />
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default MediaEditor;