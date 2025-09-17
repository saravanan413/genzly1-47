
import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CropImageModalProps {
  open: boolean;
  image: string;
  aspect?: number;
  onCancel: () => void;
  onCrop: (croppedImage: string) => void;
}

function getCroppedImg(imageSrc: string, crop: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";
    
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("No canvas context found"));
        return;
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;
      const cropWidth = crop.width * scaleX;
      const cropHeight = crop.height * scaleY;

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        crop.width,
        crop.height
      );
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.85);
    };
    
    image.onerror = () => reject(new Error("Failed to load image"));
  });
}

const CropImageModal: React.FC<CropImageModalProps> = ({
  open,
  image,
  aspect = 1,
  onCancel,
  onCrop,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels || !image) return;
    
    setIsCropping(true);
    try {
      const croppedUrl = await getCroppedImg(image, croppedAreaPixels);
      onCrop(croppedUrl);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsCropping(false);
    }
  };

  if (!open || !image) return null;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md p-0 gap-0" style={{ zIndex: 9999 }}>
        <div className="bg-background rounded-lg shadow-lg overflow-hidden">
          {/* Cropper Container */}
          <div className="relative w-full h-80 bg-muted">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                },
              }}
            />
          </div>
          
          {/* Zoom Slider */}
          <div className="p-4 border-b">
            <label className="text-sm font-medium mb-2 block">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 p-4">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1"
              disabled={isCropping}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCrop} 
              className="flex-1"
              disabled={isCropping || !croppedAreaPixels}
            >
              {isCropping ? 'Processing...' : 'Crop & Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CropImageModal;
