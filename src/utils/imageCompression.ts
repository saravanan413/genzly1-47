// Lightweight client-side image compression utility
// - Compresses images larger than a threshold
// - Preserves aspect ratio and caps the largest side
// - Converts to WebP when available, falls back to JPEG

export type CompressOptions = {
  maxDimension?: number; // max width/height
  quality?: number; // 0-1
  minSizeToCompress?: number; // bytes threshold to compress
};

export async function compressImageIfNeeded(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  try {
    if (!file.type.startsWith('image/')) return file;

    const maxDimension = options.maxDimension ?? 1920;
    const quality = options.quality ?? 0.9;
    const minSizeToCompress = options.minSizeToCompress ?? 2_000_000; // 2MB

    if (file.size <= minSizeToCompress) return file;

    const objectUrl = URL.createObjectURL(file);
    const img = await loadImage(objectUrl);

    const { targetWidth, targetHeight } = fitWithin(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      maxDimension
    );

    // If no resize benefit, still attempt re-encode to reduce size
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Try WebP first, fallback to JPEG
    const webpBlob = await canvasToBlob(canvas, 'image/webp', quality);
    const targetBlob = webpBlob ?? (await canvasToBlob(canvas, 'image/jpeg', quality));

    URL.revokeObjectURL(objectUrl);

    if (!targetBlob) return file;

    const newExt = targetBlob.type.includes('webp') ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const newName = `${baseName}.${newExt}`;

    return new File([targetBlob], newName, { type: targetBlob.type, lastModified: Date.now() });
  } catch (e) {
    // On any unexpected error, return original file to avoid breaking uploads
    return file;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } else {
      // Fallback for very old browsers
      try {
        const dataUrl = canvas.toDataURL(type, quality);
        const blob = dataURLToBlob(dataUrl);
        resolve(blob);
      } catch {
        resolve(null);
      }
    }
  });
}

function dataURLToBlob(dataUrl: string): Blob | null {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

function fitWithin(width: number, height: number, maxDim: number): { targetWidth: number; targetHeight: number } {
  const scale = Math.min(1, maxDim / Math.max(width, height));
  return {
    targetWidth: Math.round(width * scale),
    targetHeight: Math.round(height * scale),
  };
}
