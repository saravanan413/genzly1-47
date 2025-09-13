export const generateThumbnail = async (
  file: File,
  mediaType: 'image' | 'video'
): Promise<string> => {
  if (mediaType === 'image') {
    return generateImageThumbnail(file);
  } else {
    return generateVideoThumbnail(file);
  }
};

const generateImageThumbnail = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Create small thumbnail (150x150 max)
      const maxSize = 150;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to low quality JPEG for small size
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.3);
      resolve(thumbnailDataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

const generateVideoThumbnail = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% of video duration
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      try {
        // Create thumbnail
        const maxSize = 150;
        let { videoWidth: width, videoHeight: height } = video;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(video, 0, 0, width, height);
        
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.3);
        resolve(thumbnailDataUrl);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(video.src);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
};